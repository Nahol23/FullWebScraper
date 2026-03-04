export type  ScrapingErrorCode =
  | "ACCESS_DENIED"
  | "PAGE_NOT_FOUND"
  | "FETCH_FAILED"
  | "BROWSER_ERROR"
  | "EXTRACTION_ERROR";



  export class ScrapingError extends Error{

    constructor(
        public readonly code: ScrapingErrorCode,
         message: string,
        public  readonly cause?: unknown,
    )
    {
        super(message)
        this.name = "ScrapingError"
    }


    static accessDenied(url: string, cause?: unknown): ScrapingError {
    return new ScrapingError(
      "ACCESS_DENIED",
      `Accesso negato all'URL: ${url}. Il sito potrebbe aver bloccato la richiesta (Bot detection).`,
      cause
    );
  }

  static pageNotFound(url: string): ScrapingError {
    return new ScrapingError(
      "PAGE_NOT_FOUND", 
      `Risorsa non trovata all'URL: ${url}.`,
    );
  }

  static browserFailed(action: string, cause: unknown): ScrapingError {
    return new ScrapingError(
      "BROWSER_ERROR",
      `Errore critico del browser durante l'azione: ${action}.`,
      cause
    );
  }

  static extractionFailed(details: string, cause?: unknown): ScrapingError {
    return new ScrapingError(
      "EXTRACTION_ERROR",
      `Impossibile estrarre i dati: ${details}. Controlla i selettori CSS.`,
      cause
    );
  }

  static genericFetch(url: string, cause: unknown): ScrapingError {
    return new ScrapingError(
      "FETCH_FAILED",
      `Errore di rete durante il fetch dell'URL: ${url}.`,
      cause
    );
  }
}
  