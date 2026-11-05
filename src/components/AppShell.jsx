import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, BarChart3, Bell, ChevronDown, FileText, Headphones, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sparkles, Sun, UserRound, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Button } from "./UI";

const primaryLinks = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/resume", label: "Resume analysis", icon: FileText },
  { to: "/setup", label: "Mock interview", icon: Headphones },
  { to: "/history", label: "Interview history", icon: Activity },
  { to: "/report", label: "Performance", icon: BarChart3 },
];

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme, user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const title = primaryLinks.find((link) => location.pathname.startsWith(link.to))?.label || "Your workspace";
  const sidebar = <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
    <div className="brand"><div className="brand-mark"><Sparkles size={18} fill="currentColor" /></div><span>interview<span className="brand-accent">iq</span></span><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
    <div className="workspace-switch"><div className="workspace-avatar">AM</div><div><strong>Alex's workspace</strong><small>Free plan</small></div><ChevronDown size={15} /></div>
    <div className="nav-label">WORKSPACE</div>
    <nav className="side-nav">{primaryLinks.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Mock interview" && <span className="nav-dot" />}</NavLink>)}</nav>
    <div className="sidebar-bottom">
      <div className="upgrade-card"><div className="upgrade-spark"><Sparkles size={15} /></div><strong>Ready to level up?</strong><p>Unlock unlimited practice and deeper insights.</p><button onClick={() => navigate("/setup")}>Explore Pro <span>→</span></button></div>
      <NavLink to="/profile" className={({ isActive }) => `profile-mini ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80" alt="" /><span><strong>{user.name || "Alex Morgan"}</strong><small>Personal account</small></span><Settings size={16} /></NavLink>
    </div>
  </aside>;

  return <div className="app-shell">
    {sidebar}{mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <div className="main-column"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{title}</strong></div><div className="top-actions"><button className="search-trigger" onClick={() => navigate("/history")}><Search size={16} /><span>Search interviews...</span><kbd>⌘ K</kbd></button><button className="icon-button theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Toggle theme">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button><button className="top-avatar" onClick={() => navigate("/profile")}><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80" alt="Profile" /></button></div></header>
      <main className="content"><Outlet /></main>
    </div>
  </div>;
}
