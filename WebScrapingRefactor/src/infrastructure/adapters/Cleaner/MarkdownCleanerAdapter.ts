import { ICleaner } from "../../../domain/ports/ICleaner";

export class MarkdownCleanerAdapter implements ICleaner {
  async clean(raw: string): Promise<string> {
    if (!raw) return "";

    // We only remove things that are objectively "not data"
    const uiJunk = [
      /accept cookies/gi,
      /cookie settings/gi,
      /scroll to top/gi,
      /skip to main content/gi
    ];

    let cleaned = raw;
    uiJunk.forEach(pattern => {
      cleaned = cleaned.replace(pattern, "");
    });

    return cleaned;
  }
}