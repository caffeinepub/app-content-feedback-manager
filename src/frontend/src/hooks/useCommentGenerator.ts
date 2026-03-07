import type { CommentList } from "../backend";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFromList(list: CommentList): string {
  if (!list.templates || list.templates.length === 0) return "";
  const template = pickRandom(list.templates);
  return list.suffix ? `${template} ${list.suffix}` : template;
}

export function useCommentGenerator() {
  const generate = (list: CommentList): string => {
    return generateFromList(list);
  };

  const generateBulk = (
    list: CommentList,
    quantity: number,
    appendSymbol?: string,
  ): string[] => {
    if (!list.templates || list.templates.length === 0) return [];
    const results: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const template = pickRandom(list.templates);
      let comment = list.suffix ? `${template} ${list.suffix}` : template;
      if (appendSymbol?.trim()) {
        comment = `${comment}${appendSymbol.trim()}`;
      }
      results.push(comment);
    }
    return results;
  };

  return { generate, generateBulk };
}
