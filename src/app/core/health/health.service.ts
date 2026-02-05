import axios from "axios";
import { API_URL } from "../api/http.service";
import { API_ENDPOINTS } from "../api/api.endpoints";

export type HealthStatus = "healthy" | "unhealthy" | "checking";

export type HealthCheck = {
  status: HealthStatus;
  timestamp: number;
  apiAvailable: boolean;
  responseTime?: number;
};

export class HealthService {
  async checkHealth(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      await axios.get(`${API_URL}${API_ENDPOINTS.health.check}`, {
        timeout: 5000,
        params: { page: 0, size: 1 },
      });
      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        timestamp: Date.now(),
        apiAvailable: true,
        responseTime,
      };
    } catch {
      return {
        status: "unhealthy",
        timestamp: Date.now(),
        apiAvailable: false,
      };
    }
  }

  async checkLiveness(): Promise<boolean> {
    try {
      await axios.get(`${API_URL}${API_ENDPOINTS.health.check}`, {
        timeout: 3000,
        params: { page: 0, size: 1 },
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkReadiness(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${API_URL}${API_ENDPOINTS.health.check}`,
        {
          timeout: 3000,
          params: { page: 0, size: 1 },
        },
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const healthService = new HealthService();
