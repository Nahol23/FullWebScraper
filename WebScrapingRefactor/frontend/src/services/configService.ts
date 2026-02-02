import type { ApiConfig } from "../types/ApiConfig";

const BASE_URL = "http://localhost:3000/api/v1";

export async function getConfigs(): Promise<ApiConfig[]> {
  const res = await fetch(`${BASE_URL}/configs`);
  return res.json();
}

export async function getConfig(name: string): Promise<ApiConfig> {
  const res = await fetch(`${BASE_URL}/configs/${name}`);
  return res.json();
}

export async function saveConfig(config: ApiConfig): Promise<void> {
  await fetch(`${BASE_URL}/configs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

export async function executeConfig(name: string) {
  const res = await fetch(`${BASE_URL}/configs/${name}/execute`, {
    method: "POST",
  });
  return res.json();
}

export async function analyzeApi(payload: {
  url: string;
  method: "GET" | "POST";
  body?: unknown;
}) {
  const res = await fetch(`${BASE_URL}/configs/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
