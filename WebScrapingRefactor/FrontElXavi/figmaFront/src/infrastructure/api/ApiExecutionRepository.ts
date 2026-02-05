/**
 * Infrastructure: ApiExecutionRepository Implementation
 * Implements IApiExecutionRepository using Axios
 */

import type { ApiConfig } from "../../domain/entities/ApiConfig";
import type { ExecutionResult } from "../../domain/entities/ExecutionResult";
import type { RuntimeParams } from "../../domain/entities/RuntimeParams";
import type { IApiExecutionRepository } from "../../domain/ports/IApiExecutionRepository";
import { ApiExecutionError } from "../../domain/errors/AppError";
import { HttpClient } from "../http/httpClient";

export class ApiExecutionRepository implements IApiExecutionRepository {
  private httpClient: HttpClient;

  constructor(httpClient?: HttpClient) {
    this.httpClient = httpClient || new HttpClient();
  }

  async execute(
    config: ApiConfig,
    runtimeParams?: RuntimeParams
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Build URL with query parameters
      const url = this.buildUrl(config, runtimeParams);

      // Prepare headers
      const headers = { ...config.headers };

      // Execute request
      let response;
      if (config.method === "GET") {
        response = await this.httpClient.get(url, { headers });
      } else if (config.method === "POST") {
        const body = this.buildBody(config, runtimeParams);
        response = await this.httpClient.post(url, body, { headers });
      } else {
        throw new ApiExecutionError(`Unsupported method: ${config.method}`);
      }

      const duration = Date.now() - startTime;

      return {
        status: response.status,
        statusText: response.statusText,
        duration,
        data: response.data,
      };
    } catch (error: any) {
      if (error instanceof ApiExecutionError) {
        throw error;
      }

      if (error.response) {
        // API responded with error status
        throw new ApiExecutionError(
          error.response.statusText || "API request failed",
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        // Request made but no response received
        throw new ApiExecutionError(
          "No response received from API",
          0,
          error.message
        );
      } else {
        // Error setting up request
        throw new ApiExecutionError(
          error.message || "Failed to execute API request",
          undefined,
          error
        );
      }
    }
  }

  private buildUrl(config: ApiConfig, runtimeParams?: RuntimeParams): string {
    const baseUrl = config.baseUrl.endsWith("/")
      ? config.baseUrl.slice(0, -1)
      : config.baseUrl;
    const endpoint = config.endpoint.startsWith("/")
      ? config.endpoint
      : `/${config.endpoint}`;
    let url = `${baseUrl}${endpoint}`;

    // Add query parameters for GET requests
    if (config.method === "GET" && runtimeParams) {
      const params = new URLSearchParams();

      // Add pagination params
      if (runtimeParams.page !== undefined) {
        params.append(
          config.paginationSettings.offsetParam,
          String(runtimeParams.page)
        );
      }
      if (runtimeParams.limit !== undefined) {
        params.append(
          config.paginationSettings.limitParam,
          String(runtimeParams.limit)
        );
      }

      // Add other runtime params
      if (runtimeParams.filters) {
        Object.entries(runtimeParams.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  private buildBody(
    config: ApiConfig,
    runtimeParams?: RuntimeParams
  ): Record<string, any> {
    const body: Record<string, any> = { ...config.bodyParams };

    // Merge runtime params into body
    if (runtimeParams) {
      Object.assign(body, runtimeParams);
    }

    return body;
  }
}
