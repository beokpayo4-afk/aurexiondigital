export type HealthStatus = "loading" | "ok" | "unavailable";

export type HealthResponse = {
  status: "ok";
  service: string;
};
