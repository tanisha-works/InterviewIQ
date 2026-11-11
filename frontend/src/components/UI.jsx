import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function Button({ children, variant = "primary", size = "", className = "", ...props }) {
  return <button className={`button button-${variant} ${size ? `button-${size}` : ""} ${className}`} {...props}>{children}</button>;
}

export function Card({ children, className = "", ...props }) {
  return <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={`card ${className}`} {...props}>{children}</motion.section>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

export function Badge({ children, tone = "purple" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function SectionTitle({ title, action }) {
  return <div className="section-title"><h2>{title}</h2>{action}</div>;
}

export function EmptyState({ title, message, action }) {
  return <div className="empty-state"><div className="empty-icon"><Sparkles size={20} /></div><h3>{title}</h3><p>{message}</p>{action}</div>;
}

export function LinkButton({ children, to }) {
  return <a className="text-link" href={to}>{children}<ArrowUpRight size={14} /></a>;
}
