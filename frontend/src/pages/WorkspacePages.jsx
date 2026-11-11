import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Award, BarChart3, CalendarDays, Check, Clock3, Download, FileText, Filter, Lightbulb, MessageCircle, MoreHorizontal, Plus, Search, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Badge, Button, Card, EmptyState, PageHeading, SectionTitle } from "../components/UI";
import { PerformanceChart, QuestionScores, RadarSkills, SkillsChart } from "../components/Charts";
import { interviewService } from "../services/interviewService";
import { reportService } from "../services/reportService";

const dimensions = ["relevance", "content", "fluency", "pace", "length"];
const dimensionColors = ["#7557f6", "#e98c62", "#4e9a86", "#5481b8", "#d0a247"];

function displayDimension(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatSessionDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function todayLabel() {
  return new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
}

function toInterviewRow(item) {
  return {
    id: item.id,
    createdAt: item.created_at,
    date: formatSessionDate(item.created_at),
    role: item.role.replaceAll("_", " "),
    difficulty: item.difficulty,
    duration: `${item.duration_minutes} min`,
    score: item.average_score,
    status: item.answered >= item.total_questions ? "Completed" : "In progress",
    color: "violet",
    answered: item.answered,
    totalQuestions: item.total_questions,
  };
}

function dimensionSummary(sessions) {
  const totals = Object.fromEntries(dimensions.map((name) => [name, { sum: 0, count: 0 }]));
  sessions.forEach((session) => {
    dimensions.forEach((name) => {
      const score = session.dimension_scores?.[name];
      if (Number.isFinite(score)) {
        totals[name].sum += score * Math.max(session.answered, 1);
        totals[name].count += Math.max(session.answered, 1);
      }
    });
  });
  return dimensions.map((name, index) => ({
    name: displayDimension(name),
    skill: displayDimension(name),
    value: totals[name].count ? Math.round(totals[name].sum / totals[name].count) : 0,
    score: totals[name].count ? Math.round(totals[name].sum / totals[name].count) : 0,
    fill: dimensionColors[index],
  }));
}

export function DashboardPage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    interviewService.list()
      .then((result) => { if (active) setSessions(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const completed = sessions.filter((session) => session.answered > 0);
  const average = completed.length
    ? Math.round(completed.reduce((sum, session) => sum + session.average_score, 0) / completed.length)
    : 0;
  const skillSummary = dimensionSummary(completed);
  const rankedSkills = [...skillSummary].filter((skill) => skill.value > 0).sort((a, b) => b.value - a.value);
  const stats = [
    { label: "Interviews completed", value: completed.filter((session) => session.answered >= session.total_questions).length, change: `${sessions.length} sessions total`, icon: MessageCircle, tone: "purple", positive: true },
    { label: "Average score", value: average, change: `${completed.length} evaluated sessions`, icon: TrendingUp, tone: "blue", positive: true },
    { label: "Strongest dimension", value: rankedSkills[0]?.name || "—", change: rankedSkills[0] ? `${rankedSkills[0].value}/100 average` : "No answers yet", icon: Award, tone: "green", positive: true },
    { label: "Focus area", value: rankedSkills.at(-1)?.name || "—", change: rankedSkills.length ? `${rankedSkills.at(-1).value}/100 average` : "No answers yet", icon: Target, tone: "orange", positive: false },
  ];
  const rows = sessions.map(toInterviewRow);
  const performance = completed.slice().reverse().map((session) => ({
    day: new Date(session.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
    score: session.average_score,
  }));
  return <div className="page-stack">
    <PageHeading eyebrow={todayLabel()} title={`Good morning, ${user.name.split(" ")[0]} ✨`} description="A little practice today goes a long way. You're building something great." action={<Button onClick={() => navigate("/setup")}><Plus size={16} /> Start an interview</Button>} />
    {error && <div className="form-error">{error}</div>}
    {loading && <div className="room-notice">Loading your interview data...</div>}
    <div className="stat-grid">{stats.map(({ label, value, change, icon: Icon, tone, positive }) => <Card className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}{label === "Average score" && <small className="unit">/100</small>}</div><div className={`stat-change ${positive ? "" : "muted"}`}>{positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{change}</div></Card>)}</div>
    <div className="dashboard-grid">
      <Card className="chart-card performance-card"><div className="card-heading"><div><div className="section-eyebrow">YOUR PROGRESS</div><h2>Performance overview</h2><p>Scores from your evaluated practice sessions.</p></div><span className="subtle-label">All sessions</span></div><div className="chart-legend"><span><i className="legend-dot purple-dot" /> Overall score</span><strong>{average} <small>/ 100</small></strong></div><div className="main-chart">{performance.length ? <PerformanceChart data={performance} /> : <EmptyState title="No scores yet" message="Complete an answer to see your progress here." />}</div></Card>
      <Card className="chart-card skill-card"><div className="card-heading"><div><div className="section-eyebrow">AT A GLANCE</div><h2>Evaluation dimensions</h2><p>Average scores from saved answers.</p></div></div><div className="skill-chart-wrap"><div className="skill-chart"><SkillsChart data={skillSummary} /><div className="donut-label"><strong>{average}</strong><small>avg. score</small></div></div><div className="dashboard-radar"><RadarSkills data={skillSummary} /></div></div><div className="skill-legend">{skillSummary.map((skill, i) => <div key={skill.name}><span><i className={`legend-dot legend-${i}`} />{skill.name}</span><strong>{skill.value}%</strong></div>)}</div></Card>
    </div>
    <div className="dashboard-grid lower-grid">
      <Card className="table-card"><SectionTitle title="Recent interviews" action={<Link className="text-link" to="/history">View all <ArrowUpRight size={14} /></Link>} />{rows.length ? <InterviewTable rows={rows.slice(0, 4)} onSelect={(id) => { sessionStorage.setItem("interviewiq-latest-session-id", String(id)); navigate("/report"); }} /> : <EmptyState title="No interviews yet" message="Start a practice session to see it here." />}</Card>
      <Card className="activity-card"><SectionTitle title="Recent activity" /><div className="timeline">{rows.slice(0, 3).map((item) => <div className="timeline-item" key={item.id}><div className="timeline-icon purple"><Sparkles size={15} /></div><div><strong>{item.status === "Completed" ? "Interview completed" : "Interview in progress"}</strong><p>{item.role} · {item.answered}/{item.totalQuestions} answered</p><small>{item.date}</small></div></div>)}{!rows.length && <EmptyState title="No activity yet" message="Your completed sessions will appear here." />}</div></Card>
    </div>
    <div className="tip-banner"><div className="tip-icon"><Lightbulb size={19} /></div><div><strong>A quick tip for your next interview</strong><p>Try structuring your answers with the STAR method to make your stories even more memorable.</p></div><Link to="/report">See your tips <ArrowUpRight size={14} /></Link></div>
  </div>;
}

export function InterviewTable({ rows, onSelect }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>INTERVIEW</th><th>DATE</th><th>SCORE</th><th>STATUS</th><th /></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><div className="role-cell"><div className={`role-icon ${item.color}`}><FileText size={15} /></div><div><strong>{item.role}</strong><small>{item.answered}/{item.totalQuestions} questions answered</small></div></div></td><td className="date-cell">{item.date}</td><td>{item.answered ? <span className={`score-pill ${item.score >= 85 ? "score-high" : item.score >= 75 ? "score-mid" : "score-low"}`}>{item.score}</span> : <span className="muted">—</span>}</td><td><Badge tone={item.status === "Completed" ? "green" : "orange"}>{item.status}</Badge></td><td>{onSelect && <button className="more-button" aria-label={`View report for ${item.role}`} onClick={() => onSelect(item.id)}><MoreHorizontal size={17} /></button>}</td></tr>)}</tbody></table></div>;
}

export function HistoryPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All roles");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    interviewService.list()
      .then((result) => { if (active) setSessions(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const filtered = useMemo(() => sessions.map(toInterviewRow).filter((item) => {
    const matchesQuery = item.role.toLowerCase().includes(query.toLowerCase());
    const matchesRole = role === "All roles" || item.role === role;
    const ageDays = (Date.now() - new Date(item.createdAt).getTime()) / 86400000;
    const matchesPeriod = period === "all" || (period === "30" ? ageDays <= 30 : ageDays <= 7);
    return matchesQuery && matchesRole && matchesPeriod;
  }), [sessions, query, role, period]);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openReport(sessionId) {
    sessionStorage.setItem("interviewiq-latest-session-id", String(sessionId));
    navigate("/report", { state: { sessionId } });
  }

  function exportCsv() {
    const rows = [["Role", "Date", "Answered", "Total Questions", "Average Score", "Status"], ...filtered.map((item) => [item.role, item.date, item.answered, item.totalQuestions, item.score, item.status])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "interview-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="page-stack"><PageHeading eyebrow="YOUR PRACTICE" title="Interview history" description="Every session is a step closer to your next opportunity." action={<Button onClick={() => navigate("/setup")}><Plus size={16} /> New interview</Button>} />
    <Card className="history-card"><div className="history-toolbar"><label className="search-field"><Search size={16} /><input placeholder="Search by job title..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><label className="filter-select"><Filter size={15} /><select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option>All roles</option>{[...new Set(sessions.map((item) => item.role.replaceAll("_", " ")))].map((item) => <option key={item}>{item}</option>)}</select></label><label className="filter-select"><CalendarDays size={15} /><select aria-label="Date range" value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); }}><option value="all">All time</option><option value="30">Last 30 days</option><option value="7">Last 7 days</option></select></label><button className="filter-select" onClick={exportCsv}><Download size={15} /> Export</button></div>
      {error && <div className="form-error">{error}</div>}{loading && <div className="room-notice">Loading interview history...</div>}
      {pageRows.length ? <><InterviewTable rows={pageRows} onSelect={openReport} />
        <div className="pagination"><span>Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} interviews</span><div><button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</button><button className="current-page">{page}</button><button onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page >= pageCount}>Next</button></div></div></> : !loading && <EmptyState title="No interviews found" message="Try another search or start a practice interview." action={<Button onClick={() => { setQuery(""); setRole("All roles"); setPeriod("all"); }}>Clear filters</Button>} />}</Card>
    <div className="history-footnote"><Clock3 size={15} /> Your interviews are private and only visible to you.</div>
  </div>;
}

export function ReportPage() {
  const location = useLocation();
  const sessionId = location.state?.sessionId || sessionStorage.getItem("interviewiq-latest-session-id");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setReport(null);
    setError("");
    setLoading(true);
    reportService.getLatest(sessionId)
      .then((result) => { if (active) setReport(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sessionId]);

  if (loading) return <div className="page-stack"><PageHeading title="Your performance report" description="Loading your latest evaluation..." /></div>;
  if (error) return <div className="page-stack"><PageHeading title="Your performance report" description={error} /></div>;
  if (!report) return <div className="page-stack"><PageHeading title="Your performance report" description="Reports appear here after you complete and submit interview answers." /><EmptyState title="No evaluated session yet" message="Start an interview and submit at least one recorded answer to get real feedback." action={<Button onClick={() => window.location.assign("/setup")}>Start an interview</Button>} /></div>;
  if (report.answered === 0) return <div className="page-stack"><PageHeading eyebrow={`SESSION ${report.session_id}`} title="Your performance report" description={`${report.role.replaceAll("_", " ")} · No answers submitted`} /><EmptyState title="No answers were evaluated" message="Record and submit an answer in the interview room to receive real feedback." action={<Link className="button button-primary" to="/setup">Start another interview <ArrowUpRight size={14} /></Link>} /></div>;

  const answers = report.answers || [];
  const dimensionsForChart = dimensions.map((name, index) => {
    const values = answers.map((answer) => answer.scores?.[name]).filter(Number.isFinite);
    return {
      skill: displayDimension(name),
      score: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
      fill: dimensionColors[index],
    };
  });
  const scoreBars = answers.map((answer, index) => ({
    name: `Q${index + 1}`,
    score: answer.overall_score,
  }));
  const allFeedback = [...new Set(answers.flatMap((answer) => answer.feedback || []))];
  const averageAnswerSeconds = answers.length
    ? Math.round(answers.reduce((sum, answer) => sum + (answer.metrics?.audio?.duration_sec || 0), 0) / answers.length)
    : 0;
  const formattedDuration = `${Math.floor(averageAnswerSeconds / 60)}m ${averageAnswerSeconds % 60}s`;
  const scoreTone = report.average_score >= 75 ? "green" : "orange";
  const strongFeedback = allFeedback.filter((item) => /great|strong|clear|well paced/i.test(item));
  const improvementFeedback = allFeedback.filter((item) => !strongFeedback.includes(item));

  function downloadReport() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interview-report-${report.session_id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return <div className="page-stack"><PageHeading eyebrow={`SESSION ${report.session_id}`} title="Your performance report" description={`${report.role.replaceAll("_", " ")} · ${report.answered}/${report.total_questions} answers evaluated`} action={<Button variant="secondary" onClick={downloadReport}><Download size={16} /> Download report</Button>} />
    <div className="report-score-banner"><div className="report-score-ring" style={{ "--report-score": `${Math.max(0, Math.min(100, report.average_score))}%` }}><div><strong>{report.average_score}</strong><small>out of 100</small></div></div><div className="report-summary"><Badge tone={scoreTone}><TrendingUp size={13} /> {report.average_score >= 75 ? "Strong performance" : "Keep practicing"}</Badge><h2>{report.answered} answer{report.answered === 1 ? "" : "s"} evaluated.</h2><p>Your feedback below is generated from the answers saved for this session.</p><div className="report-summary-meta"><span><Check size={14} /> {report.answered} questions answered</span><span><Target size={14} /> {report.difficulty} · {report.interview_type}</span><span><Clock3 size={14} /> {report.duration_minutes} minute session · Avg. answer {formattedDuration}</span></div></div><div className="report-illustration"><div className="report-blob"><Sparkles size={44} /></div></div></div>
    <div className="metric-grid">{dimensionsForChart.map(({ skill, score }) => <Card key={skill} className="metric-card"><span>{skill}</span><strong>{score}<small>/100</small></strong><div className="metric-progress"><i style={{ width: `${score}%` }} /></div><small className="metric-note">Average across evaluated answers</small></Card>)}</div>
    <div className="dashboard-grid report-chart-grid"><Card className="report-chart-card"><SectionTitle title="Evaluation dimensions" action={<span className="subtle-label">Across saved answers</span>} /><div className="report-radar"><RadarSkills data={dimensionsForChart} /></div></Card><Card className="report-chart-card"><SectionTitle title="Question-by-question" action={<span className="subtle-label">Overall score / 100</span>} /><div className="bar-chart"><QuestionScores data={scoreBars} /></div></Card></div>
    <div className="feedback-grid">{[{ title: "What went well", icon: Award, tone: "green", bullets: strongFeedback }, { title: "Feedback to work on", icon: Target, tone: "orange", bullets: improvementFeedback }].map(({ title, icon: Icon, tone, bullets }) => <Card className="feedback-card" key={title}><div className="feedback-heading"><div className={`feedback-icon ${tone}`}><Icon size={17} /></div><h3>{title}</h3></div>{bullets.length ? bullets.map((bullet) => <div className="feedback-line" key={bullet}><span className={tone === "green" ? "check-dot" : "arrow-dot"}>{tone === "green" ? <Check size={12} /> : <ArrowUpRight size={12} />}</span>{bullet}</div>) : <p>No additional feedback for this category.</p>}</Card>)}</div>
  </div>;
}
