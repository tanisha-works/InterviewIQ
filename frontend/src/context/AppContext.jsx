import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authService } from "../services/authService";
import { setAccessToken } from "../services/api";

const AppContext = createContext(null);
const DEFAULT_CONFIG = { role: "Senior Product Designer", difficulty: "Medium", type: "Mixed", questions: 8, duration: 20 };

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function removeLegacyAccountCache() {
  localStorage.removeItem("interviewiq-user");
  localStorage.removeItem("interviewiq-resume");
  localStorage.removeItem("interviewiq-config");
}

function clearAccountCache(userId) {
  removeLegacyAccountCache();
  if (userId != null) {
    localStorage.removeItem(`interviewiq-user-${userId}-resume`);
    localStorage.removeItem(`interviewiq-user-${userId}-config`);
    localStorage.removeItem(`interviewiq-user-${userId}-product-updates`);
  }
  sessionStorage.removeItem("interviewiq-session");
  sessionStorage.removeItem("interviewiq-latest-session-id");
  sessionStorage.removeItem("interviewiq-last-score");
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("interviewiq-theme") || "light");
  const [user, setUserState] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [resume, setResume] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [cacheUserId, setCacheUserId] = useState(null);
  const userIdRef = useRef(null);

  function setUser(nextUser) {
    const previousId = userIdRef.current;
    if (previousId != null && previousId !== nextUser?.id) clearAccountCache(previousId);
    userIdRef.current = nextUser?.id ?? null;
    setUserState(nextUser);
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      clearAccountCache(userIdRef.current);
      userIdRef.current = null;
      setAccessToken(null);
      setUserState(null);
      setResume(null);
      setConfig(DEFAULT_CONFIG);
      setCacheUserId(null);
    }
  }

  useEffect(() => {
    let active = true;
    const handleExpired = () => {
      clearAccountCache(userIdRef.current);
      userIdRef.current = null;
      setUserState(null);
      setResume(null);
      setConfig(DEFAULT_CONFIG);
      setCacheUserId(null);
      setAuthLoading(false);
    };
    window.addEventListener("interviewiq:auth-expired", handleExpired);
    removeLegacyAccountCache();
    authService.refresh()
      .then((response) => {
        if (active) {
          userIdRef.current = response.user.id;
          setUserState(response.user);
        }
      })
      .catch(() => {
        setAccessToken(null);
        if (active) setUserState(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
      window.removeEventListener("interviewiq:auth-expired", handleExpired);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setResume(null);
      setConfig(DEFAULT_CONFIG);
      setCacheUserId(null);
      return;
    }
    setCacheUserId(user.id);
    setResume(readJson(`interviewiq-user-${user.id}-resume`, null));
    setConfig(readJson(`interviewiq-user-${user.id}-config`, DEFAULT_CONFIG));
  }, [user?.id]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("interviewiq-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (!user || cacheUserId !== user.id) return;
    const resumeKey = `interviewiq-user-${user.id}-resume`;
    if (resume) localStorage.setItem(resumeKey, JSON.stringify(resume));
    else localStorage.removeItem(resumeKey);
  }, [resume, user, cacheUserId]);
  useEffect(() => {
    if (user && cacheUserId === user.id) {
      localStorage.setItem(`interviewiq-user-${user.id}-config`, JSON.stringify(config));
    }
  }, [config, user, cacheUserId]);

  const value = useMemo(() => ({
    theme, setTheme, user, setUser, authLoading, logout, resume, setResume, config, setConfig,
  }), [theme, user, authLoading, resume, config]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
