import { apiV1 } from "@/api/client";
import type { HealthResponse } from "@/types/health";

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiV1.get<HealthResponse>("/health");
  return response.data;
}
