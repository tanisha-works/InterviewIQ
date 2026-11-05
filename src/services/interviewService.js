import api from "./api";
import { interviews, questions } from "../data/mockData";

export const interviewService = {
  async list() {
    if (import.meta.env.VITE_API_URL) return (await api.get("/interviews")).data;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return interviews;
  },
  async start(config) {
    if (import.meta.env.VITE_API_URL) return (await api.post("/interviews", config)).data;
    return { id: `mock-${Date.now()}`, questions: questions.slice(0, config.questions) };
  },
};
