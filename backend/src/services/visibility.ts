import { extractBrands } from "./openai";

export interface VisibilityResult {
  brandName: string;
  isVisible: boolean;
  mentionCount: number;
  firstMentionIndex: number | null;
}

export async function checkVisibility(responseText: string): Promise<VisibilityResult[]> {
  const brands = await extractBrands(responseText);

  return brands.map(brand => {
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
