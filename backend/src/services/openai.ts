import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `You are a helpful assistant. Answer the user's question naturally and conversationally.`;

export async function callOpenAI(userPrompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });

  return response.choices[0].message.content || "";
}

export async function llmSentimentScore(
  brand: string,
  passage: string
): Promise<{ score: number; label: string; attributes: Array<{ text: string; sentiment: string }> }> {
  const prompt = `Analyze the sentiment of the following passage about "${brand}" in the context of running shoes.

Passage: "${passage}"

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{
  "score": <number between -1.0 and 1.0>,
  "label": "<positive|negative|neutral|mixed>",
  "attributes": [
    { "text": "<attribute>", "sentiment": "<positive|negative|neutral>" }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300
  });

  const raw = response.choices[0].message.content || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
