import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("interviewiq-theme") || "light");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("interviewiq-user")) || { name: "Alex Morgan", email: "alex.morgan@email.com" };
    } catch {
      return { name: "Alex Morgan", email: "alex.morgan@email.com" };
    }
  });
  const [resume, setResume] = useState(() => {
    try { return JSON.parse(localStorage.getItem("interviewiq-resume")); } catch { return null; }
  });
  const [config, setConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem("interviewiq-config")) || { role: "Senior Product Designer", difficulty: "Medium", type: "Mixed", questions: 8, duration: 20 }; }
    catch { return { role: "Senior Product Designer", difficulty: "Medium", type: "Mixed", questions: 8, duration: 20 }; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("interviewiq-theme", theme);
  }, [theme]);
  useEffect(() => localStorage.setItem("interviewiq-user", JSON.stringify(user)), [user]);
  useEffect(() => {
    if (resume) localStorage.setItem("interviewiq-resume", JSON.stringify(resume));
  }, [resume]);
  useEffect(() => localStorage.setItem("interviewiq-config", JSON.stringify(config)), [config]);

  const value = useMemo(() => ({ theme, setTheme, user, setUser, resume, setResume, config, setConfig }), [theme, user, resume, config]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
