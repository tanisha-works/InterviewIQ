import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";

const axis = { fontSize: 11, fill: "#98a0b3" };
const tooltipStyle = { border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", color: "var(--text)", boxShadow: "0 8px 24px #242b4014" };

export function PerformanceChart({ data = [], compact = false }) {
  const chartData = compact ? data.slice(-5) : data;
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}><CartesianGrid stroke="var(--grid)" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={axis} dy={9} /><YAxis hide={!compact} domain={[0, 100]} tickLine={false} axisLine={false} tick={axis} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, "Score"]} /><Line type="monotone" dataKey="score" stroke="#7557f6" strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: "#7557f6", strokeWidth: 2 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer>;
}

export function SkillsChart({ data = [] }) {
  return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={4} stroke="none">{data.map((item) => <Cell key={item.name} fill={item.fill} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`]} /></PieChart></ResponsiveContainer>;
}

export function RadarSkills({ data = [] }) {
  return <ResponsiveContainer width="100%" height="100%"><RadarChart data={data} outerRadius="72%"><PolarGrid stroke="var(--grid)" /><PolarAngleAxis dataKey="skill" tick={{ ...axis, fontSize: 10 }} /><Radar dataKey="score" stroke="#7557f6" fill="#7557f6" fillOpacity={0.19} strokeWidth={2} /></RadarChart></ResponsiveContainer>;
}

export function QuestionScores({ data = [] }) {
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -22 }}><CartesianGrid stroke="var(--grid)" vertical={false} /><XAxis dataKey="name" tick={axis} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tick={axis} tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, "Score"]} /><Bar dataKey="score" fill="#7557f6" radius={[6, 6, 0, 0]} barSize={24} /></BarChart></ResponsiveContainer>;
}
