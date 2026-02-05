import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FetchConfigsUseCase } from "../application/usecases/FetchConfigsUseCase";
import { ConfigHttpRepository } from "../infrastructure/adapters/ConfigHttpRepository";

import type { ConfigFilters } from "../application/usecases/FetchConfigsUseCase";

const repo = new ConfigHttpRepository();
const fetchConfigsUC = new FetchConfigsUseCase(repo);

export const useConfigs = () => {
  const [filters, setFilters] = useState<ConfigFilters>({
    search: "",
    method: "ALL",
  });

  const {
    data: configs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["configs", filters],
    queryFn: () => fetchConfigsUC.execute(filters),
    placeholderData: (previousData) => previousData,
  });

  const updateFilters = (newFilters: Partial<ConfigFilters>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setFilters((prev : any ) => ({ ...prev, ...newFilters }));
  };

  return {
    configs,
    isLoading,
    isError,
    refetch,
    filters,
    setSearch: (search: string) => updateFilters({ search }),
    setMethod: (method: ConfigFilters["method"]) => updateFilters({ method }),
  };
};
