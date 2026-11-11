import api from "./api";

const roleKeys = {
  "Python Developer": "python_developer",
  "Data Analyst": "data_analyst",
};

export const interviewService = {
  async list() {
    return (await api.get("/interview")).data;
  },
  async start(config, resumeId) {
    const role = roleKeys[config.role] || config.role.trim().toLowerCase().replace(/\s+/g, "_");
    const payload = {
      role: role || "general",
      num_questions: Math.min(Math.max(Number(config.questions) || 5, 1), 10),
      resume_id: resumeId ?? null,
      difficulty: config.difficulty || "Medium",
      interview_type: config.type || "Mixed",
      duration_minutes: Number(config.duration) || 20,
    };
    return (await api.post("/interview/start", payload)).data;
  },
  async get(sessionId) {
    return (await api.get(`/interview/${sessionId}`)).data;
  },
  async submitAnswer(sessionId, questionId, audioBlob) {
    const body = new FormData();
    const mimeType = audioBlob.type || "audio/webm";
    const extension = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : mimeType.includes("mpeg") ? "mp3" : "webm";
    body.append("question_id", questionId);
    body.append("audio", new File([audioBlob], `answer.${extension}`, { type: mimeType }));
    return (await api.post(`/interview/${sessionId}/answer`, body)).data;
  },
};
