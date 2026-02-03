import { IApiPort } from "../../../domain/ports/Api/IApiPort";

export class ApiAdapter implements IApiPort {
  async request<T>(options: {
    url: string;
    method: "GET" | "POST";
    body?: any;
    headers?: Record<string, string>;
  }): Promise<T> {
    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...(options.headers || {}),
      };

      if (options.method === "POST") {
        headers["Content-Type"] = "application/json";
      }
      console.log("DEBUG API REQUEST:", {
        url: options.url,
        headers: headers,
        bodySent:
          options.method === "POST" ? JSON.stringify(options.body) : "N/A",
      });

      const response = await fetch(options.url, {
        method: options.method,
        headers: headers,
        body:
          options.method === "POST" && options.body
            ? JSON.stringify(options.body)
            : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(
          `API Request Failed: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data as T;
      } else {
        const text = await response.text();
        return text as unknown as T;
      }
    } catch (error: any) {
      // Wrap and re-throw error for the Use Case to handle
      throw new Error(`[ApiAdapter] ${error.message}`);
    }
  }
}
