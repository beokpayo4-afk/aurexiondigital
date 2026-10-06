import { useEffect, useState } from "react";

import { getHealth } from "@/services/healthService";
import type { HealthStatus } from "@/types/health";

export function useHealth(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>("loading");

  useEffect(() => {
    let active = true;
    getHealth()
      .then(() => {
        if (active) {
          setStatus("ok");
        }
      })
      .catch(() => {
        if (active) {
          setStatus("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return status;
}
