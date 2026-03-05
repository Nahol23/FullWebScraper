import { httpClient } from "./ioc";

export const scrapingApi = {
  getAllConfigs: () =>
    httpClient.get("/scraping/configs").then((res) => res.data),
  getConfigById: (id: string) =>
    httpClient.get(`/scraping/configs/${id}`).then((res) => res.data),
  createConfig: (config: any) =>
    httpClient.post("/scraping/configs", config).then((res) => res.data),
  updateConfig: (id: string, updates: any) =>
    httpClient.put(`/scraping/configs/${id}`, updates),
  deleteConfig: (id: string) => httpClient.delete(`/scraping/configs/${id}`),
  execute: (id: string, runtimeParams?: any) =>
    httpClient
      .post(`/scraping/configs/${id}/execute`, runtimeParams)
      .then((res) => res.data),
  analyze: (url: string, options?: any) =>
    httpClient
      .post("/scraping/analyze", { url, ...options })
      .then((res) => res.data),
  analyzeById: (id: string, options?: any) =>
    httpClient
      .post(`/scraping/configs/${id}/analyze`, options)
      .then((res) => res.data),
  getExecutionsByConfigId: (configId: string) =>
    httpClient.get(`/scraping/executions/${configId}`).then((res) => res.data),

  deleteExecution: (configId: string, executionId: string) =>
    httpClient.delete(`/scraping/executions/${configId}/${executionId}`),

  downloadExecutionLogs: (
    configName: string,
    format: "json" | "markdown" = "json",
  ) =>
    httpClient
      .get(`/scraping/download/${configName}`, {
        params: { format },
        responseType: "blob",
      })
      .then((res) => res.data),
};
