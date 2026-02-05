import type { Analysis } from '../../types/Analysis';
import type { AnalyzeRepository } from '../../domain/ports/AnalyzeRepository';
import { SchemaResolver } from '../../domain/services/SchemaResolver';

export class SmartAnalyzeUseCase {
  private readonly resolver: SchemaResolver;
  private readonly repo: AnalyzeRepository;

  constructor(repo: AnalyzeRepository) {
    this.repo = repo;
    this.resolver = new SchemaResolver();
  }

  async execute(payload: {
    url: string;
    method: "GET" | "POST";
    body?: unknown;
    headers?: Record<string, string>;
    manualDataPath?: string;
  }): Promise<Analysis> {
    const normalizedUrl = payload.url.trim();

    if (!normalizedUrl.startsWith("http")) {
      throw new Error("URL non valido");
    }

    const cloned = {
      url: normalizedUrl,
      method: payload.method,
      body: payload.body,
      headers: payload.headers
    };

    const result = await this.repo.createAnalysis(cloned);

    result.discoveredSchema = this.resolver.resolve(
      result.discoveredSchema,
      payload.manualDataPath
    );

    return result;
  }
}
