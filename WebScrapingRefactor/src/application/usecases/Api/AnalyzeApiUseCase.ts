import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { ApiParam } from "../../../domain/value-objects/ApiParam";

export interface AnalyzeApiResponse {
  sampleData: unknown;
  suggestedFields: string[];
  detectedParams: ApiParam[];
  cleanEndpoint: string;
}

// Limite di sicurezza per evitare payload giganti verso il frontend
const MAX_SAMPLE_SIZE = 50;

export class AnalyzeApiUseCase {
  constructor(private readonly apiPort: IApiPort) {}

  async analyze(
    fullUrl: string,
    method: "GET" | "POST",
    body?: Record<string, unknown>,
     headers?: Record<string, string>
  ): Promise<AnalyzeApiResponse> {
    // 1. Validazione e Parsing URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(fullUrl);
    } catch (e) {
      throw new Error(`URL non valido: ${fullUrl}`);
    }

    // 2. Chiamata API (Eseguita in sicurezza)
    let response: unknown;
    try {
      // Nota: Passiamo il body perché nelle tue POST funge da filtro di ricerca
      response = await this.apiPort.request({ url: fullUrl, method, body, headers });
    } catch (e) {
      throw new Error(
        `Errore durante la chiamata API: ${(e as Error).message}`,
      );
    }

    // 3. Estrazione Parametri "Ibrida" (Cruciale per le tue POST di ricerca)
    // Prende i parametri dalla QueryString (?id=1)...
    const urlParams = this.extractQueryParams(parsedUrl.searchParams);
    // ...e li unisce a quelli trovati nel Body JSON ({ id: 1 })
    const bodyParams = this.extractBodyParams(body);

    const detectedParams = [...urlParams, ...bodyParams];

    // 4. Analisi Struttura Dati (Campi suggeriti per la select)
    const suggestedFields = this.extractSuggestedFields(response);

    // 5. Preparazione dati di esempio (Truncati se troppo lunghi)
    const sampleData = this.limitSampleSize(response);

    return {
      sampleData,
      suggestedFields,
      detectedParams,
      cleanEndpoint: parsedUrl.pathname, // Restituisce il path pulito senza query string
    };
  }

  // --- METODI PRIVATI (HELPER) ---

  /**
   * Estrae i parametri dalla Query String dell'URL.
   */
  private extractQueryParams(searchParams: URLSearchParams): ApiParam[] {
    const params: ApiParam[] = [];
    searchParams.forEach((value, key) => {
      params.push({
        key,
        value,
        type: this.inferType(value),
      });
    });
    return params;
  }

  /**
   * Estrae i parametri dal Body JSON (essenziale per "Search via POST").
   * Converte tutto in stringa per l'anteprima, ma inferisce il tipo originale.
   */
  private extractBodyParams(body?: Record<string, unknown>): ApiParam[] {
    if (!body || typeof body !== "object") return [];

    return Object.entries(body).map(([key, value]) => {
      // Gestione sicura di null/undefined
      const stringValue =
        value === null || value === undefined ? "" : String(value);

      return {
        key,
        value: stringValue,
        type: this.inferType(stringValue),
      };
    });
  }

  /**
   * Cerca di capire se una stringa è in realtà un numero o un booleano.
   */
  private inferType(value: string): "string" | "number" | "boolean" {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "false") return "boolean";

    // Logica numerica robusta: non considera stringhe vuote come 0
    if (
      value.trim() !== "" &&
      !isNaN(Number(value)) &&
      isFinite(Number(value))
    ) {
      return "number";
    }

    return "string";
  }

  /**
   * Ispeziona la risposta per trovare le chiavi (nomi delle colonne)
   * Gestisce: Array di oggetti, Oggetto singolo, Risposte vuote.
   */
  private extractSuggestedFields(response: unknown): string[] {
    if (!response || typeof response !== "object") return [];

    // Caso Array: prendiamo le chiavi del primo oggetto valido
    if (Array.isArray(response)) {
      const firstValidItem = response.find(
        (item) => item !== null && typeof item === "object",
      );
      return firstValidItem ? Object.keys(firstValidItem) : [];
    }

    // Caso Oggetto Singolo
    return Object.keys(response as object);
  }

  /**
   * Taglia l'array se è troppo grande per l'anteprima UI.
   */
  private limitSampleSize(response: unknown): unknown {
    if (Array.isArray(response) && response.length > MAX_SAMPLE_SIZE) {
      return response.slice(0, MAX_SAMPLE_SIZE);
    }
    return response;
  }
}
