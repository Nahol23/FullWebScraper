import { IApiPort } from "../../../domain/ports/Api/IApiPort";
import { Analysis } from "../../../domain/entities/Analysis";
import {
  findFirstArrayPath,
  getNestedData,
  extractParamsFromUrl,
} from "../../../infrastructure/utils/ObjectUtils";
import { IAnalysisRepository } from "../../../domain/ports/Analyze/IAnalysisRepository";
import { parseJsonFields } from "../../../infrastructure/utils/FindFirstArray";

export class CreateAnalysisUseCase {
  constructor(
    private apiPort: IApiPort,
    private analysisRepo: IAnalysisRepository,
  ) {}

  async execute(
    url: string,
    method: "GET" | "POST",
    body?: any,
    headers?: Record<string, string>,
  ): Promise<Analysis> {
    console.log("[CreateAnalysisUseCase] Starting with:", { url, method, body, headers });
    const rawResponse = (await this.apiPort.request({
      url,
      method,
      body,
      headers,
    })) as any;

    console.log("[CreateAnalysisUseCase] Raw API response:", rawResponse);

    const dataPath = findFirstArrayPath(rawResponse) || "";
    console.log("[CreateAnalysisUseCase] Extracted dataPath:", dataPath);

    // Ottieni tutti i campi dall'intera risposta
    const allFields = parseJsonFields(rawResponse);
    console.log("[CreateAnalysisUseCase] Parsed fields (full):", allFields);

    // Calcola i campi suggeriti in base al dataPath
    let suggestedFields = allFields;
    if (dataPath) {
      const prefix = dataPath + '.';
      suggestedFields = allFields
        .filter(field => field.startsWith(prefix))
        .map(field => field.slice(prefix.length));
      
      // Se dopo il filtraggio non ci sono campi (caso limite), mantieni tutti i campi
      if (suggestedFields.length === 0) {
        suggestedFields = allFields;
      }
    } else {
      // Se non c'è dataPath, ma la risposta è un array diretto, proviamo a estrarre i campi dal primo elemento
      if (Array.isArray(rawResponse) && rawResponse.length > 0) {
        // Usa parseJsonFields sul primo elemento per evitare prefissi come "0."
        suggestedFields = parseJsonFields(rawResponse[0]);
      }
    }

    console.log("[CreateAnalysisUseCase] Suggested fields (relative):", suggestedFields);

    const analysis: Analysis = {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      headers,
      status: "completed",
      discoveredSchema: {
        suggestedFields,
        dataPath,
        params: extractParamsFromUrl(url),
      },
      createdAt: new Date(),
    };

    console.log("[CreateAnalysisUseCase] Created analysis object:", JSON.stringify(analysis, null, 2));

    await this.analysisRepo.save(analysis);
    return analysis;
  }
}