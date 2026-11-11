import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, ChevronRight, LockKeyhole, LogOut, Mail, Moon, Shield, SlidersHorizontal, UserRound } from "lucide-react";
import { useApp } from "../context/AppContext";
import { userService } from "../services/userService";
import { Badge, Button, Card, PageHeading } from "../components/UI";

export default function ProfilePage() {
  const { user, setUser, logout, theme, setTheme, resume, config, setConfig } = useApp();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [productUpdates, setProductUpdates] = useState(() => localStorage.getItem(`interviewiq-user-${user.id}-product-updates`) !== "false");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.setItem(`interviewiq-user-${user.id}-product-updates`, String(productUpdates));
  }, [productUpdates, user.id]);
  async function handleLogout() {
    try { await logout(); } catch {}
    navigate("/login", { replace: true });
  }
  async function saveProfile(event) {
    event.preventDefault();
    setError(""); setSaved(false);
    try { const updated = await userService.updateProfile({ name: name.trim(), email: email.trim() }); setUser(updated); setSaved(true); }
    catch (requestError) { setError(requestError.message); }
  }
  return <div className="page-stack"><PageHeading eyebrow="MAKE IT YOURS" title="Your profile" description="A few details about you, all in one place." action={<Button variant="secondary" onClick={handleLogout}><LogOut size={15} /> Log out</Button>} />
    <div className="profile-layout"><div className="profile-main"><Card className="profile-card"><div className="profile-card-heading"><div className="profile-section-icon"><UserRound size={17} /></div><div><h2>Personal information</h2><p>Update your details and how we reach you.</p></div></div><div className="profile-avatar-row"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80" alt="Profile" /><div><strong>Profile photo</strong><small>Photo uploads aren't available yet.</small></div><button className="outline-small" disabled title="Photo uploads aren't available yet">Change photo</button></div><form onSubmit={saveProfile}><label className="field-label">FULL NAME</label><input className="text-input" value={name} onChange={(event) => setName(event.target.value)} /><label className="field-label spaced-label">EMAIL ADDRESS</label><div className="profile-email"><Mail size={15} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>{error && <div className="form-error">{error}</div>}<div className="form-submit-row">{saved && <span className="saved-state"><Check size={14} /> Changes saved</span>}<Button size="small">Save changes</Button></div></form></Card>
    <Card className="profile-card"><div className="profile-card-heading"><div className="profile-section-icon peach"><SlidersHorizontal size={17} /></div><div><h2>Interview preferences</h2><p>We'll use these as your starting point for each session.</p></div></div><div className="preference-row"><div><strong>Preferred role</strong><small>Used as the starting role for practice setup.</small></div><select className="compact-select" value={config.role} onChange={(event) => setConfig({ ...config, role: event.target.value })}>{["Senior Product Designer", "Software Developer", "Product Designer", "Java Developer", "Python Developer", "Data Analyst", "Machine Learning Engineer", "Frontend Developer"].map((roleOption) => <option key={roleOption}>{roleOption}</option>)}</select></div><div className="preference-row"><div><strong>Default difficulty</strong><small>You can always change this before an interview.</small></div><select className="compact-select" value={config.difficulty} onChange={(event) => setConfig({ ...config, difficulty: event.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select></div><div className="preference-row"><div><strong>Default interview style</strong><small>Set the tone for your next practice session.</small></div><select className="compact-select" value={config.type} onChange={(event) => setConfig({ ...config, type: event.target.value })}><option>Technical</option><option>HR</option><option>Mixed</option></select></div></Card>
    <Card className="profile-card"><div className="profile-card-heading"><div className="profile-section-icon blue"><Shield size={17} /></div><div><h2>Privacy & security</h2><p>You're in control of your practice data.</p></div></div><div className="preference-row"><div className="setting-icon"><Bell size={16} /><span><strong>Product updates</strong><small>Occasional notes about new features.</small></span></div><label className="switch"><input type="checkbox" checked={productUpdates} onChange={(event) => setProductUpdates(event.target.checked)} /><span /></label></div><div className="preference-row"><div className="setting-icon"><LockKeyhole size={16} /><span><strong>Practice recordings</strong><small>Only you can access your interview recordings.</small></span></div><Badge tone="green">PRIVATE</Badge></div><div className="preference-row"><div className="setting-icon"><Moon size={16} /><span><strong>Appearance</strong><small>Choose how InterviewIQ looks on your device.</small></span></div><button className="theme-choice" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "Light" : "Dark"} <ChevronRight size={15} /></button></div></Card></div>
    <aside className="profile-aside"><Card className="profile-resume-card"><div className="profile-card-heading"><div className="profile-section-icon purple"><FileIcon /></div><div><h2>Your resume</h2><p>Resume insights for relevant practice.</p></div></div>{resume ? <div className="profile-resume-file"><div className="uploaded-file-icon"><FileIcon /></div><span><strong>{resume.fileName}</strong><small>{resume.skills?.length || 0} skills found</small></span><Badge tone="green">READY</Badge></div> : <div className="resume-empty-mini"><div className="resume-empty-icon"><FileIcon /></div><strong>Nothing here just yet</strong><p>Add your resume to make your interview questions feel more like you.</p><Button variant="secondary" size="small" onClick={() => navigate("/resume")}>Upload a resume <ChevronRight size={14} /></Button></div>}<button className="manage-resume" onClick={() => navigate("/resume")}>Manage resume <ChevronRight size={15} /></button></Card><Card className="account-card"><div className="account-card-top"><div><div className="eyebrow">YOUR ACCOUNT</div><h3>Free plan</h3></div><div className="account-plan-icon"><UserRound size={17} /></div></div><p>Everything you need to get started and find your confidence.</p><div className="plan-divider" /><div className="plan-feature"><Check size={14} /> Practice sessions are available</div><div className="plan-feature"><Check size={14} /> Personalized AI feedback after answers</div><Button className="full-button" disabled title="Plan upgrades aren't available yet">Pro plans unavailable <ChevronRight size={15} /></Button></Card></aside></div>
  </div>;
}

function FileIcon(){return <span className="file-icon-small">▤</span>}
