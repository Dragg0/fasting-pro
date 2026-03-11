import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { image, fastDuration, userGoal } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `You are the Fallow Metabolic Engine — a precise, clinical refeed safety analyzer.

The user just completed a ${fastDuration.toFixed(1)}-hour fast${userGoal ? ` with a goal of "${userGoal}"` : ''}.
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

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      },
    ]);

    const text = result.response.text();

    // Parse JSON from response (handle potential markdown wrapping)
    let analysis;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    } catch {
      return NextResponse.json({
        error: "Failed to parse AI response",
        raw: text
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
