import { useQuery } from "@tanstack/react-query";
import { FetchLogsUseCase } from "../application/usecases/FetchLogsUseCase";
import { ExecutionHttpRepository } from "../infrastructure/adapters/ExecutionHttpRepository";

const repo = new ExecutionHttpRepository();
const fetchLogsUC = new FetchLogsUseCase(repo);

export const useLogs = (autoRefresh = false) => {
  const {
    data: entries = [],
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["executions-logs"],
    queryFn: () => fetchLogsUC.execute(50),
    refetchInterval: autoRefresh ? 3000 : false,
    staleTime: 2000
  });

  return {
    entries,
    loading: isLoading,
    isRefreshing: isFetching,
    refresh: refetch
  };
};
