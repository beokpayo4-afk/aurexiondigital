import type { HealthStatus } from "@/types/health";

export function healthLabel(status: HealthStatus): string {
  if (status === "ok") {
    return "API connected";
  }
  if (status === "loading") {
    return "Checking API";
  }
  return "API unavailable";
}
