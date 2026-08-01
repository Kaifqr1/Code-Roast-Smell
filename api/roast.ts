/**
 * Vercel Serverless Function — POST /api/roast
 * Automatically routed by Vercel from the /api directory.
 * Set GROQ_API_KEY in your Vercel project environment variables.
 */
import Groq from "groq-sdk";
import { z } from "zod";

const RoastCodeBody = z.object({
  code: z.string().min(1),
  language: z.string(),
});

const RoastCodeResponse = z.object({
  roast: z.string(),
  smellRating: z.string(),
  smellEmoji: z.string(),
  improvementTip: z.string(),
  encouragement: z.string(),
});

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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = RoastCodeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const { code, language } = parsed.data;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error:
        "Groq API key not configured. Add GROQ_API_KEY to your Vercel environment variables. Get a free key at console.groq.com.",
    });
  }

  const groq = new Groq({ apiKey });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Please roast the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
      max_tokens: 8192,
      response_format: { type: "json_object" },
    });

    const rawText = completion.choices[0]?.message?.content ?? "";
    const result = RoastCodeResponse.safeParse(JSON.parse(rawText.trim()));

    if (!result.success) {
      return res.status(500).json({ error: "LLM response did not match expected shape." });
    }

    return res.json(result.data);
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode;
    if (status === 429) {
      return res.status(429).json({ error: "Groq rate limit reached. Wait a moment and try again." });
    }
    if (status === 401) {
      return res.status(401).json({ error: "Invalid Groq API key. Check your GROQ_API_KEY environment variable." });
    }
    return res.status(502).json({ error: "Groq API returned an error. Try again shortly." });
  }
}
