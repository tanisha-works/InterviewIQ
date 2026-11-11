import api from "./api";

export const resumeService = {
  async analyze(file) {
    const body = new FormData();
    body.append("file", file);
    const { data } = await api.post("/resume/upload", body);
    return {
      id: data.id,
      fileName: data.filename,
      size: file.size,
      skills: data.skills || [],
    };
  },
  async remove(resumeId) {
    await api.delete(`/resume/${resumeId}`);
  },
};
