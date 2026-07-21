/**
 * POST /roast
 * Accepts a code snippet and language, calls the Anthropic API,
 * and returns a structured roast result.
 */
import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { RoastCodeBody, RoastCodeResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// System prompt that instructs the LLM to return a structured JSON roast
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
  // Validate request body
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

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({
      error:
        "Anthropic API key not configured. Add ANTHROPIC_API_KEY to your Replit Secrets to enable roasting. Get a key at console.anthropic.com.",
    });
    return;
  }

  const client = new Anthropic({ apiKey });

  req.log.info({ language }, "Roasting code snippet");

  const userMessage = `Please roast the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  // Extract text content from response
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    req.log.error("No text block in Anthropic response");
    res.status(500).json({ error: "LLM returned an unexpected response." });
    return;
  }

  // Parse JSON from LLM output
  let parsed_result: unknown;
  try {
    parsed_result = JSON.parse(textBlock.text.trim());
  } catch {
    req.log.error({ raw: textBlock.text }, "Failed to parse LLM JSON");
    res.status(500).json({ error: "LLM returned malformed JSON." });
    return;
  }

  // Validate against our response schema
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
