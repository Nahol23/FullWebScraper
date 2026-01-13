export interface ILanguageDetector{
    detect(text : string): "it" | "en";
}