/**
 * POST /roast
 * Accepts a code snippet and language, calls the Gemini API,
 * and returns a structured roast result.
 */
import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";
import { RoastCodeBody, RoastCodeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are a brilliantly savage but secretly kind code reviewer.
Your job is to roast the code you're given — be witty, specific, and funny, but never cruel.
Always respond with valid JSON matching this exact shape:

{
  "roast": "<1-3 sentences of witty roast referencing specific things in the code>",
  "smellRating": "<exactly one of: Fresh Bread | Slightly Burnt | Getting Toasty | Spaghetti | Burnt Toast | Radioactive Waste>",
  "smellEmoji": "<single emoji that matches the rating: 🍞 | 🥖 | 🔥 | 🍝 | 💀 | ☢️>",
  "improvementTip": "<one specific, actionable, genuine improvement tip for this exact code>",
  "encouragement": "<short, warm, encouraging closing line — 1 sentence>"
}

Rating guide:
- Fresh Bread 🍞: clean, readable, well-structured code
- Slightly Burnt 🥖: minor issues, mostly fine
- Getting Toasty 🔥: noticeable problems, but salvageable
- Spaghetti 🍝: tangled logic, hard to follow
- Burnt Toast 💀: significant issues, needs a rewrite
- Radioactive Waste ☢️: catastrophically bad, may cause physical harm to future maintainers

Be specific — reference actual variable names, patterns, or structures from the submitted code.
Return ONLY the JSON object, no markdown fences, no extra text.`;

router.post("/roast", async (req, res): Promise<void> => {
  const parsed = RoastCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { code, language } = parsed.data;

  if (!code.trim()) {
    res.status(400).json({ error: "Code snippet cannot be empty." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error:
        "Gemini API key not configured. Add GEMINI_API_KEY to your Replit Secrets. Get a key at aistudio.google.com.",
    });
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  req.log.info({ language }, "Roasting code snippet");

  const userMessage = `Please roast the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;

  let rawText: string;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
    });
    rawText = response.text ?? "";
  } catch (err: any) {
    const status = err?.status ?? err?.code;
    if (status === 429 || String(err?.message).includes("RESOURCE_EXHAUSTED")) {
      req.log.warn("Gemini quota exhausted");
      res.status(429).json({
        error:
          "Your Gemini API key has hit its free-tier quota limit. Enable billing on your Google AI project at aistudio.google.com to continue.",
      });
      return;
    }
    req.log.error({ err }, "Gemini API error");
    res.status(502).json({ error: "Gemini API returned an error. Try again shortly." });
    return;
  }

  let parsed_result: unknown;
  try {
    parsed_result = JSON.parse(rawText.trim());
  } catch {
    req.log.error({ raw: rawText }, "Failed to parse LLM JSON");
    res.status(500).json({ error: "LLM returned malformed JSON." });
    return;
  }

  const validated = RoastCodeResponse.safeParse(parsed_result);
  if (!validated.success) {
    req.log.error({ errors: validated.error.message }, "LLM JSON schema mismatch");
    res.status(500).json({ error: "LLM response did not match expected shape." });
    return;
  }

  req.log.info({ smellRating: validated.data.smellRating }, "Roast complete");
  res.json(validated.data);
});

export default router;
