import api from "./api";

export const userService = {
  async updateProfile(profile) {
    return (await api.patch("/users/me", profile)).data;
  },
};
