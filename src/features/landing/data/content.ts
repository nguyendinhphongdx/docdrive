import {
  Clock,
  Eye,
  FileText,
  Link as LinkIcon,
  QrCode,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface Feature {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface StackItem {
  name: string;
  tag: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface ComparisonRow {
  label: string;
  ours: string;
  diy: string;
}

export const HERO_STATS: Stat[] = [
  { value: "<200ms", label: "preview latency" },
  { value: "1h–∞", label: "expiration range" },
  { value: "MD + HTML", label: "both formats" },
  { value: "256 KB", label: "max content" },
];

export const FEATURES: Feature[] = [
  {
    id: "split",
    icon: FileText,
    title: "Side-by-side editor",
    description:
      "CodeMirror on the left, live Markdown or HTML preview on the right. Drag the divider to resize.",
  },
  {
    id: "ttl",
    icon: Clock,
    title: "Expiring links",
    description:
      "Set a TTL of 1 hour, 1 day, 7 days, 30 days, or never. A cron job sweeps expired notes automatically.",
  },
  {
    id: "share",
    icon: LinkIcon,
    title: "Copy or scan",
    description:
      "Every share opens at /s/<id>. Copy the URL or grab the QR code for mobile.",
  },
  {
    id: "qr",
    icon: QrCode,
    title: "QR for any device",
    description:
      "Built-in QR code generator lets you hand off a note across devices in one scan.",
  },
  {
    id: "views",
    icon: Eye,
    title: "View counter",
    description:
      "Each share tracks views server-side, so you know whether the link landed.",
  },
  {
    id: "safety",
    icon: ShieldCheck,
    title: "Safe HTML",
    description:
      "HTML mode passes through DOMPurify and a strict allow-list. Markdown is sanitized too.",
  },
];

export const HOW_IT_WORKS: Step[] = [
  {
    number: "01",
    title: "Write",
    description: "Open the editor. Toggle Markdown or HTML, the preview updates as you type.",
  },
  {
    number: "02",
    title: "Set a lifetime",
    description: "Choose how long the share should live: an hour, a week, forever — your call.",
  },
  {
    number: "03",
    title: "Share",
    description: "Click Create, copy the link or QR, and hand it to anyone.",
  },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Auth flow",
    ours: "Login, register, forgot/reset, OTP, verify-email — typed",
    diy: "Wire it yourself, hope you got CSRF right",
  },
  {
    label: "Server state",
    ours: "TanStack Query with refresh-token interceptor",
    diy: "Roll your own fetch hooks",
  },
  {
    label: "Theming",
    ours: "Light/dark with `next-themes`, no FOUC",
    diy: "Mostly works, until SSR",
  },
  {
    label: "App Router conventions",
    ours: "`error.tsx`, `loading.tsx`, `not-found.tsx`, middleware all wired",
    diy: "Add as you remember they exist",
  },
  {
    label: "AI-agent docs",
    ours: "`CLAUDE.md` + MCP server expose docs to Claude Code et al.",
    diy: "Hope the agent guesses your conventions",
  },
];

export const STACK: StackItem[] = [
  { name: "Next.js", tag: "16" },
  { name: "React", tag: "19" },
  { name: "Tailwind CSS", tag: "4" },
  { name: "shadcn/ui", tag: "Radix Nova" },
  { name: "TanStack Query", tag: "5" },
  { name: "Zustand", tag: "5" },
  { name: "react-hook-form", tag: "7" },
  { name: "zod", tag: "4" },
  { name: "axios", tag: "1" },
  { name: "next-themes", tag: "0.4" },
  { name: "sonner", tag: "2" },
  { name: "lucide-react", tag: "icons" },
];
