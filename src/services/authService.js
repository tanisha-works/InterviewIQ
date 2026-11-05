import api from "./api";

export const authService = {
  async login(credentials) {
    if (import.meta.env.VITE_API_URL) return (await api.post("/auth/login", credentials)).data;
    await new Promise((resolve) => setTimeout(resolve, 450));
    return { user: { name: credentials.email.split("@")[0].replace(/[._-]/g, " "), email: credentials.email }, token: "mock-session-token" };
  },
  async signup(details) {
    if (import.meta.env.VITE_API_URL) return (await api.post("/auth/signup", details)).data;
    await new Promise((resolve) => setTimeout(resolve, 450));
    return { user: { name: details.name, email: details.email }, token: "mock-session-token" };
  },
};
