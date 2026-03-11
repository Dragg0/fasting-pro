# Fallow AI Intelligence: Implementation Roadmap (v1.0)

This plan outlines the integration of "Live Metabolic Sensing" and "Contextual Intelligence" into the Fallow Next.js architecture.

---

## Phase 1: The "Metabolic Velocity" Engine (Predictive Roadmap)
**Goal:** Shift the Roadmap from static time-based stages to dynamic, data-driven forecasts.

### 1.1 Velocity Heuristics
- **Input:** `startTime` + `accumulated_accelerant_hours`.
- **Logic:** Create a helper function `getMetabolicVelocity(baseH, bonusH)` that calculates a "Compression Factor."
- **UI Update:** 
  - Each Roadmap card gains an "Est. Arrival" countdown.
  - When a user logs a 30m Run (3x multiplier = +1.5h), the AI "shrinks" the time to the next milestone (e.g., *Ketosis in 2h 14m* instead of 3h 44m).

### 1.2 "Contextual Intelligence" Tooltips
- **Logic:** Replace static science text with dynamic strings.
- **Example Template:** `"Based on your [LAST_ACTIVITY] and [FAST_DURATION], your liver is clearing glycogen at [X%] efficiency. AI predicts Autophagy entry in [T-MINUS] hours."`

---

## Phase 2: The "Plate Scan" & Safety Scorer (Refeed AI)
**Goal:** Implement the "Photo Analysis" loop for refeed safety and retention.

### 2.1 The API Route (`/api/analyze-refeed`)
- **Tech:** Gemini 3 Flash (via `google-generativeai`).
- **Prompt:** Use the "Fallow Metabolic Engine" persona to return Grade A-F, Safety Warnings, and Metabolic Impact.
- **Logic:** Must ingest `fastDuration` to trigger "Danger" grades for high-glycemic foods after 24h+.

### 2.2 The "Laser Scan" UI Component
- **Visuals:** A fixed-position modal overlay with a moving horizontal neon-cyan laser line.
- **Timer:** Hard-coded to 1.5s to align with API latency + "High-Tech" perception.
- **Output:** A "Result Card" showing the Grade, Safety Warning, and an "Add to Gallery" button.

### 2.3 Supabase Storage Integration
- **Bucket:** `refeed-images`
- **Privacy:** Signed URLs (valid for 1h) to ensure user privacy while keeping the "Refeed Gallery" feature fast.
- **Retention:** Every photo is logged in a new `refeed_history` table: `id`, `user_id`, `photo_url`, `grade`, `impact_summary`, `timestamp`.

---

## Phase 3: The "Anti-Sycophant" Refinement (UEX)
**Goal:** Keep the user in control and protect the "Dr. P" brand authority.

### 3.1 Verification Sliders
- After the AI identifies "Chicken Breast (~200g)", show a small UI slider allowing the user to tap-to-correct.
- **Result:** High trust. The user feels the AI is an assistant, not a "know-it-all" that might be wrong.

### 3.2 Premium Gating
- Gated: AI Photo Scans, Predictive Forecasting, Detailed Refeed Prescriptions.
- Free: Basic Timer, Metabolic Anatomy (static), Static Roadmap.

---

## Success Metrics (March/April 2026)
1. **Response Time:** Sub-2 seconds for all AI interactions.
2. **Safety Trust:** Users reporting "I didn't know that was a bad refeed choice."
3. **Ad Performance:** CTR for "Dangerous Apple" hook > 3.5%.

---
**Gazelam Strategy:** *Precision over Chat. Sensing over Suggestion.*
