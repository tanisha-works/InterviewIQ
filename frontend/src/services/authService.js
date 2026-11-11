import api, { getCsrfToken, setAccessToken } from "./api";

let refreshRequest = null;

function saveTokenResponse(response) {
  setAccessToken(response.access_token);
  return response;
}

export const authService = {
  async login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    return saveTokenResponse(data);
  },
  async signup(details) {
    const { data } = await api.post("/auth/signup", details);
    return saveTokenResponse(data);
  },
  async refresh() {
    if (refreshRequest) return refreshRequest;
    const csrfToken = getCsrfToken();
    if (!csrfToken) throw new Error("No active session.");
    refreshRequest = api.post("/auth/refresh", null, {
      headers: { "X-CSRF-Token": csrfToken },
    }).then(({ data }) => saveTokenResponse(data)).finally(() => {
      refreshRequest = null;
    });
    return refreshRequest;
  },
  async logout() {
    try {
      const csrfToken = getCsrfToken();
      await api.post("/auth/logout", null, {
        headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
      });
    } finally {
      setAccessToken(null);
    }
  },
  async me() {
    return (await api.get("/auth/me")).data;
  },
};
