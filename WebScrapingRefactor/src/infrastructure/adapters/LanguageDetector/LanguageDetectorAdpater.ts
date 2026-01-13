import { franc } from "franc-min";
import { ILanguageDetector } from "../../../domain/ports/ILanguageDetector";

export class LanguageDetectorAdapter implements ILanguageDetector {
  detect(text: string): "it" | "en" {
    const code = franc(text || "");
    if (code === "ita") return "it";
    if (code === "eng") return "en";
    return "en"; // fallback
  }
}
