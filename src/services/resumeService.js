import api from "./api";

export const resumeService = {
  async analyze(file) {
    if (import.meta.env.VITE_API_URL) {
      const body = new FormData();
      body.append("resume", file);
      return (await api.post("/resume/analyze", body, { headers: { "Content-Type": "multipart/form-data" } })).data;
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      fileName: file.name, size: file.size, skills: ["Product strategy", "Figma", "User research", "Prototyping", "Design systems"],
      experience: "6 years · Product design", education: "B.Des. Interaction Design", projects: 8,
    };
  },
};
