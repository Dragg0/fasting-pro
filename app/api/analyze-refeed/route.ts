import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30; // Allow up to 30s for AI response

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (parseErr: any) {
      return NextResponse.json({ error: "Request too large or malformed: " + (parseErr.message || '') }, { status: 400 });
    }
    const { image, fastDuration, userGoal } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const hours = typeof fastDuration === 'number' ? fastDuration.toFixed(1) : '0';

    const prompt = `You are the Fallow Metabolic Engine — a precise, clinical refeed safety analyzer.

The user just completed a ${hours}-hour fast${userGoal ? ` with a goal of "${userGoal}"` : ''}.
They are about to break their fast with the food shown in this photo.

Analyze the plate and respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "refeed_grade": "<letter grade A+ through F>",
  "primary_components": ["<food item 1>", "<food item 2>", ...],
  "estimated_portions": ["<item 1> (~Xg)", "<item 2> (~Xg)", ...],
  "metabolic_impact": "<2-3 sentences on how this meal interacts with the user's metabolic state post-fast>",
  "safety_warning": "<specific warning if high-risk for this fast duration, or 'None' if safe>",
  "recommendation": "<1 sentence: what to add, remove, or eat first>",
  "estimated_macros": {
    "protein": "<Xg>",
    "fat": "<Xg>",
    "carbs": "<Xg>",
    "fiber": "<Xg>",
    "calories": "<X>"
  }
}

Grading criteria based on fast duration:
- Under 16h: Almost anything is fine. Grade generously.
- 16-24h: Favor protein + fat. Penalize high sugar/processed carbs.
- 24-48h: Strict. Bone broth, lean protein, avocado = A. Bread, fruit, sugar = D or lower.
- 48h+: Very strict. High glycemic foods are dangerous (refeeding syndrome risk). Only gentle foods get above C.

Be precise with portion estimates. Be direct and clinical, not preachy.`;

    // Extract base64 data (strip data URL prefix if present)
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeType = image.includes("data:")
      ? image.split(";")[0].split(":")[1]
      : "image/jpeg";

    // Use REST API directly to avoid SDK model name validation issues
    const model = "gemini-3-flash-preview";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
    });
    clearTimeout(timeout);

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message || "Gemini API error" }, { status: 500 });
    }

    // Gemini 3 Flash returns multiple parts — collect ALL text from all parts
    const parts = data.candidates?.[0]?.content?.parts || [];
    const allText = parts
      .filter((p: any) => p.text)
      .map((p: any) => p.text)
      .join('\n');

    if (!allText) {
      return NextResponse.json({
        error: "No text in AI response",
        raw: JSON.stringify(data).slice(0, 500)
      }, { status: 500 });
    }

    // Strip markdown fences if present
    let cleaned = allText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    // Try direct parse first
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      // Fix common issues: literal newlines inside JSON string values
      try {
        const fixed = cleaned
          .replace(/\n/g, '\\n')   // escape literal newlines
          .replace(/\r/g, '\\r')   // escape returns
          .replace(/\t/g, '\\t');  // escape tabs
        // But don't double-escape already escaped ones
        const dedoubled = fixed.replace(/\\\\n/g, '\\n').replace(/\\\\r/g, '\\r').replace(/\\\\t/g, '\\t');
        analysis = JSON.parse(dedoubled);
      } catch {
        // Find balanced JSON object
        try {
          let depth = 0, start = -1, inStr = false, escaped = false;
          for (let i = 0; i < cleaned.length; i++) {
            const c = cleaned[i];
            if (escaped) { escaped = false; continue; }
            if (c === '\\') { escaped = true; continue; }
            if (c === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (c === '{') { if (depth === 0) start = i; depth++; }
            if (c === '}') { depth--; if (depth === 0 && start >= 0) {
              const jsonStr = cleaned.slice(start, i + 1);
              analysis = JSON.parse(jsonStr);
              break;
            }}
          }
          if (!analysis) throw new Error("No balanced JSON");
        } catch {
          // Last-resort salvage: extract whatever fields we can from non-JSON text
          const extractStr = (key: string) => {
            const m = cleaned.match(new RegExp(`"?${key}"?\\s*[:=-]\\s*"?([^"\\n}]+)"?`, 'i'));
            return m ? m[1].trim() : '';
          };
          const extractArrLoose = (key: string) => {
            const m = cleaned.match(new RegExp(`"?${key}"?\\s*[:=-]\\s*\\[([^\\]]*)\\]`, 'i'));
            return m ? m[1].split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean) : [];
          };
          const maybeGrade = extractStr('refeed_grade') || extractStr('grade') || 'C';
          analysis = {
            refeed_grade: maybeGrade,
            primary_components: extractArrLoose('primary_components'),
            estimated_portions: extractArrLoose('estimated_portions'),
            metabolic_impact: extractStr('metabolic_impact'),
            safety_warning: extractStr('safety_warning') || 'None',
            recommendation: extractStr('recommendation'),
            estimated_macros: null,
          };
        }
      }
    }

    const normalizeArray = (v: any) => Array.isArray(v) ? v.filter(Boolean) : [];
    const normalizeString = (v: any, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
    const normalizeMacros = (v: any) => {
      if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
      const out: Record<string, string> = {};
      for (const key of ['protein', 'fat', 'carbs', 'fiber', 'calories']) {
        const val = v[key];
        if (typeof val === 'string' && val.trim()) out[key] = val.trim();
      }
      return Object.keys(out).length ? out : null;
    };

    const normalized = {
      refeed_grade: normalizeString(analysis?.refeed_grade, 'C'),
      primary_components: normalizeArray(analysis?.primary_components),
      estimated_portions: normalizeArray(analysis?.estimated_portions),
      metabolic_impact: normalizeString(
        analysis?.metabolic_impact,
        'Analysis incomplete — try rescanning in better light or with the full plate visible.'
      ),
      safety_warning: normalizeString(analysis?.safety_warning, 'None'),
      recommendation: normalizeString(
        analysis?.recommendation,
        'Rescan for fuller analysis or choose a gentler first meal.'
      ),
      estimated_macros: normalizeMacros(analysis?.estimated_macros),
      debug_raw_present: true,
    };

    console.log('Plate scan normalized result:', JSON.stringify({
      grade: normalized.refeed_grade,
      primary_components_count: normalized.primary_components.length,
      estimated_portions_count: normalized.estimated_portions.length,
      has_metabolic_impact: !!normalized.metabolic_impact,
      has_macros: !!normalized.estimated_macros,
      raw_preview: cleaned.slice(0, 400)
    }));

    return NextResponse.json(normalized);

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({
      error: error.message || "Metabolic analysis failed"
    }, { status: 500 });
  }
}
