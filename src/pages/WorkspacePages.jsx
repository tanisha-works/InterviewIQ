import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Award, BarChart3, CalendarDays, Check, ChevronDown, Clock3, Download, FileText, Filter, Lightbulb, MessageCircle, MoreHorizontal, Plus, Search, Sparkles, Target, TrendingUp, Volume2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { activities, interviews, radarData } from "../data/mockData";
import { Badge, Button, Card, EmptyState, PageHeading, SectionTitle } from "../components/UI";
import { PerformanceChart, RadarSkills, SkillsChart } from "../components/Charts";

const statCards = [
  { label: "Interviews completed", value: "12", change: "+3 this month", icon: MessageCircle, tone: "purple", positive: true },
  { label: "Average score", value: "82<span class='unit'>/100</span>", change: "+8% vs. last month", icon: TrendingUp, tone: "blue", positive: true },
  { label: "Strongest skill", value: "Clarity", change: "Top 12% of candidates", icon: Award, tone: "green", positive: true },
  { label: "Focus area", value: "Confidence", change: "Room to improve", icon: Target, tone: "orange", positive: false },
];

export function DashboardPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  return <div className="page-stack">
    <PageHeading eyebrow="WEDNESDAY, OCTOBER 30, 2024" title={`Good morning, ${user.name.split(" ")[0]} ✨`} description="A little practice today goes a long way. You're building something great." action={<Button onClick={() => navigate("/setup")}><Plus size={16} /> Start an interview</Button>} />
    <div className="stat-grid">{statCards.map(({ label, value, change, icon: Icon, tone, positive }) => <Card className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label">{label}</div><div className="stat-value" dangerouslySetInnerHTML={{ __html: value }} /><div className={`stat-change ${positive ? "" : "muted"}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{change}</div></Card>)}</div>
    <div className="dashboard-grid">
      <Card className="chart-card performance-card"><div className="card-heading"><div><div className="section-eyebrow">YOUR PROGRESS</div><h2>Performance overview</h2><p>You're improving with every practice session.</p></div><button className="select-button">Last 7 days <ChevronDown size={14} /></button></div><div className="chart-legend"><span><i className="legend-dot purple-dot" /> Overall score</span><strong>86 <small>/ 100</small><span className="tiny-up">+12%</span></strong></div><div className="main-chart"><PerformanceChart /></div></Card>
      <Card className="chart-card skill-card"><div className="card-heading"><div><div className="section-eyebrow">AT A GLANCE</div><h2>Skills breakdown</h2><p>Where you shine and where to grow.</p></div><button className="more-button" aria-label="More options"><MoreHorizontal size={19} /></button></div><div className="skill-chart-wrap"><div className="skill-chart"><SkillsChart /><div className="donut-label"><strong>82</strong><small>avg. score</small></div></div><div className="dashboard-radar"><RadarSkills data={radarData} /></div></div><div className="skill-legend">{[["Communication","86%"],["Problem solving","72%"],["Role expertise","64%"],["Confidence","52%"]].map((row, i) => <div key={row[0]}><span><i className={`legend-dot legend-${i}`} />{row[0]}</span><strong>{row[1]}</strong></div>)}</div></Card>
    </div>
    <div className="dashboard-grid lower-grid">
      <Card className="table-card"><SectionTitle title="Recent interviews" action={<Link className="text-link" to="/history">View all <ArrowUpRight size={14} /></Link>} /><InterviewTable rows={interviews.slice(0, 4)} /></Card>
      <Card className="activity-card"><SectionTitle title="Recent activity" action={<button className="more-button" aria-label="More activity"><MoreHorizontal size={19} /></button>} /><div className="timeline">{activities.map((item) => <div className="timeline-item" key={item.title}><div className={`timeline-icon ${item.tone}`}>{item.icon === "file" ? <FileText size={15} /> : item.icon === "target" ? <Target size={15} /> : <Sparkles size={15} />}</div><div><strong>{item.title}</strong><p>{item.detail}</p><small>{item.time}</small></div></div>)}</div></Card>
    </div>
    <div className="tip-banner"><div className="tip-icon"><Lightbulb size={19} /></div><div><strong>A quick tip for your next interview</strong><p>Try structuring your answers with the STAR method to make your stories even more memorable.</p></div><Link to="/report">See your tips <ArrowUpRight size={14} /></Link></div>
  </div>;
}

export function InterviewTable({ rows }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>INTERVIEW</th><th>DATE</th><th>SCORE</th><th>STATUS</th></tr></thead><tbody>{rows.map((item) => <tr key={`${item.role}-${item.date}`}><td><div className="role-cell"><div className={`role-icon ${item.color}`}><FileText size={15} /></div><div><strong>{item.role}</strong><small>{item.difficulty} · {item.duration}</small></div></div></td><td className="date-cell">{item.date}</td><td>{item.score ? <span className={`score-pill ${item.score >= 85 ? "score-high" : item.score >= 75 ? "score-mid" : "score-low"}`}>{item.score}</span> : <span className="muted">—</span>}</td><td><Badge tone={item.status === "Completed" ? "green" : "orange"}>{item.status}</Badge></td></tr>)}</tbody></table></div>;
}

export function HistoryPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const filtered = useMemo(() => interviews.filter((item) => item.role.toLowerCase().includes(query.toLowerCase()) && (role === "All roles" || item.role === role)), [query, role]);
  return <div className="page-stack"><PageHeading eyebrow="YOUR PRACTICE" title="Interview history" description="Every session is a step closer to your next opportunity." action={<Button onClick={() => navigate("/setup")}><Plus size={16} /> New interview</Button>} />
    <Card className="history-card"><div className="history-toolbar"><label className="search-field"><Search size={16} /><input placeholder="Search by job title..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><label className="filter-select"><Filter size={15} /><select value={role} onChange={(event) => setRole(event.target.value)}><option>All roles</option>{[...new Set(interviews.map((item) => item.role))].map((item) => <option key={item}>{item}</option>)}</select></label><button className="filter-select"><CalendarDays size={15} /> All time <ChevronDown size={14} /></button><button className="filter-select"><Download size={15} /> Export</button></div>
      {filtered.length ? <><div className="table-wrap"><table className="data-table history-table"><thead><tr><th>JOB ROLE</th><th>DATE</th><th>DIFFICULTY</th><th>DURATION</th><th>SCORE</th><th>STATUS</th><th /></tr></thead><tbody>{filtered.map((item) => <tr key={`${item.role}-${item.date}`}><td><div className="role-cell"><div className={`role-icon ${item.color}`}><FileText size={15} /></div><strong>{item.role}</strong></div></td><td className="date-cell">{item.date}</td><td><Badge tone={item.difficulty === "Hard" ? "orange" : item.difficulty === "Easy" ? "blue" : "purple"}>{item.difficulty}</Badge></td><td>{item.duration}</td><td>{item.score ? <span className={`score-pill ${item.score >= 85 ? "score-high" : "score-mid"}`}>{item.score}</span> : "—"}</td><td><Badge tone={item.status === "Completed" ? "green" : "orange"}>{item.status}</Badge></td><td><button className="more-button" aria-label={`Actions for ${item.role}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div>
        <div className="pagination"><span>Showing {filtered.length} of 12 interviews</span><div><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</button><button className="current-page">{page}</button><button onClick={() => setPage(page + 1)} disabled={page >= 3}>Next</button></div></div></> : <EmptyState title="No interviews found" message="Try a different search or start your first practice interview." action={<Button onClick={() => { setQuery(""); setRole("All roles"); }}>Clear filters</Button>} />}</Card>
    <div className="history-footnote"><Clock3 size={15} /> Your interviews are private and only visible to you.</div>
  </div>;
}

export function ReportPage() {
  return <div className="page-stack"><PageHeading eyebrow="LATEST SESSION · OCT 30, 2024" title="Your performance report" description="Senior Product Designer · Medium · 18 minutes" action={<Button variant="secondary"><Download size={16} /> Download report</Button>} />
    <div className="report-score-banner"><div className="report-score-ring"><div><strong>86</strong><small>out of 100</small></div></div><div className="report-summary"><Badge tone="green"><TrendingUp size={13} /> Great performance</Badge><h2>You're interview-ready.</h2><p>Your answers were thoughtful and well-structured. A little more confidence in delivery could take you to the next level.</p><div className="report-summary-meta"><span><Check size={14} /> 8 questions answered</span><span><Clock3 size={14} /> Average answer: 1m 42s</span></div></div><div className="report-illustration"><div className="report-blob"><Sparkles size={44} /></div><div className="floating-mini">+12% <TrendingUp size={14} /></div></div></div>
    <div className="metric-grid">{[["Communication","88","Excellent"],["Relevance","82","Strong"],["Confidence","79","Growing"],["Completeness","84","Strong"]].map(([label,score,note]) => <Card key={label} className="metric-card"><span>{label}</span><strong>{score}<small>/100</small></strong><div className="metric-progress"><i style={{ width: `${score}%` }} /></div><small className="metric-note"><Check size={12} /> {note}</small></Card>)}</div>
    <div className="dashboard-grid report-chart-grid"><Card className="report-chart-card"><SectionTitle title="Your skill profile" action={<span className="subtle-label">Across 5 dimensions</span>} /><div className="report-radar"><RadarSkills /></div></Card><Card className="report-chart-card"><SectionTitle title="Question-by-question" action={<span className="subtle-label">Score / 100</span>} /><div className="bar-chart"><QuestionScoresShim /></div></Card></div>
    <div className="feedback-grid">{[
      { title: "What you're doing well", icon: Award, tone: "green", bullets: ["Clear, concise storytelling that is easy to follow", "Strong use of specific examples and measurable outcomes", "Great ability to connect user needs to business impact"] },
      { title: "Room to grow", icon: Target, tone: "orange", bullets: ["Take a breath before answering to project more confidence", "Go deeper on the trade-offs behind your design decisions", "Vary your pace — slow down on your key takeaways"] },
    ].map(({ title, icon: Icon, tone, bullets }) => <Card className="feedback-card" key={title}><div className="feedback-heading"><div className={`feedback-icon ${tone}`}><Icon size={17} /></div><h3>{title}</h3></div>{bullets.map((bullet) => <div className="feedback-line" key={bullet}><span className={tone === "green" ? "check-dot" : "arrow-dot"}>{tone === "green" ? <Check size={12} /> : <ArrowUpRight size={12} />}</span>{bullet}</div>)}</Card>)}</div>
    <Card className="recommendations"><div className="feedback-heading"><div className="feedback-icon purple"><Lightbulb size={17} /></div><div><h3>Your next steps</h3><p>Personalized practice to help you keep improving.</p></div></div><div className="recommendation-row"><div className="recommendation-number">01</div><div><strong>Practice confident delivery</strong><p>Try a 5-minute warm-up before your next session.</p></div><Link to="/setup">Practice now <ArrowUpRight size={14} /></Link></div><div className="recommendation-row"><div className="recommendation-number">02</div><div><strong>Brush up on product metrics</strong><p>Explore how to frame impact using outcome-based metrics.</p></div><Link to="/setup">Explore topic <ArrowUpRight size={14} /></Link></div></Card>
  </div>;
}

function QuestionScoresShim() {
  return <ScoresChart />;
}

import { QuestionScores as ScoresChart } from "../components/Charts";
