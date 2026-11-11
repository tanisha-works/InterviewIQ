import api from "./api";
import { interviewService } from "./interviewService";

const pendingReports = new Map();

export const reportService = {
  async getSession(sessionId) {
    const key = String(sessionId);
    if (pendingReports.has(key)) return pendingReports.get(key);
    const url = `/evaluation/session/${sessionId}`;
    const validateStatus = (status) => (status >= 200 && status < 300) || status === 304;
    const request = (async () => {
      const response = await api.get(url, {
        headers: { "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
        validateStatus,
      });
      if (response.status !== 304) return response.data;

      const retry = await api.get(`${url}?fresh=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache, no-store", Pragma: "no-cache" },
        validateStatus,
      });
      if (retry.status === 304) throw new Error("The report is not available yet. Please retry in a moment.");
      return retry.data;
    })();
    pendingReports.set(key, request);
    try {
      return await request;
    } finally {
      if (pendingReports.get(key) === request) pendingReports.delete(key);
    }
  },
  async getLatest(sessionId) {
    const selectedId = sessionId || sessionStorage.getItem("interviewiq-latest-session-id");
    if (selectedId) return this.getSession(selectedId);
    const sessions = await interviewService.list();
    return sessions.length ? this.getSession(sessions[0].id) : null;
  },
};
