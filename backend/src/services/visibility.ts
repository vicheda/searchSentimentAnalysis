const BRANDS = ["Brooks", "Nike", "Adidas", "Hoka"];

export interface VisibilityResult {
  brandName: string;
  isVisible: boolean;
  mentionCount: number;
  firstMentionIndex: number | null;
}

export function checkVisibility(responseText: string): VisibilityResult[] {
  return BRANDS.map(brand => {
    const regex = new RegExp(brand, "gi");
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
