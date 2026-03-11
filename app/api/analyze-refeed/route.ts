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

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } },
          ],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

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

    // Try multiple parsing strategies
    let analysis;
    try {
      // Strategy 1: Direct parse
      analysis = JSON.parse(allText.trim());
    } catch {
      try {
        // Strategy 2: Strip markdown fences
        const cleaned = allText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        analysis = JSON.parse(cleaned);
      } catch {
        try {
          // Strategy 3: Find JSON object with balanced braces
          let depth = 0, start = -1;
          for (let i = 0; i < allText.length; i++) {
            if (allText[i] === '{') { if (depth === 0) start = i; depth++; }
            if (allText[i] === '}') { depth--; if (depth === 0 && start >= 0) {
              analysis = JSON.parse(allText.slice(start, i + 1));
              break;
            }}
          }
          if (!analysis) throw new Error("No balanced JSON found");
        } catch (e: any) {
          // Strategy 4: Find refeed_grade field and reconstruct
          const gradeMatch = allText.match(/"refeed_grade"\s*:\s*"([^"]+)"/);
          if (gradeMatch) {
            // Partial extraction fallback
            const extract = (key: string) => {
              const m = allText.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
              return m ? m[1] : '';
            };
            analysis = {
              refeed_grade: gradeMatch[1],
              primary_components: (allText.match(new RegExp('"primary_components"\\s*:\\s*\\[([^\\]]*)\\]'))?.[1] || '').split(',').map((s: string) => s.replace(/"/g, '').trim()).filter(Boolean),
              metabolic_impact: extract('metabolic_impact'),
              safety_warning: extract('safety_warning'),
              recommendation: extract('recommendation'),
            };
          } else {
            return NextResponse.json({
              error: "Could not parse AI response",
              raw: allText.slice(0, 800)
            }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({
      error: error.message || "Metabolic analysis failed"
    }, { status: 500 });
  }
}
