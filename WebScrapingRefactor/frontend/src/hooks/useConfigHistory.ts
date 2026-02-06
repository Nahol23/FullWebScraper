import { useQuery } from "@tanstack/react-query";
import { ExecutionHttpRepository } from "../infrastructure/adapters/ExecutionHttpRepository";

const repo = new ExecutionHttpRepository();

export const useConfigHistory = (configId: string) => {
  return useQuery({
    queryKey: ["history", configId],
    queryFn: () => repo.getLogsByConfig(configId),
    enabled: !!configId, // evita chiamate inutili
  });
};
