import api from "./api";
import { radarData } from "../data/mockData";

export const reportService = {
  async getLatest() {
    if (import.meta.env.VITE_API_URL) return (await api.get("/reports/latest")).data;
    return { score: 86, communication: 88, relevance: 82, confidence: 79, completeness: 84, radar: radarData };
  },
};
