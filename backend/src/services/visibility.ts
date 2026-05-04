import { extractBrands } from "./openai";

export interface VisibilityResult {
  brandName: string;
  isVisible: boolean;
  mentionCount: number;
  firstMentionIndex: number | null;
}

const TRACKED = ["Brooks", "Nike", "Adidas", "Hoka"];

// Checks the tracked brands plus any additional brands extracted by the LLM
// and gathers visibility info for the union of those names.
export async function checkVisibility(responseText: string): Promise<VisibilityResult[]> {
  const extracted = await extractBrands(responseText).catch(() => []);

  const names = Array.from(new Set([...TRACKED, ...extracted]));

  return names.map(brand => {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = [...responseText.matchAll(regex)];
    const firstIndex = matches.length > 0 ? matches[0].index ?? null : null;

    return {
      brandName: brand,
      isVisible: matches.length > 0,
      mentionCount: matches.length,
      firstMentionIndex: firstIndex
    };
  });
}
