import Sentiment from "sentiment";
import { llmSentimentScore } from "./openai";

const analyzer = new Sentiment();

export interface BrandAttribute {
  text: string;
  sentiment: string;
}

export interface SentimentResult {
  sentimentScore: number;
  sentimentLabel: string;
  scoringMethod: string;
  attributes: BrandAttribute[];
}

function extractBrandPassages(text: string, brand: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.filter(s => s.toLowerCase().includes(brand.toLowerCase()));
}

function ruleBasedScore(passage: string): number {
  const result = analyzer.analyze(passage);
  return Math.max(-1, Math.min(1, result.comparative));
}

function isContextual(passage: string): boolean {
  const contextualWords = ["but", "however", "although", "compared", "better for", "worse for", "depends"];
  return contextualWords.some(w => passage.toLowerCase().includes(w));
}

function extractRuleAttributes(passage: string, score: number): BrandAttribute[] {
  const positiveWords = ["comfortable", "durable", "lightweight", "quality", "excellent", "great", "best", "top", "superior", "recommended", "supportive", "stable", "cushioned"];
  const negativeWords = ["expensive", "heavy", "poor", "bad", "worst", "overpriced", "stiff", "narrow", "uncomfortable"];

  const attrs: BrandAttribute[] = [];
  const lower = passage.toLowerCase();

  positiveWords.forEach(word => {
    if (lower.includes(word)) attrs.push({ text: word, sentiment: "positive" });
  });
  negativeWords.forEach(word => {
    if (lower.includes(word)) attrs.push({ text: word, sentiment: "negative" });
  });

  if (attrs.length === 0 && passage.trim().length > 0) {
    const label = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
    attrs.push({ text: passage.trim().substring(0, 30), sentiment: label });
  }

  return attrs;
}

function aggregateScores(passageScores: number[]): number {
  if (passageScores.length === 0) return 0;
  const avg = passageScores.reduce((a, b) => a + b, 0) / passageScores.length;
  return Math.round(avg * 100) / 100;
}

function scoreToLabel(score: number): string {
  if (score >= 0.2) return "positive";
  if (score <= -0.2) return "negative";
  return "mixed";
}

function deduplicateAttributes(attrs: BrandAttribute[]): BrandAttribute[] {
  const seen = new Set<string>();
  return attrs.filter(a => {
    if (seen.has(a.text)) return false;
    seen.add(a.text);
    return true;
  });
}

export async function analyzeSentiment(responseText: string, brand: string): Promise<SentimentResult | null> {
  const passages = extractBrandPassages(responseText, brand);
  if (passages.length === 0) return null;

  const passageScores: number[] = [];
  const allAttributes: BrandAttribute[] = [];
  let method = "rule-based";

  for (const passage of passages) {
    const ruleScore = ruleBasedScore(passage);
    const ambiguous = Math.abs(ruleScore) <= 0.2 || isContextual(passage);

    if (ambiguous) {
      try {
        const llmResult = await llmSentimentScore(brand, passage);
        passageScores.push(llmResult.score);
        allAttributes.push(...llmResult.attributes);
        method = "hybrid";
      } catch {
        passageScores.push(ruleScore);
        allAttributes.push(...extractRuleAttributes(passage, ruleScore));
      }
    } else {
      passageScores.push(ruleScore);
      allAttributes.push(...extractRuleAttributes(passage, ruleScore));
    }
  }

  const finalScore = aggregateScores(passageScores);

  return {
    sentimentScore: finalScore,
    sentimentLabel: scoreToLabel(finalScore),
    scoringMethod: method,
    attributes: deduplicateAttributes(allAttributes).slice(0, 5)
  };
}
