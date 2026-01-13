import { ICleaner } from "../../domain/ports/ICleaner";

export class CleanMarkdownUseCase {
  constructor(private cleaner: ICleaner) {}

  async execute(raw: string): Promise<string> {
    // Phase 1: Call the adapter for initial sanitization
    let content = await this.cleaner.clean(raw);

    // Phase 2: Domain Normalization (Native JS only)
    
    return content
      // 1. Ensure consistency: Replace carriage returns with standard newlines
      .replace(/\r\n/g, "\n")
      // 2. Fix spacing: Ensure there is exactly one empty line between blocks 
      // of text, but never three or more.
      .replace(/\n{3,}/g, "\n\n")
      // 3. Table protection: Ensure tables start on a new line so they render correctly
      .replace(/([^\n])\n\|/g, "$1\n\n|")
      // 4. Final trim: Remove leading/trailing whitespace from the whole file
      .trim();
    }
  }
      
      
      