/**
 * POST /roast
 * Accepts a code snippet and language, calls the Groq API,
 * and returns a structured roast result.
 */
import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error:
        "Groq API key not configured. Add GROQ_API_KEY to your Replit Secrets. Get a free key at console.groq.com.",
    });
    return;
  }

  const groq = new Groq({ apiKey });

  req.log.info({ language }, "Roasting code snippet");

  const userMessage = `Please roast the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;

  let rawText: string;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 8192,
      response_format: { type: "json_object" },
    });
    rawText = completion.choices[0]?.message?.content ?? "";
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode;
    if (status === 429) {
      req.log.warn("Groq rate limit hit");
      res.status(429).json({
        error: "Groq rate limit reached. Wait a moment and try again.",
      });
      return;
    }
    if (status === 401) {
      req.log.warn("Groq auth error");
      res.status(401).json({
        error: "Invalid Groq API key. Check your GROQ_API_KEY secret.",
      });
      return;
    }
    req.log.error({ err }, "Groq API error");
    res.status(502).json({ error: "Groq API returned an error. Try again shortly." });
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
