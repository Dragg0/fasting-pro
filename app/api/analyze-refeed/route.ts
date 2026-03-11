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

    // Gemini 3 Flash may return multiple parts (thinking + text)
    // Find the part that contains actual text (not just thoughtSignature)
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => p.text && !p.thoughtSignature)
      || parts.find((p: any) => p.text);
    const text = textPart?.text;

    if (!text) {
      return NextResponse.json({
        error: "No text in AI response",
        raw: JSON.stringify(parts.map((p: any) => Object.keys(p))).slice(0, 500)
      }, { status: 500 });
    }

    // Parse JSON from response (handle markdown code fences, extra text, etc.)
    let analysis;
    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found");
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseErr: any) {
      return NextResponse.json({
        error: "Failed to parse AI response: " + parseErr.message,
        raw: text.slice(0, 500)
      }, { status: 500 });
    }

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({
      error: error.message || "Metabolic analysis failed"
    }, { status: 500 });
  }
}
