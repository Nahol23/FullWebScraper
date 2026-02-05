import { useState } from "react";
import type { Analysis } from "../types/Analysis";
import { SmartAnalyzeUseCase } from "../application/usecases/SmartAnalyzeUseCase";
import { AnalyzeHttpRepository } from "../infrastructure/adapters/AnalyzeHttpRepository";

const analyzeRepo = new AnalyzeHttpRepository();
const smartAnalyzeUC = new SmartAnalyzeUseCase(analyzeRepo);

export const useSmartAnalyze = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (payload: {
    url: string;
    method: "GET" | "POST";
    body?: unknown;
    headers?: Record<string, string>;
    manualDataPath?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const result = await smartAnalyzeUC.execute(payload);
      setAnalysis(result);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore imprevisto";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    analyze,
    loading,
    analysis,
    error,
    reset: () => {
      setAnalysis(null);
      setError(null);
    }
  };
};
