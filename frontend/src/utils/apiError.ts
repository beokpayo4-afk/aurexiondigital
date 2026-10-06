import axios from "axios";

export function apiErrorMessage(error: unknown, fallback = "The request could not be completed."): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    if (!error.response) {
      return "The service is unavailable right now.";
    }
  }
  return fallback;
}
