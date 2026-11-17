import api from "./api";

export const userService = {
  async updateProfile(profile) {
    return (await api.patch("/users/me", profile)).data;
  },
  async uploadProfilePhoto(file) {
    const body = new FormData();
    body.append("photo", file);
    return api.put("/users/me/photo", body);
  },
  async getProfilePhoto() {
    return api.get("/users/me/photo", { responseType: "blob" });
  },
};
