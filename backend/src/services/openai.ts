import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = `You are a helpful assistant. Answer the user's question naturally and conversationally. When the prompt involves product or brand recommendations, factor in public review language, forum chatter, and current online sentiment when relevant.`;

export async function extractBrands(responseText: string): Promise<string[]> {
  const prompt = `Extract all shoe or apparel brand names mentioned in the following text. Return ONLY a JSON array of brand name strings (e.g., ["Nike", "Brooks", "Adidas"]). Use proper capitalization. If no brands are found, return [].

Text:
${responseText}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 150
  });

  try {
    const raw = response.choices[0].message.content || "[]";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
  const prompt = `Analyze the sentiment of the following passage about "${brand}" in the context of running shoes. Use the passage together with likely public review language and online discussion patterns when relevant.

Passage: "${passage}"

Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{
  "score": <number between -1.0 and 1.0>,
  "label": "<positive|negative|neutral|mixed>",
  "attributes": [
    { "text": "<sentiment quality/characteristic like comfort, durability, weight, support, cushioning - NOT product names>", "sentiment": "<positive|negative|neutral>" }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL!,
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 300
  });

  const raw = response.choices[0].message.content || "{}";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
