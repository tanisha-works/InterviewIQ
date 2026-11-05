import api from "./api";

export const userService = {
  async updateProfile(profile) {
    if (import.meta.env.VITE_API_URL) return (await api.patch("/users/me", profile)).data;
    await new Promise((resolve) => setTimeout(resolve, 350));
    return profile;
  },
};
