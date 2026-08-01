import { useState, useEffect, useRef } from "react";
import {
  Search, MapPin, Bell, MessageCircle, User, Home, Plus,
  ChevronRight, Star, Shield, Clock, Camera, Upload,
  Filter, Grid, Map, Share2, Flag, Check, X, ArrowLeft,
  Settings, Eye, EyeOff, Heart, Mail, Lock,
  AlertCircle, CheckCircle, Gift, Trash2, Moon, Sun,
  Globe, ChevronDown, Send, Paperclip, Zap,
  Package, Key, HelpCircle, LogOut, Edit3,
  MoreVertical, Wifi, BarChart2, DollarSign,
  Calendar, Info, Sparkles, ScanLine, Target,
  Award, ArrowRight, ArrowUpRight, Users, FileText,
  TrendingUp, Image as ImageIcon, Phone,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | "splash" | "onboarding" | "signup" | "login" | "forgot-password"
  | "home" | "report-lost" | "upload-found" | "search" | "item-details"
  | "claim-verification" | "notifications" | "chat" | "profile"
  | "my-lost" | "my-found" | "reward-history" | "settings" | "admin";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  primaryDeep: "#1E3A8A",
  primaryTint: "#EEF2FF",
  primaryTintDark: "#DBEAFE",
  green: "#22C55E",
  greenDark: "#16A34A",
  greenTint: "#DCFCE7",
  amber: "#F59E0B",
  amberDark: "#D97706",
  amberTint: "#FEF3C7",
  purple: "#8B5CF6",
  purpleTint: "#EDE9FE",
  red: "#EF4444",
  redTint: "#FEE2E2",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  surface: "#F1F5F9",
  surfaceAlt: "#E9EEF5",
  ink: "#0F172A",
  ink2: "#334155",
  muted: "#64748B",
  subtle: "#94A3B8",
  ghost: "#CBD5E1",
  border: "rgba(15,23,42,0.07)",
  borderStrong: "rgba(15,23,42,0.13)",
};

const SH = {
  xs: "0 1px 2px rgba(15,23,42,0.05)",
  sm: "0 1px 3px rgba(15,23,42,0.07), 0 1px 2px rgba(15,23,42,0.04)",
  md: "0 4px 12px rgba(15,23,42,0.07), 0 1px 3px rgba(15,23,42,0.04)",
  lg: "0 12px 28px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.04)",
  xl: "0 24px 52px rgba(15,23,42,0.10), 0 8px 16px rgba(15,23,42,0.05)",
  blue: "0 6px 20px rgba(37,99,235,0.32)",
  green: "0 6px 20px rgba(34,197,94,0.32)",
  amber: "0 6px 20px rgba(245,158,11,0.28)",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const ITEMS = [
  { id: 1, type: "found", title: "iPhone 15 Pro", cat: "Electronics", loc: "Central Park", hood: "Midtown, NY", time: "2h ago", img: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop&auto=format&q=80", reward: null, verified: true },
  { id: 2, type: "lost", title: "Black Leather Wallet", cat: "Wallet", loc: "Times Square", hood: "Midtown, NY", time: "4h ago", img: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=400&fit=crop&auto=format&q=80", reward: 50, verified: false },
  { id: 3, type: "found", title: "Ray-Ban Aviators", cat: "Accessories", loc: "Brooklyn Bridge", hood: "DUMBO, NY", time: "6h ago", img: "https://images.unsplash.com/photo-1473496169904-658ba7574b0d?w=600&h=400&fit=crop&auto=format&q=80", reward: null, verified: true },
  { id: 4, type: "lost", title: "AirPods Pro 2nd Gen", cat: "Electronics", loc: "Grand Central", hood: "Midtown, NY", time: "8h ago", img: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&h=400&fit=crop&auto=format&q=80", reward: 30, verified: false },
  { id: 5, type: "found", title: "Vintage Briefcase", cat: "Bags", loc: "Penn Station", hood: "Midtown, NY", time: "1d ago", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=400&fit=crop&auto=format&q=80", reward: null, verified: true },
  { id: 6, type: "lost", title: "Toyota Car Keys", cat: "Keys", loc: "Park Slope", hood: "Brooklyn, NY", time: "1d ago", img: "https://images.unsplash.com/photo-1671579722985-9ef4c34f3138?w=600&h=400&fit=crop&auto=format&q=80", reward: 20, verified: false },
];

const CATS = [
  { emoji: "📱", label: "Electronics", count: 128 },
  { emoji: "👜", label: "Bags", count: 84 },
  { emoji: "🔑", label: "Keys", count: 213 },
  { emoji: "💳", label: "Wallet", count: 97 },
  { emoji: "👓", label: "Glasses", count: 61 },
  { emoji: "🎧", label: "Audio", count: 45 },
  { emoji: "⌚", label: "Jewelry", count: 72 },
  { emoji: "📄", label: "Docs", count: 38 },
];

const CHART_WEEKLY = [
  { d: "Mon", found: 24, lost: 18 }, { d: "Tue", found: 31, lost: 22 },
  { d: "Wed", found: 19, lost: 15 }, { d: "Thu", found: 42, lost: 31 },
  { d: "Fri", found: 38, lost: 28 }, { d: "Sat", found: 52, lost: 35 },
  { d: "Sun", found: 29, lost: 20 },
];
const CHART_CATS = [
  { name: "Electronics", value: 35, color: C.primary },
  { name: "Bags", value: 20, color: C.green },
  { name: "Wallet", value: 18, color: C.amber },
  { name: "Keys", value: 15, color: C.purple },
  { name: "Other", value: 12, color: C.muted },
];

// ─── CSS Injection ────────────────────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      @keyframes slideRight { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      @keyframes spin { to{transform:rotate(360deg)} }
      .screen-enter { animation: slideRight 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both; }
      .fade-in { animation: fadeIn 0.2s ease both; }
      .fade-up { animation: fadeUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94) both; }
      .scale-in { animation: scaleIn 0.2s ease both; }
      .shimmer {
        background: linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);
        background-size: 400px 100%;
        animation: shimmer 1.4s infinite;
      }
      .no-scroll { -ms-overflow-style:none; scrollbar-width:none; }
      .no-scroll::-webkit-scrollbar { display:none; }
      .press { transition: transform 0.1s ease, opacity 0.1s ease; }
      .press:active { transform: scale(0.96); opacity:0.85; }
      .input-focus:focus-within { border-color: ${C.primary} !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12) !important; }
    `}</style>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Avatar({
  size = 40, src, initials, ring = false, online = false
}: { size?: number; src?: string; initials?: string; ring?: boolean; online?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: size, height: size,
          background: src ? "transparent" : `linear-gradient(135deg, ${C.primary} 0%, ${C.purple} 100%)`,
          boxShadow: ring ? `0 0 0 3px white, 0 0 0 5px ${C.primary}` : undefined,
        }}
      >
        {src
          ? <img src={src} alt="" className="w-full h-full object-cover" />
          : <span className="font-bold text-white" style={{ fontSize: size * 0.36, letterSpacing: "0.02em" }}>{initials}</span>
        }
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 block rounded-full border-2 border-white"
          style={{ width: size * 0.3, height: size * 0.3, background: C.green }}
        />
      )}
    </div>
  );
}

type BadgeVariant = "primary" | "green" | "amber" | "red" | "purple" | "muted";
function Pill({ label, variant = "primary", dot = false }: { label: string; variant?: BadgeVariant; dot?: boolean }) {
  const map: Record<BadgeVariant, [string, string]> = {
    primary: [C.primaryTint, C.primary],
    green: [C.greenTint, C.greenDark],
    amber: [C.amberTint, C.amberDark],
    red: [C.redTint, C.red],
    purple: [C.purpleTint, C.purple],
    muted: [C.surface, C.muted],
  };
  const [bg, text] = map[variant];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-semibold"
      style={{ background: bg, color: text, fontSize: 11, padding: "3px 9px", letterSpacing: "0.01em" }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: text }} />}
      {label}
    </span>
  );
}

function Btn({
  children, variant = "primary", size = "md", fullWidth = false,
  icon, iconRight, onClick, disabled = false, className = "",
}: {
  children?: React.ReactNode; variant?: "primary" | "green" | "outline" | "ghost" | "surface" | "red" | "amber";
  size?: "xs" | "sm" | "md" | "lg"; fullWidth?: boolean; icon?: React.ReactNode; iconRight?: React.ReactNode;
  onClick?: () => void; disabled?: boolean; className?: string;
}) {
  const vs: Record<string, { bg: string; text: string; border: string; shadow: string }> = {
    primary: { bg: C.primary, text: "#fff", border: C.primary, shadow: SH.blue },
    green: { bg: C.green, text: "#fff", border: C.green, shadow: SH.green },
    outline: { bg: "transparent", text: C.primary, border: C.primary, shadow: "none" },
    ghost: { bg: C.primaryTint, text: C.primary, border: "transparent", shadow: "none" },
    surface: { bg: C.surface, text: C.ink2, border: "transparent", shadow: "none" },
    red: { bg: C.red, text: "#fff", border: C.red, shadow: "0 4px 12px rgba(239,68,68,0.28)" },
    amber: { bg: C.amber, text: "#fff", border: C.amber, shadow: SH.amber },
  };
  const ss = { xs: { h: 32, px: 12, fs: 12 }, sm: { h: 40, px: 16, fs: 13 }, md: { h: 48, px: 22, fs: 15 }, lg: { h: 56, px: 28, fs: 16 } };
  const { bg, text, border, shadow } = vs[variant];
  const { h, px, fs } = ss[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all ${fullWidth ? "w-full" : ""} ${className}`}
      style={{ height: h, paddingLeft: px, paddingRight: px, fontSize: fs, background: bg, color: text, border: `1.5px solid ${border}`, boxShadow: shadow, opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer", letterSpacing: "0.01em" }}
    >
      {icon && <span className="shrink-0 flex">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0 flex">{iconRight}</span>}
    </button>
  );
}

function Field({
  label, placeholder, type = "text", icon, value, onChange, hint, error, multiline = false,
}: {
  label?: string; placeholder?: string; type?: string; icon?: React.ReactNode;
  value?: string; onChange?: (v: string) => void; hint?: string; error?: string; multiline?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPass = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted, letterSpacing: "0.06em" }}>
          {label}
        </label>
      )}
      <div
        className="flex items-center gap-3 rounded-2xl transition-all input-focus"
        style={{
          minHeight: multiline ? 88 : 52, padding: multiline ? "12px 16px" : "0 16px",
          background: focused ? "#fff" : C.surface,
          border: `1.5px solid ${error ? C.red : focused ? C.primary : "transparent"}`,
          boxShadow: error ? `0 0 0 3px rgba(239,68,68,0.1)` : focused ? `0 0 0 3px rgba(37,99,235,0.1)` : SH.xs,
        }}
      >
        {icon && !multiline && <span style={{ color: focused ? C.primary : C.subtle, transition: "color 0.2s", flexShrink: 0 }}>{icon}</span>}
        {multiline ? (
          <textarea
            placeholder={placeholder}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={3}
            className="flex-1 bg-transparent outline-none text-sm resize-none"
            style={{ color: C.ink, fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}
          />
        ) : (
          <input
            type={isPass && show ? "text" : type}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: C.ink, fontFamily: "Inter, sans-serif", letterSpacing: type === "password" && !show ? "0.15em" : undefined }}
          />
        )}
        {isPass && (
          <button type="button" onClick={() => setShow(!show)} style={{ color: C.subtle, cursor: "pointer", flexShrink: 0 }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium flex items-center gap-1" style={{ color: C.red }}><AlertCircle size={12} />{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: C.subtle }}>{hint}</p>}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex items-center rounded-full shrink-0 transition-all duration-200"
      style={{ width: 51, height: 30, background: on ? C.primary : C.surfaceAlt, border: `1.5px solid ${on ? C.primaryHover : C.borderStrong}`, padding: 2, cursor: "pointer" }}
      aria-checked={on}
      role="switch"
    >
      <span
        className="block rounded-full bg-white transition-transform duration-200"
        style={{ width: 22, height: 22, boxShadow: SH.md, transform: on ? "translateX(21px)" : "translateX(0)" }}
      />
    </button>
  );
}

function Card({ children, className = "", style = {}, onClick }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl ${onClick ? "press cursor-pointer" : ""} ${className}`}
      style={{ background: C.card, boxShadow: SH.sm, border: `1px solid ${C.border}`, ...style }}
    >
      {children}
    </div>
  );
}

function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: C.border }} />
      {label && <span className="text-xs font-semibold shrink-0" style={{ color: C.subtle }}>{label}</span>}
      <div className="flex-1 h-px" style={{ background: C.border }} />
    </div>
  );
}

function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-bold" style={{ fontSize: 16, color: C.ink, letterSpacing: "-0.2px" }}>{children}</h3>
      {action}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 16, r = 8, className = "" }: { w?: string | number; h?: number; r?: number; className?: string }) {
  return <div className={`shimmer ${className}`} style={{ width: w, height: h, borderRadius: r }} />;
}

function SkeletonCard() {
  return (
    <Card className="p-4 flex gap-3">
      <Skel w={76} h={76} r={14} />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <Skel w="40%" h={10} />
        <Skel w="70%" h={14} />
        <Skel w="50%" h={10} />
      </div>
    </Card>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center py-14 px-8 gap-5 text-center fade-up">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: C.primaryTint }}>
        <Icon size={36} color={C.primary} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-base" style={{ color: C.ink, letterSpacing: "-0.2px" }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function StatusBar({ light = false }: { light?: boolean }) {
  const col = light ? "rgba(255,255,255,0.9)" : C.ink;
  return (
    <div className="flex items-center justify-between px-7 shrink-0" style={{ height: 48, paddingTop: 12 }}>
      <span className="font-semibold text-xs" style={{ color: col }}>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-px h-3.5">
          {[4, 6, 9, 11].map((h, i) => (
            <div key={i} className="w-1 rounded-sm" style={{ height: h, background: i < 3 ? col : `${col}50` }} />
          ))}
        </div>
        <Wifi size={13} color={col} strokeWidth={2} />
        <div className="flex items-center gap-0.5">
          <div className="rounded-sm" style={{ width: 22, height: 12, border: `1.5px solid ${col}`, padding: "1.5px 2px" }}>
            <div className="h-full rounded-xs" style={{ width: "75%", background: col }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ title, subtitle, onBack, right }: { title?: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-5 shrink-0" style={{ height: 60 }}>
      {onBack ? (
        <button
          onClick={onBack}
          className="press w-10 h-10 flex items-center justify-center rounded-2xl shrink-0 transition-colors"
          style={{ background: C.surface }}
        >
          <ArrowLeft size={20} color={C.ink} strokeWidth={2.5} />
        </button>
      ) : <div className="w-10" />}
      <div className="flex-1 text-center">
        {title && <h2 className="font-bold" style={{ fontSize: 16, color: C.ink, letterSpacing: "-0.2px", lineHeight: 1.2 }}>{title}</h2>}
        {subtitle && <p className="text-xs" style={{ color: C.muted }}>{subtitle}</p>}
      </div>
      {right || <div className="w-10" />}
    </div>
  );
}

type NavScreen = "home" | "search" | "notifications" | "chat" | "profile";
const NAV_ITEMS: { id: NavScreen; icon: any; label: string }[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "search", icon: Search, label: "Search" },
  { id: "notifications", icon: Bell, label: "Alerts" },
  { id: "chat", icon: MessageCircle, label: "Messages" },
  { id: "profile", icon: User, label: "Profile" },
];

function BottomNav({ active, onNav }: { active: string; onNav: (s: Screen) => void }) {
  return (
    <div
      className="shrink-0 flex items-center justify-around px-3 pb-4 pt-1"
      style={{
        height: 76,
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(24px)",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onNav(id)}
            className="press flex flex-col items-center gap-1 transition-all"
            style={{ minWidth: 52 }}
          >
            <div
              className="flex items-center justify-center rounded-2xl transition-all duration-200"
              style={{
                width: 48, height: 32,
                background: isActive ? C.primaryTint : "transparent",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? C.primary : C.subtle} />
            </div>
            <span
              className="font-semibold transition-colors duration-200"
              style={{ fontSize: 10, color: isActive ? C.primary : C.subtle, letterSpacing: "0.01em" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PhoneFrame({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div
      className="relative flex flex-col"
      style={{ width: 393, height: 852, background: C.bg, overflow: "hidden", fontFamily: "'Inter', sans-serif" }}
    >
      <StatusBar light={light} />
      <div className="flex-1 flex flex-col" style={{ overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Item Card Components ─────────────────────────────────────────────────────
function ItemCardFeatured({ item, onClick }: { item: typeof ITEMS[0]; onClick?: () => void }) {
  return (
    <Card onClick={onClick} className="overflow-hidden shrink-0" style={{ width: 200 }}>
      <div className="relative h-36 overflow-hidden" style={{ background: C.surface }}>
        <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.55) 0%, transparent 60%)" }} />
        <div className="absolute top-3 left-3">
          <Pill label={item.type === "lost" ? "LOST" : "FOUND"} variant={item.type === "lost" ? "red" : "green"} />
        </div>
        {item.reward && (
          <div className="absolute top-3 right-3">
            <Pill label={`$${item.reward}`} variant="amber" />
          </div>
        )}
        {item.verified && (
          <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.green, boxShadow: "0 2px 6px rgba(34,197,94,0.4)" }}>
            <Check size={12} color="white" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm leading-tight" style={{ color: C.ink, letterSpacing: "-0.1px" }}>{item.title}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <MapPin size={11} color={C.subtle} />
          <p className="text-xs" style={{ color: C.muted }}>{item.hood}</p>
        </div>
        <p className="text-xs mt-1" style={{ color: C.subtle }}>{item.time}</p>
      </div>
    </Card>
  );
}

function ItemCardRow({ item, onClick }: { item: typeof ITEMS[0]; onClick?: () => void }) {
  return (
    <Card onClick={onClick} className="flex gap-0 overflow-hidden">
      <div className="w-[88px] h-[88px] shrink-0 overflow-hidden" style={{ background: C.surface }}>
        <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Pill label={item.type === "lost" ? "LOST" : "FOUND"} variant={item.type === "lost" ? "red" : "green"} />
            {item.reward && <Pill label={`$${item.reward} reward`} variant="amber" />}
          </div>
          <h4 className="font-semibold text-sm truncate" style={{ color: C.ink, letterSpacing: "-0.1px" }}>{item.title}</h4>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <MapPin size={11} color={C.subtle} />
            <span className="text-xs" style={{ color: C.muted }}>{item.loc}</span>
          </div>
          <span className="text-xs" style={{ color: C.subtle }}>{item.time}</span>
        </div>
      </div>
      <div className="flex items-center pr-3 shrink-0">
        <ChevronRight size={16} color={C.ghost} />
      </div>
    </Card>
  );
}

// ─── SCREEN: Splash ───────────────────────────────────────────────────────────
function SplashScreen({ onNext }: { onNext: () => void }) {
  useEffect(() => { const t = setTimeout(onNext, 2400); return () => clearTimeout(t); }, [onNext]);
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-between relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${C.primaryDeep} 0%, ${C.primary} 45%, #3B82F6 75%, #60A5FA 100%)`,
        paddingBottom: 60,
      }}
    >
      {/* Glassmorphic orbs */}
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", top: -60, right: -80, background: "rgba(255,255,255,0.06)", filter: "blur(1px)" }} />
      <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", bottom: 80, left: -60, background: "rgba(139,92,246,0.2)", filter: "blur(1px)" }} />
      <div style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", top: "35%", right: -20, background: "rgba(255,255,255,0.04)" }} />

      {/* Wordmark area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-7 fade-up">
        <div
          className="relative flex items-center justify-center"
          style={{ width: 88, height: 88, borderRadius: 28 }}
        >
          {/* Glass backing */}
          <div
            className="absolute inset-0 rounded-3xl"
            style={{ background: "rgba(255,255,255,0.14)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3)" }}
          />
          <Target size={42} color="white" strokeWidth={1.5} className="relative z-10" />
        </div>

        <div className="text-center">
          <h1
            style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: "-1.5px", lineHeight: 1.05 }}
          >
            Foundly
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginTop: 10, fontWeight: 500, letterSpacing: "0.02em" }}>
            Find. Return. Reunite.
          </p>
        </div>
      </div>

      {/* Bottom loader */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: i === 1 ? 28 : 8,
                height: 8,
                background: "rgba(255,255,255,0.9)",
                opacity: i === 0 ? 0.35 : i === 1 ? 1 : i === 2 ? 0.55 : 0.25,
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>Community-powered since 2024</p>
      </div>
    </div>
  );
}

// ─── SCREEN: Onboarding ───────────────────────────────────────────────────────
const OB_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1581287053822-fd7bf4f4bfec?w=800&h=1000&fit=crop&auto=format&q=80",
    emoji: "🔍",
    title: "Lost something?",
    body: "Report your item in under 60 seconds. Our AI suggests descriptions and connects you with the community nearby.",
    color: C.primary,
  },
  {
    image: "https://images.unsplash.com/photo-1504093967903-662371ed94e6?w=800&h=1000&fit=crop&auto=format&q=80",
    emoji: "🤲",
    title: "Found something?",
    body: "Upload what you found in seconds. Help reunite people with what matters most — passports, keys, phones, pets.",
    color: C.green,
  },
  {
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=1000&fit=crop&auto=format&q=80",
    emoji: "⭐",
    title: "Earn & be trusted",
    body: "Build your trust score with every return. Earn rewards, community badges, and become a Foundly Hero.",
    color: C.amber,
  },
];

function OnboardingScreen({ onNext }: { onNext: () => void }) {
  const [slide, setSlide] = useState(0);
  const s = OB_SLIDES[slide];
  const isLast = slide === OB_SLIDES.length - 1;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden" style={{ background: "#0A0F1E" }}>
      {/* Full bleed image */}
      <div className="absolute inset-0">
        <img
          key={slide}
          src={s.image}
          alt=""
          className="w-full h-full object-cover fade-in"
          style={{ background: C.surface }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,15,30,0.98) 0%, rgba(10,15,30,0.7) 45%, rgba(10,15,30,0.2) 100%)" }}
        />
      </div>

      {/* Skip */}
      <button
        onClick={onNext}
        className="absolute top-14 right-6 px-4 py-1.5 rounded-full text-xs font-semibold z-10"
        style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)" }}
      >
        Skip
      </button>

      {/* Bottom content */}
      <div className="relative z-10 mt-auto px-7 pb-12">
        <div className="mb-6" key={`c-${slide}`} style={{ animation: "fadeUp 0.3s ease" }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-3xl"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            {s.emoji}
          </div>
          <h2
            className="font-black text-white mb-3"
            style={{ fontSize: 30, letterSpacing: "-0.8px", lineHeight: 1.1 }}
          >
            {s.title}
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, fontWeight: 400 }}>
            {s.body}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-7">
          {OB_SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === slide ? 32 : 8, background: i === slide ? "white" : "rgba(255,255,255,0.25)" }}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {!isLast ? (
            <Btn variant="primary" size="lg" fullWidth onClick={() => setSlide(s => s + 1)} iconRight={<ArrowRight size={18} />}>
              Continue
            </Btn>
          ) : (
            <>
              <Btn variant="primary" size="lg" fullWidth onClick={onNext}>Get Started</Btn>
              <button
                onClick={onNext}
                className="press h-14 px-5 rounded-2xl font-semibold text-sm shrink-0 transition-all"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: Sign Up ──────────────────────────────────────────────────────────
function SignUpScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <PhoneFrame>
      <TopBar onBack={() => onNav("onboarding")} />
      <div className="flex-1 overflow-y-auto no-scroll px-6 pb-10">
        {/* Logo mark */}
        <div className="flex items-center gap-2.5 mb-7 mt-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.primary }}>
            <Target size={17} color="white" strokeWidth={1.8} />
          </div>
          <span className="font-black" style={{ fontSize: 18, color: C.ink, letterSpacing: "-0.4px" }}>Foundly</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: "-0.6px", lineHeight: 1.15, marginBottom: 8 }}>
          Create your account
        </h1>
        <p className="text-sm mb-8" style={{ color: C.muted, lineHeight: 1.6 }}>
          Join 12,000+ people recovering what matters most.
        </p>

        <div className="flex flex-col gap-4">
          <Field label="Full Name" placeholder="Alex Johnson" value={name} onChange={setName} icon={<User size={17} />} />
          <Field label="Email" placeholder="alex@example.com" type="email" value={email} onChange={setEmail} icon={<Mail size={17} />} />
          <Field label="Password" placeholder="Min. 8 characters" type="password" value={pass} onChange={setPass} hint="Use letters, numbers, and symbols" />

          <Btn variant="primary" size="lg" fullWidth onClick={() => onNav("home")} className="mt-2">
            Create Account
          </Btn>

          <Divider label="or continue with" />

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Continue with Google", bg: "#fff", border: C.borderStrong, text: C.ink },
              { label: "Continue with Apple", bg: C.ink, border: C.ink, text: "#fff" },
            ].map(btn => (
              <button
                key={btn.label}
                className="press h-12 rounded-2xl flex items-center justify-center font-semibold text-xs transition-all"
                style={{ background: btn.bg, border: `1.5px solid ${btn.border}`, color: btn.text, boxShadow: SH.sm, gap: 8 }}
              >
                {btn.label.includes("Google") ? "G" : ""}
                {btn.label.includes("Apple") ? "🍎" : ""}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-sm mt-1" style={{ color: C.muted }}>
            Already have an account?{" "}
            <button className="font-semibold" style={{ color: C.primary }} onClick={() => onNav("login")}>Sign in</button>
          </p>
          <p className="text-center text-xs leading-relaxed" style={{ color: C.subtle }}>
            By continuing you agree to our{" "}
            <span style={{ color: C.primary, fontWeight: 600 }}>Terms</span> and{" "}
            <span style={{ color: C.primary, fontWeight: 600 }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Login ────────────────────────────────────────────────────────────
function LoginScreen({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <PhoneFrame>
      <TopBar onBack={() => onNav("onboarding")} />
      <div className="flex-1 overflow-y-auto no-scroll px-6 pb-10">
        <div className="flex items-center gap-2.5 mb-7 mt-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.primary }}>
            <Target size={17} color="white" strokeWidth={1.8} />
          </div>
          <span className="font-black" style={{ fontSize: 18, color: C.ink, letterSpacing: "-0.4px" }}>Foundly</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.ink, letterSpacing: "-0.6px", lineHeight: 1.15, marginBottom: 8 }}>
          Welcome back
        </h1>
        <p className="text-sm mb-8" style={{ color: C.muted }}>Sign in to your Foundly account.</p>

        <div className="flex flex-col gap-4">
          <Field label="Email" placeholder="alex@example.com" type="email" icon={<Mail size={17} />} />
          <Field label="Password" placeholder="Your password" type="password" />
          <button className="text-right text-sm font-semibold" style={{ color: C.primary }} onClick={() => onNav("forgot-password")}>
            Forgot password?
          </button>
          <Btn variant="primary" size="lg" fullWidth onClick={() => onNav("home")} className="mt-1">
            Sign In
          </Btn>
          <Divider label="or" />
          <div className="grid grid-cols-2 gap-3">
            <button className="press h-12 rounded-2xl flex items-center justify-center font-semibold text-xs gap-2" style={{ background: C.card, border: `1.5px solid ${C.borderStrong}`, color: C.ink, boxShadow: SH.sm }}>
              G <span>Google</span>
            </button>
            <button className="press h-12 rounded-2xl flex items-center justify-center font-semibold text-xs gap-2" style={{ background: C.ink, color: "#fff", border: `1.5px solid ${C.ink}` }}>
              🍎 <span>Apple</span>
            </button>
          </div>
          <p className="text-center text-sm" style={{ color: C.muted }}>
            No account?{" "}
            <button className="font-semibold" style={{ color: C.primary }} onClick={() => onNav("signup")}>Sign up free</button>
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Forgot Password ──────────────────────────────────────────────────
function ForgotPasswordScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <PhoneFrame>
      <TopBar title="Reset Password" onBack={() => onNav("login")} />
      <div className="flex-1 overflow-y-auto no-scroll px-6 pb-10">
        {!sent ? (
          <div className="fade-up">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6 mt-4" style={{ background: C.primaryTint }}>
              <Lock size={28} color={C.primary} strokeWidth={1.8} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: "-0.4px", marginBottom: 8 }}>
              Forgot your password?
            </h2>
            <p className="text-sm mb-7" style={{ color: C.muted, lineHeight: 1.65 }}>
              No worries! Enter your email and we&apos;ll send a secure reset link within seconds.
            </p>
            <div className="flex flex-col gap-4">
              <Field label="Email Address" placeholder="alex@example.com" type="email" icon={<Mail size={17} />} value={email} onChange={setEmail} />
              <Btn variant="primary" size="lg" fullWidth onClick={() => setSent(true)}>Send Reset Link</Btn>
              <Btn variant="surface" size="md" fullWidth onClick={() => onNav("login")}>Back to Sign In</Btn>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-12 gap-5 scale-in">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: C.greenTint }}>
              <CheckCircle size={40} color={C.green} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: "-0.4px", marginBottom: 8 }}>Check your inbox</h2>
              <p className="text-sm" style={{ color: C.muted, lineHeight: 1.65 }}>
                We sent a reset link to<br />
                <strong style={{ color: C.ink }}>{email || "alex@example.com"}</strong>.<br />
                It expires in 15 minutes.
              </p>
            </div>
            <Btn variant="primary" size="lg" fullWidth onClick={() => onNav("login")}>Back to Sign In</Btn>
            <button className="text-sm font-semibold" style={{ color: C.muted }}>Didn&apos;t receive it? Resend</button>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Home ─────────────────────────────────────────────────────────────
function HomeScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [activeFilter, setActiveFilter] = useState<"all" | "lost" | "found">("all");
  const filtered = ITEMS.filter(i => activeFilter === "all" || i.type === activeFilter);

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-1 pb-4 shrink-0 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold" style={{ color: C.subtle }}>Good morning ☀️</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: "-0.4px" }}>Alex Johnson</h2>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNav("notifications")}
              className="press relative w-10 h-10 flex items-center justify-center rounded-2xl"
              style={{ background: C.surface }}
            >
              <Bell size={19} color={C.ink2} strokeWidth={2} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: C.red }} />
            </button>
            <Avatar size={40} initials="AJ" src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=80&h=80&fit=crop&auto=format" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scroll">
          {/* Search Bar */}
          <div className="px-6 mb-5">
            <button
              onClick={() => onNav("search")}
              className="press w-full h-12 rounded-2xl flex items-center gap-3 px-4 transition-all"
              style={{ background: C.card, boxShadow: SH.md, border: `1px solid ${C.border}` }}
            >
              <Search size={18} color={C.subtle} />
              <span className="flex-1 text-left text-sm" style={{ color: C.ghost }}>Search items by name or location…</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.primaryTint }}>
                <Filter size={14} color={C.primary} />
              </div>
            </button>
          </div>

          {/* Impact Hero Card (Revolut-style) */}
          <div className="px-6 mb-6">
            <div
              className="relative rounded-3xl overflow-hidden p-5"
              style={{ background: `linear-gradient(135deg, ${C.primaryDeep} 0%, ${C.primary} 55%, #60A5FA 100%)` }}
            >
              {/* Decorative circles */}
              <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", top: -60, right: -40, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", bottom: -30, right: 40, background: "rgba(255,255,255,0.05)" }} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>
                      Community Impact
                    </p>
                    <p style={{ fontSize: 34, fontWeight: 900, color: "white", letterSpacing: "-1px", lineHeight: 1 }}>
                      2,847
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>items returned this month</p>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                    <TrendingUp size={13} color="rgba(255,255,255,0.9)" />
                    <span style={{ fontSize: 12, color: "white", fontWeight: 600 }}>+18%</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => onNav("report-lost")}
                    className="press flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all"
                    style={{ background: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    <AlertCircle size={16} /> Report Lost
                  </button>
                  <button
                    onClick={() => onNav("upload-found")}
                    className="press flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all"
                    style={{ background: "white", color: C.primary }}
                  >
                    <Upload size={16} /> Upload Found
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Match Alert */}
          <div className="px-6 mb-5">
            <div
              className="press flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer"
              style={{ background: C.amberTint, border: `1.5px solid ${C.amber}30` }}
              onClick={() => onNav("notifications")}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.amber }}>
                <Zap size={17} color="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: C.amberDark }}>Possible match found!</p>
                <p className="text-xs truncate" style={{ color: C.amberDark, opacity: 0.75 }}>Your lost wallet may be in Times Square</p>
              </div>
              <ChevronRight size={16} color={C.amberDark} />
            </div>
          </div>

          {/* Categories */}
          <div className="mb-5">
            <div className="px-6 mb-3">
              <SectionTitle action={<button className="text-sm font-semibold" style={{ color: C.primary }}>See all</button>}>Categories</SectionTitle>
            </div>
            <div className="flex gap-3 px-6 overflow-x-auto no-scroll pb-1">
              {CATS.map(cat => (
                <button
                  key={cat.label}
                  onClick={() => onNav("search")}
                  className="press flex flex-col items-center gap-2 rounded-2xl shrink-0 transition-all"
                  style={{ width: 68, paddingTop: 14, paddingBottom: 12, background: C.card, border: `1px solid ${C.border}`, boxShadow: SH.xs }}
                >
                  <span style={{ fontSize: 26 }}>{cat.emoji}</span>
                  <div className="text-center">
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.ink2, letterSpacing: "0.01em" }}>{cat.label}</p>
                    <p style={{ fontSize: 9, color: C.subtle, marginTop: 1 }}>{cat.count}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Featured Nearby */}
          <div className="mb-5">
            <div className="px-6 mb-3 flex items-center justify-between">
              <SectionTitle>Nearby Items</SectionTitle>
              <button onClick={() => onNav("search")} className="press flex items-center gap-1 text-sm font-semibold" style={{ color: C.primary }}>
                Map <Map size={13} />
              </button>
            </div>
            <div className="flex gap-3 px-6 overflow-x-auto no-scroll pb-1">
              {ITEMS.map(item => (
                <ItemCardFeatured key={item.id} item={item} onClick={() => onNav("item-details")} />
              ))}
            </div>
          </div>

          {/* Filter Chips + Feed */}
          <div className="px-6 mb-3">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>Recent Reports</SectionTitle>
            </div>
            <div className="flex gap-2 mb-4">
              {(["all", "lost", "found"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="press px-4 py-1.5 rounded-full font-semibold transition-all"
                  style={{
                    fontSize: 13,
                    background: activeFilter === f ? C.primary : C.card,
                    color: activeFilter === f ? "white" : C.muted,
                    border: `1.5px solid ${activeFilter === f ? C.primary : C.border}`,
                    boxShadow: activeFilter === f ? SH.blue : SH.xs,
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              {filtered.map(item => (
                <ItemCardRow key={item.id} item={item} onClick={() => onNav("item-details")} />
              ))}
            </div>
          </div>

          {/* Stats Strip */}
          <div className="px-6 mt-5 mb-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Found Today", value: "52", trend: "+12%", color: C.green },
                { label: "Near You", value: "34", trend: "0.5km", color: C.primary },
                { label: "Avg. Return", value: "2.3d", trend: "Fast", color: C.amber },
              ].map(s => (
                <Card key={s.label} className="p-3.5 text-center">
                  <p className="font-black" style={{ fontSize: 20, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: C.muted }}>{s.label}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: s.color, opacity: 0.8 }}>{s.trend}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <BottomNav active="home" onNav={onNav} />
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Report Lost ──────────────────────────────────────────────────────
function ReportLostScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("Black Leather Wallet");
  const [desc, setDesc] = useState("");
  const [reward, setReward] = useState("");

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Report Lost Item"
          subtitle={`Step ${step} of 3`}
          onBack={() => step > 1 ? setStep(s => s - 1) : onNav("home")}
        />

        {/* Progress Track */}
        <div className="px-6 pb-4 shrink-0">
          <div className="relative h-1.5 rounded-full" style={{ background: C.surfaceAlt }}>
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%`, background: `linear-gradient(90deg, ${C.primary}, #60A5FA)` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {["Photos & Details", "Location & Time", "Review & Post"].map((l, i) => (
              <span key={l} className="text-xs font-medium" style={{ color: i < step ? C.primary : C.ghost, fontSize: 10 }}>{l}</span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scroll px-6 pb-4">
          {step === 1 && (
            <div className="flex flex-col gap-5 fade-up">
              {/* Upload Zone */}
              <div
                className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-4"
                style={{ height: 180, background: C.primaryTint, border: `2px dashed ${C.primaryTintDark}` }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: C.primary, boxShadow: SH.blue }}>
                  <Camera size={24} color="white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: C.primary }}>Add Photos</p>
                  <p className="text-xs mt-1" style={{ color: C.muted }}>Drag or tap • JPG, PNG up to 10MB</p>
                </div>
                <div className="flex gap-2 absolute bottom-4">
                  <Btn variant="primary" size="xs" icon={<Camera size={12} />}>Camera</Btn>
                  <Btn variant="ghost" size="xs" icon={<ImageIcon size={12} />}>Gallery</Btn>
                </div>
              </div>

              {/* AI Badge */}
              <div
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: `${C.purple}10`, border: `1px solid ${C.purple}20` }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.purpleTint }}>
                  <Sparkles size={16} color={C.purple} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: C.purple }}>AI Description</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted, lineHeight: 1.5 }}>Upload a photo and our AI auto-fills the title, category, and unique identifiers.</p>
                </div>
              </div>

              <Field label="Item Title" placeholder="e.g. Black leather bifold wallet" value={title} onChange={setTitle} />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted, letterSpacing: "0.06em" }}>Category</p>
                <div className="grid grid-cols-4 gap-2">
                  {CATS.map(cat => (
                    <button
                      key={cat.label}
                      onClick={() => setCategory(cat.label)}
                      className="press flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all"
                      style={{
                        background: category === cat.label ? C.primaryTint : C.surface,
                        border: `1.5px solid ${category === cat.label ? C.primary : "transparent"}`,
                        boxShadow: category === cat.label ? `0 0 0 1px ${C.primary}` : "none",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: category === cat.label ? C.primary : C.muted }}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Description" placeholder="Color, brand, distinguishing features…" multiline value={desc} onChange={setDesc} />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5 fade-up">
              <div
                className="h-44 rounded-3xl overflow-hidden relative"
                style={{ background: C.surface }}
              >
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=700&h=400&fit=crop&auto=format&q=80" alt="Map" className="w-full h-full object-cover opacity-55" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    className="press px-5 py-2.5 rounded-2xl font-semibold text-sm flex items-center gap-2"
                    style={{ background: "white", color: C.primary, boxShadow: SH.lg }}
                  >
                    <MapPin size={16} color={C.red} /> Pin Last Location
                  </button>
                </div>
              </div>

              <Field label="Last Seen Location" placeholder="Central Park, near the fountain" icon={<MapPin size={17} />} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date Lost" placeholder="Jul 28, 2025" type="date" icon={<Calendar size={17} />} />
                <Field label="Time (approx)" placeholder="3:00 PM" icon={<Clock size={17} />} />
              </div>
              <Field label="Additional Context" placeholder="Any circumstances, landmarks, or witnesses…" multiline />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5 fade-up">
              {/* Reward section */}
              <div className="p-4 rounded-2xl" style={{ background: C.amberTint, border: `1px solid ${C.amber}25` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.amber }}>
                    <Gift size={18} color="white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: C.amberDark }}>Offer a Reward</p>
                    <p className="text-xs" style={{ color: C.amberDark, opacity: 0.7 }}>Items with rewards get 3× more responses</p>
                  </div>
                </div>
                <Field placeholder="e.g. 50" value={reward} onChange={setReward} icon={<DollarSign size={17} />} hint="Optional — you only pay if the item is returned" />
              </div>

              {/* Preview */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted, letterSpacing: "0.06em" }}>Preview</p>
                <Card className="overflow-hidden">
                  <div className="h-44 overflow-hidden relative" style={{ background: C.surface }}>
                    <img src={ITEMS[1].img} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Pill label="LOST" variant="red" />
                      {reward && <Pill label={`$${reward} reward`} variant="amber" />}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-base" style={{ color: C.ink, letterSpacing: "-0.2px" }}>{title || "Your Item"}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} color={C.subtle} />
                        <span className="text-xs" style={{ color: C.muted }}>Times Square, NY</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} color={C.subtle} />
                        <span className="text-xs" style={{ color: C.muted }}>Just now</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Trust note */}
              <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: C.surface }}>
                <Shield size={18} color={C.green} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                  Your post is reviewed for accuracy. False reports may result in account suspension.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
          {step < 3
            ? <Btn variant="primary" size="lg" fullWidth onClick={() => setStep(s => s + 1)} iconRight={<ArrowRight size={18} />}>Continue</Btn>
            : <Btn variant="primary" size="lg" fullWidth onClick={() => onNav("home")} icon={<CheckCircle size={18} />}>Publish Report</Btn>
          }
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Upload Found ─────────────────────────────────────────────────────
function UploadFoundScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [aiDone, setAiDone] = useState(false);
  const [cat, setCat] = useState("Electronics");

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Upload Found Item" onBack={() => onNav("home")} />
        <div className="flex-1 overflow-y-auto no-scroll px-6 pb-6">
          <div className="flex flex-col gap-5">
            {/* Camera / Gallery */}
            <div className="grid grid-cols-2 gap-3">
              <button
                className="press h-40 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all"
                style={{ background: `linear-gradient(135deg, ${C.primaryDeep}, ${C.primary})`, boxShadow: SH.blue }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <Camera size={24} color="white" />
                </div>
                <span className="font-bold text-sm text-white">Take Photo</span>
              </button>
              <button
                className="press h-40 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all"
                style={{ background: C.surface, border: `2px dashed ${C.surfaceAlt}` }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: C.surfaceAlt }}>
                  <ImageIcon size={24} color={C.muted} />
                </div>
                <span className="font-bold text-sm" style={{ color: C.muted }}>From Gallery</span>
              </button>
            </div>

            {/* AI Scanner */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: `${C.purple}0D`, border: `1.5px solid ${C.purple}25` }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.purpleTint }}>
                  <ScanLine size={17} color={C.purple} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: C.purple }}>AI Auto-Recognition</p>
                  <p className="text-xs" style={{ color: C.muted }}>Point at item — AI fills everything in</p>
                </div>
                {!aiDone ? (
                  <button onClick={() => setAiDone(true)} className="press px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: C.purple, color: "white" }}>Scan</button>
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.greenTint }}>
                    <Check size={14} color={C.green} strokeWidth={3} />
                  </div>
                )}
              </div>
              {aiDone && (
                <div className="mt-2 p-3 rounded-xl scale-in" style={{ background: "white", boxShadow: SH.xs }}>
                  <p className="text-xs font-bold" style={{ color: C.ink }}>Detected: iPhone 15 Pro · Space Black</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>Electronics · Confidence 94% · Serial detected</p>
                </div>
              )}
            </div>

            <Field label="Item Title" placeholder={aiDone ? "iPhone 15 Pro" : "What did you find?"} />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.muted, letterSpacing: "0.06em" }}>Category</p>
              <div className="grid grid-cols-4 gap-2">
                {CATS.map(c => (
                  <button
                    key={c.label}
                    onClick={() => setCat(c.label)}
                    className="press flex flex-col items-center gap-1.5 rounded-2xl py-3 transition-all"
                    style={{ background: cat === c.label ? C.primaryTint : C.surface, border: `1.5px solid ${cat === c.label ? C.primary : "transparent"}` }}
                  >
                    <span style={{ fontSize: 22 }}>{c.emoji}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: cat === c.label ? C.primary : C.muted }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Found at Location" placeholder="Where exactly did you find it?" icon={<MapPin size={17} />} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date Found" type="date" icon={<Calendar size={17} />} />
              <Field label="Storage Location" placeholder="e.g. Police station" icon={<Package size={17} />} />
            </div>
            <Field label="Description" placeholder="Describe any unique identifying marks…" multiline />

            <Btn variant="green" size="lg" fullWidth icon={<Upload size={18} />} onClick={() => onNav("home")}>
              Publish Found Item
            </Btn>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Search ───────────────────────────────────────────────────────────
function SearchScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [view, setView] = useState<"list" | "grid" | "map">("list");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const [typeFilter, setTypeFilter] = useState("All");

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Header */}
        <div className="px-5 pt-1 pb-3 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => onNav("home")} className="press w-10 h-10 flex items-center justify-center rounded-2xl shrink-0" style={{ background: C.surface }}>
              <ArrowLeft size={20} color={C.ink} />
            </button>
            <div className="flex-1 flex items-center gap-3 rounded-2xl px-4 transition-all" style={{ height: 48, background: C.surface, border: `1.5px solid ${C.border}` }}>
              <Search size={17} color={C.primary} />
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="Search items, locations…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ color: C.ink, fontFamily: "Inter, sans-serif" }}
                autoFocus
              />
              {query && <button onClick={() => setQuery("")} className="press shrink-0"><X size={16} color={C.subtle} /></button>}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="press w-10 h-10 flex items-center justify-center rounded-2xl shrink-0"
              style={{ background: showFilters ? C.primary : C.surface, boxShadow: showFilters ? SH.blue : "none" }}
            >
              <Filter size={18} color={showFilters ? "white" : C.ink2} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-col gap-2.5 pb-2 scale-in">
              <div className="flex gap-2 overflow-x-auto no-scroll">
                {["All", "Lost", "Found", "With Reward", "Verified"].map(f => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className="press shrink-0 px-3.5 py-1.5 rounded-full font-semibold transition-all"
                    style={{ fontSize: 12, background: typeFilter === f ? C.primary : C.card, color: typeFilter === f ? "white" : C.muted, border: `1.5px solid ${typeFilter === f ? C.primary : C.border}` }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Newest First", active: sortBy === "Newest", onClick: () => setSortBy("Newest") },
                  { label: "Nearest", active: sortBy === "Nearest", onClick: () => setSortBy("Nearest") },
                  { label: "Reward $$$", active: sortBy === "Reward", onClick: () => setSortBy("Reward") },
                ].map(f => (
                  <button
                    key={f.label}
                    onClick={f.onClick}
                    className="press h-8 rounded-xl font-semibold transition-all"
                    style={{ fontSize: 11, background: f.active ? C.primaryTint : C.surface, color: f.active ? C.primary : C.muted, border: `1px solid ${f.active ? C.primaryTintDark : "transparent"}` }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: C.muted }}>
              <span style={{ color: C.ink, fontWeight: 700 }}>48</span> results{query ? ` for "${query}"` : " near you"}
            </p>
            <div className="flex rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.border}` }}>
              {([["list", BarChart2], ["grid", Grid], ["map", Map]] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="w-9 h-8 flex items-center justify-center transition-colors"
                  style={{ background: view === v ? C.primary : "transparent" }}
                >
                  <Icon size={15} color={view === v ? "white" : C.muted} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto no-scroll px-5 pb-4">
          {view === "list" && (
            <div className="flex flex-col gap-2.5">
              {[...ITEMS, ...ITEMS.slice(0, 2)].map((item, i) => (
                <ItemCardRow key={`${item.id}-${i}`} item={item} onClick={() => onNav("item-details")} />
              ))}
            </div>
          )}

          {view === "grid" && (
            <div className="grid grid-cols-2 gap-3">
              {[...ITEMS, ...ITEMS.slice(0, 2)].map((item, i) => (
                <Card key={`${item.id}-${i}`} onClick={() => onNav("item-details")} className="overflow-hidden cursor-pointer">
                  <div className="h-32 overflow-hidden relative" style={{ background: C.surface }}>
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <Pill label={item.type === "lost" ? "LOST" : "FOUND"} variant={item.type === "lost" ? "red" : "green"} />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm leading-tight truncate" style={{ color: C.ink }}>{item.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={10} color={C.subtle} />
                      <span style={{ fontSize: 10, color: C.muted }}>{item.loc}</span>
                    </div>
                    {item.reward && <Pill label={`$${item.reward}`} variant="amber" />}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {view === "map" && (
            <div className="relative rounded-3xl overflow-hidden" style={{ height: 520, background: C.surface }}>
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=700&h=700&fit=crop&auto=format&q=80" alt="Map" className="w-full h-full object-cover opacity-50" />
              {[
                { t: "30%", l: "28%", type: "lost" }, { t: "48%", l: "58%", type: "found" },
                { t: "62%", l: "22%", type: "found" }, { t: "25%", l: "65%", type: "lost" },
                { t: "70%", l: "50%", type: "found" },
              ].map((pin, i) => (
                <button
                  key={i}
                  onClick={() => onNav("item-details")}
                  className="press absolute w-9 h-9 rounded-full border-3 border-white flex items-center justify-center"
                  style={{ top: pin.t, left: pin.l, background: pin.type === "lost" ? C.red : C.green, boxShadow: SH.md, transform: "translate(-50%,-50%)" }}
                >
                  <MapPin size={16} color="white" />
                </button>
              ))}
              <div className="absolute bottom-4 left-4 right-4">
                <Card className="p-3.5 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: C.red }} />
                  <p className="text-xs font-semibold" style={{ color: C.muted }}>21 Lost items</p>
                  <div className="w-2 h-2 rounded-full ml-2" style={{ background: C.green }} />
                  <p className="text-xs font-semibold" style={{ color: C.muted }}>27 Found items</p>
                </Card>
              </div>
            </div>
          )}
        </div>

        <BottomNav active="search" onNav={onNav} />
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Item Details ─────────────────────────────────────────────────────
function ItemDetailsScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [saved, setSaved] = useState(false);
  const item = ITEMS[0];

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scroll">
          {/* Hero Image */}
          <div className="relative h-80 shrink-0 overflow-hidden" style={{ background: C.surface }}>
            <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.75) 0%, rgba(15,23,42,0.1) 55%, transparent 100%)" }} />
            <StatusBar light />

            {/* Action buttons */}
            <div className="absolute top-12 left-5 right-5 flex justify-between">
              <button
                onClick={() => onNav("search")}
                className="press w-10 h-10 flex items-center justify-center rounded-2xl"
                style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}
              >
                <ArrowLeft size={20} color="white" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSaved(!saved)}
                  className="press w-10 h-10 flex items-center justify-center rounded-2xl"
                  style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}
                >
                  <Heart size={19} color={saved ? "#F87171" : "white"} fill={saved ? "#F87171" : "none"} strokeWidth={2} />
                </button>
                <button className="press w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}>
                  <Share2 size={19} color="white" />
                </button>
                <button className="press w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}>
                  <MoreVertical size={19} color="white" />
                </button>
              </div>
            </div>

            {/* Hero content */}
            <div className="absolute bottom-5 left-5 right-5">
              <div className="flex items-center gap-2 mb-2">
                <Pill label="FOUND" variant="green" dot />
                <Pill label="Verified" variant="primary" />
              </div>
              <h2 className="font-black text-white" style={{ fontSize: 24, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                {item.title}
              </h2>

              {/* Gallery dots */}
              <div className="flex gap-1.5 mt-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="rounded-full transition-all" style={{ width: i === 0 ? 20 : 6, height: 6, background: i === 0 ? "white" : "rgba(255,255,255,0.4)" }} />
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 pt-5 pb-4 flex flex-col gap-5">
            {/* Meta row */}
            <div className="flex items-center gap-4 py-3 px-4 rounded-2xl" style={{ background: C.surface }}>
              <div className="flex items-center gap-1.5 flex-1">
                <MapPin size={15} color={C.red} />
                <span className="text-sm font-semibold" style={{ color: C.ink2 }}>{item.loc}</span>
              </div>
              <div className="w-px h-4" style={{ background: C.border }} />
              <div className="flex items-center gap-1.5">
                <Clock size={15} color={C.subtle} />
                <span className="text-sm" style={{ color: C.muted }}>{item.time}</span>
              </div>
            </div>

            {/* Finder Card */}
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.subtle, letterSpacing: "0.06em" }}>Found by</p>
              <div className="flex items-center gap-3">
                <Avatar
                  size={48}
                  initials="MR"
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&auto=format"
                  ring
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm" style={{ color: C.ink }}>Marcus Rivera</p>
                    <div className="flex items-center gap-0.5">
                      <Star size={12} color={C.amber} fill={C.amber} />
                      <span className="text-xs font-bold" style={{ color: C.ink }}>4.9</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Pill label="Verified Hero" variant="green" />
                    <span className="text-xs" style={{ color: C.muted }}>47 returns</span>
                  </div>
                </div>
                <button className="press w-10 h-10 flex items-center justify-center rounded-2xl" style={{ background: C.primaryTint }}>
                  <MessageCircle size={18} color={C.primary} />
                </button>
              </div>
            </Card>

            {/* Timeline */}
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.subtle, letterSpacing: "0.06em" }}>Status Timeline</p>
              {[
                { label: "Item found & uploaded", sub: "Jul 28 · 9:15 AM", done: true },
                { label: "Claim submitted", sub: "Jul 28 · 10:30 AM", done: true },
                { label: "Verification in progress", sub: "Estimated 24h", done: false, active: true },
                { label: "Item returned to owner", sub: "Pending", done: false },
              ].map((s, i, arr) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center" style={{ paddingTop: 2 }}>
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: s.done ? C.green : s.active ? C.primaryTint : C.surface, border: s.active ? `2px solid ${C.primary}` : "none" }}
                    >
                      {s.done ? <Check size={12} color="white" strokeWidth={3} /> : <div className="w-2 h-2 rounded-full" style={{ background: s.active ? C.primary : C.ghost }} />}
                    </div>
                    {i < arr.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: s.done ? C.greenTint : C.surface, minHeight: 16 }} />}
                  </div>
                  <div className={`pb-4 ${i === arr.length - 1 ? "pb-0" : ""}`}>
                    <p className="text-sm font-semibold" style={{ color: s.done || s.active ? C.ink : C.muted }}>{s.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.subtle }}>{s.sub}</p>
                  </div>
                </div>
              ))}
            </Card>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.subtle, letterSpacing: "0.06em" }}>Description</p>
              <p className="text-sm leading-relaxed" style={{ color: C.ink2, lineHeight: 1.7 }}>
                Found a Space Black iPhone 15 Pro near the Bethesda Fountain in Central Park. The phone is in a black leather case with a cracked screen protector. Screen is locked. Phone is in excellent condition otherwise.
              </p>
            </div>

            {/* Report link */}
            <button className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.subtle }}>
              <Flag size={15} /> Report this listing as incorrect
            </button>
          </div>
        </div>

        {/* Sticky CTA */}
        <div
          className="px-5 py-4 shrink-0 flex gap-3"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}` }}
        >
          <button
            onClick={() => onNav("chat")}
            className="press w-12 h-12 flex items-center justify-center rounded-2xl shrink-0"
            style={{ background: C.surface, border: `1.5px solid ${C.border}` }}
          >
            <Phone size={19} color={C.ink2} />
          </button>
          <Btn variant="primary" size="md" fullWidth icon={<Shield size={18} />} onClick={() => onNav("claim-verification")}>
            Claim This Item
          </Btn>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Claim Verification ───────────────────────────────────────────────
function ClaimVerificationScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [step, setStep] = useState(1);
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Secure Claim" subtitle="Your answers are encrypted" onBack={() => onNav("item-details")} />

        {/* Progress */}
        <div className="px-5 pb-4 shrink-0">
          <div className="flex gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.surface }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: s <= step ? "100%" : "0%", background: C.primary }} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scroll px-5 pb-4">
          {step === 1 && (
            <div className="flex flex-col gap-5 fade-up">
              <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: C.primaryTint }}>
                <Shield size={20} color={C.primary} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm" style={{ color: C.primaryHover }}>How Secure Verification Works</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: C.primary, opacity: 0.8 }}>
                    Answer questions only the true owner would know. The finder cannot see your responses.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { q: "What color is the phone case?", key: a1, set: setA1, hint: "Answer privately — not shown to finder" },
                  { q: "What app icon is in the top-left corner of the screen?", key: a2, set: setA2, hint: "Be as specific as possible" },
                ].map((item, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: C.primaryTint, color: C.primary }}>{i + 1}</div>
                      <p className="font-semibold text-sm" style={{ color: C.ink }}>{item.q}</p>
                    </div>
                    <Field placeholder="Your answer…" value={item.key} onChange={item.set} hint={item.hint} />
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5 fade-up">
              <h3 className="font-bold text-base" style={{ color: C.ink, letterSpacing: "-0.2px" }}>Upload Evidence</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                Provide photos or documents proving ownership — receipts, previous screenshots, serial number photos, etc.
              </p>
              <div
                className="h-44 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
                style={{ borderColor: C.borderStrong }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: C.surface }}>
                  <Upload size={22} color={C.muted} />
                </div>
                <p className="text-sm font-semibold" style={{ color: C.muted }}>Tap to upload evidence</p>
                <p className="text-xs" style={{ color: C.subtle }}>Photos, PDFs • Max 20MB</p>
              </div>
              <Field label="Supporting Notes" placeholder="Any additional proof of ownership…" multiline />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-5 py-8 fade-up">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center" style={{ background: C.greenTint, boxShadow: SH.green }}>
                <CheckCircle size={48} color={C.green} />
              </div>
              <div className="text-center">
                <h2 className="font-black text-2xl mb-2" style={{ color: C.ink, letterSpacing: "-0.5px" }}>Claim Submitted</h2>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  Your claim is under review. We&apos;ll notify you within 24 hours.
                </p>
              </div>

              <Card className="w-full p-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.subtle, letterSpacing: "0.06em" }}>Approval Progress</p>
                {[
                  { label: "Claim received", sub: "Just now", done: true },
                  { label: "Answers reviewed by AI", sub: "~2 minutes", done: true },
                  { label: "Evidence verification", sub: "~6 hours", done: false, active: true },
                  { label: "Finder notified", sub: "After verification", done: false },
                  { label: "Item returned", sub: "Arranged by both parties", done: false },
                ].map((s, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: s.done ? C.green : s.active ? C.primaryTint : C.surface, border: s.active ? `2px solid ${C.primary}` : "none", marginTop: 1 }}>
                        {s.done ? <Check size={10} color="white" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.active ? C.primary : C.ghost }} />}
                      </div>
                      {i < arr.length - 1 && <div className="w-0.5 mt-1" style={{ height: 24, background: s.done ? C.greenTint : C.surface }} />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-semibold" style={{ color: s.done || s.active ? C.ink : C.muted }}>{s.label}</p>
                      <p style={{ fontSize: 10, color: C.subtle }}>{s.sub}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>

        <div className="px-5 py-4 shrink-0 flex gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
          {step > 1 && step < 3 && (
            <button onClick={() => setStep(s => s - 1)} className="press w-12 h-12 flex items-center justify-center rounded-2xl" style={{ background: C.surface }}>
              <ArrowLeft size={20} color={C.ink} />
            </button>
          )}
          {step < 3
            ? <Btn variant="primary" size="lg" fullWidth onClick={() => setStep(s => s + 1)} iconRight={<ArrowRight size={18} />}>Continue</Btn>
            : <Btn variant="primary" size="lg" fullWidth onClick={() => onNav("home")}>Go to Home</Btn>
          }
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Notifications ────────────────────────────────────────────────────
const NOTIF_ICONS: Record<string, any> = {
  match: Zap, found: Search, reward: DollarSign, approved: CheckCircle, rejected: X
};
const NOTIF_COLORS: Record<string, string> = {
  match: "amber", found: "primary", reward: "green", approved: "green", rejected: "red"
};

function NotificationsScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const unread = 2;
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="Notifications"
          onBack={() => onNav("home")}
          right={<button className="text-xs font-bold" style={{ color: C.primary, paddingRight: 4 }}>Mark all read</button>}
        />

        {unread > 0 && (
          <div className="mx-5 mb-3 px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0" style={{ background: C.primaryTint }}>
            <Bell size={16} color={C.primary} />
            <p className="text-sm font-semibold" style={{ color: C.primary }}>{unread} unread notifications</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scroll px-5 pb-4 flex flex-col gap-2">
          {[
            { id: 1, type: "match", title: "Possible Match Found!", body: "Your lost wallet may match an item found 0.3mi away in Times Square.", time: "2 min ago", read: false },
            { id: 2, type: "found", title: "New Item Near You", body: "Someone found an iPhone 15 Pro near Central Park — 89% match with your report.", time: "1h ago", read: false },
            { id: 3, type: "reward", title: "Reward Received 🎉", body: "You earned $50 for returning Sarah Mitchell's wallet. Funds on the way.", time: "2h ago", read: true },
            { id: 4, type: "approved", title: "Claim Approved", body: "Your claim for the AirPods Pro has been approved! Arrange pickup with James.", time: "Yesterday", read: true },
            { id: 5, type: "rejected", title: "Claim Not Verified", body: "Your claim for Ray-Ban Glasses didn't pass verification. Submit more evidence.", time: "2d ago", read: true },
          ].map(n => {
            const Icon = NOTIF_ICONS[n.type];
            const colorKey = NOTIF_COLORS[n.type] as BadgeVariant;
            const colorMap: Record<BadgeVariant, string> = { primary: C.primary, green: C.green, amber: C.amber, red: C.red, purple: C.purple, muted: C.muted };
            const tintMap: Record<BadgeVariant, string> = { primary: C.primaryTint, green: C.greenTint, amber: C.amberTint, red: C.redTint, purple: C.purpleTint, muted: C.surface };
            const col = colorMap[colorKey];
            const tint = tintMap[colorKey];
            return (
              <div
                key={n.id}
                className="press flex items-start gap-3 p-4 rounded-2xl cursor-pointer"
                style={{
                  background: n.read ? C.card : `${col}08`,
                  border: `1px solid ${n.read ? C.border : `${col}20`}`,
                  boxShadow: n.read ? SH.xs : SH.sm,
                }}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: tint }}>
                  <Icon size={19} color={col} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-bold text-sm" style={{ color: C.ink }}>{n.title}</p>
                    {!n.read && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: C.primary }} />}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: C.muted }}>{n.body}</p>
                  <p className="text-xs font-semibold mt-1.5" style={{ color: C.subtle }}>{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>

        <BottomNav active="notifications" onNav={onNav} />
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Chat ─────────────────────────────────────────────────────────────
const MSGS = [
  { id: 1, from: "them", text: "Hi! I think I found your wallet near Times Square.", time: "10:15 AM", read: true },
  { id: 2, from: "me", text: "Oh wow, really?! Can you describe what it looks like?", time: "10:16 AM", read: true },
  { id: 3, from: "them", text: "Black leather bifold. A few cards, subway card, and what looks like a gym membership.", time: "10:17 AM", read: true },
  { id: 4, from: "me", text: "That's 100% mine. Thank you so much — you have no idea how much this means! 🙏", time: "10:18 AM", read: true },
  { id: 5, from: "system", text: "🔒 Secure claim verification started" },
  { id: 6, from: "them", text: "Happy to help! Where would you like to meet?", time: "10:21 AM", read: false },
];

function ChatScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [text, setText] = useState("");

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}
        >
          <button onClick={() => onNav("notifications")} className="press w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: C.surface }}>
            <ArrowLeft size={18} color={C.ink} />
          </button>
          <Avatar size={38} initials="MR" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format" online />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm" style={{ color: C.ink }}>Marcus Rivera</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: C.green }} />
              <p className="text-xs font-medium" style={{ color: C.green }}>Online</p>
              <span className="text-xs" style={{ color: C.subtle }}>· 47 returns · ⭐ 4.9</span>
            </div>
          </div>
          <button className="press w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: C.surface }}>
            <Phone size={17} color={C.ink2} />
          </button>
          <button className="press w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: C.surface }}>
            <MoreVertical size={17} color={C.ink2} />
          </button>
        </div>

        {/* Item context bar */}
        <div className="mx-4 mt-3 mb-1 px-3 py-2.5 rounded-2xl flex items-center gap-3 shrink-0 press cursor-pointer" style={{ background: C.primaryTint, border: `1px solid ${C.primaryTintDark}` }}>
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0" style={{ background: C.surface }}>
            <img src={ITEMS[1].img} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold" style={{ color: C.primary }}>Re: Black Leather Wallet</p>
            <p className="text-xs" style={{ color: C.muted }}>Found in Times Square · 4h ago</p>
          </div>
          <ChevronRight size={15} color={C.primary} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scroll px-4 py-3 flex flex-col gap-2">
          {MSGS.map(msg => {
            if (msg.from === "system") {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-4 py-2 rounded-full text-xs font-semibold" style={{ background: C.primaryTint, color: C.primary }}>
                    {msg.text}
                  </div>
                </div>
              );
            }
            const isMe = msg.from === "me";
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  <Avatar size={30} initials="MR" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&auto=format" />
                )}
                <div className={`flex flex-col gap-1 max-w-[76%] ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className="px-4 py-3 text-sm"
                    style={{
                      background: isMe ? `linear-gradient(135deg, ${C.primary}, ${C.primaryHover})` : C.card,
                      color: isMe ? "white" : C.ink,
                      borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                      boxShadow: isMe ? SH.blue : SH.sm,
                      lineHeight: 1.55,
                    }}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-xs" style={{ color: C.subtle }}>{msg.time}</span>
                    {isMe && msg.read && <Check size={12} color={C.primary} />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          <div className="flex gap-2.5">
            <Avatar size={30} initials="MR" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop&auto=format" />
            <div className="px-4 py-3 rounded-3xl flex gap-1 items-center" style={{ background: C.card, boxShadow: SH.sm, borderRadius: "20px 20px 20px 4px" }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full" style={{ background: C.subtle, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Input */}
        <div
          className="px-4 py-3 pb-5 shrink-0 flex items-center gap-2"
          style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}` }}
        >
          <button className="press w-10 h-10 flex items-center justify-center rounded-2xl shrink-0" style={{ background: C.surface }}>
            <Paperclip size={18} color={C.muted} />
          </button>
          <div
            className="flex-1 flex items-center gap-2 rounded-2xl px-4 transition-all"
            style={{ height: 46, background: C.surface, border: `1.5px solid ${C.border}` }}
          >
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Type a message…"
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ color: C.ink, fontFamily: "Inter, sans-serif" }}
            />
            <button className="press shrink-0"><ImageIcon size={18} color={C.subtle} /></button>
          </div>
          <button
            className="press w-12 h-12 flex items-center justify-center rounded-2xl shrink-0"
            style={{ background: text.trim() ? C.primary : C.surface, boxShadow: text.trim() ? SH.blue : "none", transition: "all 0.2s" }}
          >
            <Send size={18} color={text.trim() ? "white" : C.subtle} />
          </button>
        </div>

        <BottomNav active="chat" onNav={onNav} />
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Profile ──────────────────────────────────────────────────────────
function ProfileScreen({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scroll">
          {/* Cover + Avatar */}
          <div className="relative">
            <div className="h-44 overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.primaryDeep}, ${C.primary}, #3B82F6)` }}>
              <img src="https://images.unsplash.com/photo-1560834791-7ce8a1920d23?w=700&h=300&fit=crop&auto=format&q=80" alt="" className="w-full h-full object-cover opacity-30 mix-blend-luminosity" />
              {/* Top actions */}
              <div className="absolute top-3 right-4 flex gap-2">
                <button onClick={() => onNav("settings")} className="press w-9 h-9 flex items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                  <Settings size={17} color="white" />
                </button>
              </div>
            </div>

            {/* Avatar overlap */}
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                <Avatar
                  size={80}
                  initials="AJ"
                  src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=160&h=160&fit=crop&auto=format"
                  ring
                />
                <button
                  className="press absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center rounded-full border-2 border-white"
                  style={{ background: C.primary }}
                >
                  <Edit3 size={12} color="white" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-16 px-6 pb-4">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: "-0.4px" }}>Alex Johnson</h2>
                <p className="text-sm mt-0.5" style={{ color: C.muted }}>@alexj · New York, NY</p>
                <div className="flex items-center gap-2 mt-2">
                  <Pill label="Verified" variant="green" dot />
                  <Pill label="Top Returner" variant="amber" dot />
                </div>
              </div>
              <button className="press px-4 py-2 rounded-2xl text-sm font-semibold" style={{ background: C.surface, color: C.ink2, border: `1.5px solid ${C.border}` }}>
                Edit Profile
              </button>
            </div>

            {/* Trust Score + Stats */}
            <Card className="p-4 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: C.subtle, letterSpacing: "0.06em" }}>Trust Score</p>
                  <div className="flex items-baseline gap-1">
                    <span style={{ fontSize: 36, fontWeight: 900, color: C.primary, letterSpacing: "-1px" }}>4.9</span>
                    <span className="text-sm" style={{ color: C.muted }}>/5.0</span>
                  </div>
                </div>
                {/* Progress ring (CSS) */}
                <div className="relative ml-auto" style={{ width: 68, height: 68 }}>
                  <svg viewBox="0 0 68 68" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="34" cy="34" r="28" fill="none" strokeWidth="6" stroke={C.surface} />
                    <circle cx="34" cy="34" r="28" fill="none" strokeWidth="6" stroke={C.primary} strokeDasharray={`${0.97 * 175.9} 175.9`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-xs" style={{ color: C.primary }}>97%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                {[
                  { label: "Items Returned", value: "23", icon: "📦" },
                  { label: "Rewards Earned", value: "$340", icon: "💰" },
                  { label: "Response Rate", value: "98%", icon: "⚡" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-xl mb-0.5">{s.icon}</p>
                    <p className="font-black text-base" style={{ color: C.ink, letterSpacing: "-0.3px" }}>{s.value}</p>
                    <p className="text-xs" style={{ color: C.muted, lineHeight: 1.3 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Achievement badges */}
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.subtle, letterSpacing: "0.06em" }}>Achievements</p>
              <div className="flex gap-2 overflow-x-auto no-scroll pb-1">
                {[
                  { emoji: "🏆", label: "Top Returner", color: C.amber },
                  { emoji: "⭐", label: "5-Star Finder", color: C.primary },
                  { emoji: "🤝", label: "Community Hero", color: C.green },
                  { emoji: "🔥", label: "30-Day Streak", color: C.red },
                  { emoji: "🎯", label: "Precision Claimer", color: C.purple },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${b.color}14`, border: `1.5px solid ${b.color}25` }}>
                      {b.emoji}
                    </div>
                    <p className="text-center font-semibold" style={{ fontSize: 9, color: C.muted, maxWidth: 56 }}>{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu */}
            <div className="flex flex-col gap-2">
              {[
                { icon: Package, label: "My Lost Items", sub: "3 active reports", screen: "my-lost" as Screen, badge: "3", color: C.red },
                { icon: Search, label: "My Found Items", sub: "12 items, 9 returned", screen: "my-found" as Screen, badge: "12", color: C.green },
                { icon: Gift, label: "Reward History", sub: "$340 earned lifetime", screen: "reward-history" as Screen, badge: null, color: C.amber },
                { icon: MessageCircle, label: "Messages", sub: "2 unread conversations", screen: "chat" as Screen, badge: "2", color: C.primary },
                { icon: Settings, label: "Settings", sub: "Privacy, notifications, theme", screen: "settings" as Screen, badge: null, color: C.muted },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <Card key={item.label} onClick={() => onNav(item.screen)} className="p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                        <Icon size={19} color={item.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: C.ink }}>{item.label}</p>
                        <p className="text-xs" style={{ color: C.subtle }}>{item.sub}</p>
                      </div>
                      {item.badge && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: item.color }}>
                          <span className="text-white font-bold" style={{ fontSize: 10 }}>{item.badge}</span>
                        </div>
                      )}
                      <ChevronRight size={16} color={C.ghost} />
                    </div>
                  </Card>
                );
              })}

              <Card onClick={() => onNav("login")} className="p-4 mt-1">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: C.redTint }}>
                    <LogOut size={19} color={C.red} />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: C.red }}>Sign Out</p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        <BottomNav active="profile" onNav={onNav} />
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: My Lost Items ────────────────────────────────────────────────────
function MyLostScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const myItems = [
    { ...ITEMS[1], status: "active", daysAgo: 2 },
    { ...ITEMS[3], status: "claimed", daysAgo: 5 },
    { ...ITEMS[5], status: "returned", daysAgo: 12 },
  ];
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: "amber", label: "Active" },
    claimed: { variant: "primary", label: "Claim Pending" },
    returned: { variant: "green", label: "Returned ✓" },
  };

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="My Lost Items"
          onBack={() => onNav("profile")}
          right={<Btn variant="primary" size="xs" icon={<Plus size={14} />} onClick={() => onNav("report-lost")}>New</Btn>}
        />
        <div className="flex-1 overflow-y-auto no-scroll px-5 pb-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[{ label: "Active", v: "1", c: C.amber }, { label: "Pending Claim", v: "1", c: C.primary }, { label: "Returned", v: "1", c: C.green }].map(s => (
              <Card key={s.label} className="p-3 text-center">
                <p className="font-black text-lg" style={{ color: s.c }}>{s.v}</p>
                <p className="text-xs" style={{ color: C.muted }}>{s.label}</p>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {myItems.map((item, i) => {
              const cfg = statusConfig[item.status];
              return (
                <Card key={i} onClick={() => onNav("item-details")} className="overflow-hidden flex">
                  <div className="w-[88px] h-[88px] shrink-0 overflow-hidden" style={{ background: C.surface }}>
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill label={cfg.label} variant={cfg.variant} dot />
                      {item.reward && <Pill label={`$${item.reward} reward`} variant="amber" />}
                    </div>
                    <h4 className="font-semibold text-sm truncate" style={{ color: C.ink }}>{item.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin size={11} color={C.subtle} />
                        <span className="text-xs" style={{ color: C.muted }}>{item.loc}</span>
                      </div>
                      <span className="text-xs" style={{ color: C.subtle }}>{item.daysAgo}d ago</span>
                    </div>
                  </div>
                  <div className="flex items-center pr-3">
                    <ChevronRight size={15} color={C.ghost} />
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-5">
            <Btn variant="primary" size="lg" fullWidth icon={<Plus size={18} />} onClick={() => onNav("report-lost")}>
              Report New Lost Item
            </Btn>
          </div>

          {/* Empty state preview */}
          <div className="mt-6 p-4 rounded-2xl" style={{ background: C.surface }}>
            <p className="text-xs font-semibold mb-1" style={{ color: C.muted }}>💡 Pro tip</p>
            <p className="text-xs leading-relaxed" style={{ color: C.subtle }}>
              Items with photos get <strong style={{ color: C.ink }}>3× more</strong> responses. Items with rewards get <strong style={{ color: C.ink }}>5× more</strong>.
            </p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: My Found Items ───────────────────────────────────────────────────
function MyFoundScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const found = [
    { ...ITEMS[0], status: "claim_pending", foundDays: 0 },
    { ...ITEMS[2], status: "returned", foundDays: 3 },
    { ...ITEMS[4], status: "returned", foundDays: 7 },
  ];

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="My Found Items"
          onBack={() => onNav("profile")}
          right={<Btn variant="green" size="xs" icon={<Plus size={14} />} onClick={() => onNav("upload-found")}>Add</Btn>}
        />
        <div className="flex-1 overflow-y-auto no-scroll px-5 pb-4">
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[{ label: "Total Found", v: "12", c: C.primary }, { label: "Returned", v: "9", c: C.green }, { label: "Pending", v: "3", c: C.amber }].map(s => (
              <Card key={s.label} className="p-3 text-center">
                <p className="font-black text-lg" style={{ color: s.c }}>{s.v}</p>
                <p className="text-xs" style={{ color: C.muted }}>{s.label}</p>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {found.map((item, i) => {
              const isPending = item.status === "claim_pending";
              return (
                <Card key={i} onClick={() => onNav("item-details")} className="overflow-hidden flex">
                  <div className="w-[88px] h-[88px] shrink-0 overflow-hidden" style={{ background: C.surface }}>
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-3 min-w-0">
                    <Pill label={isPending ? "Claim Pending" : "Returned ✓"} variant={isPending ? "amber" : "green"} dot />
                    <h4 className="font-semibold text-sm truncate mt-1" style={{ color: C.ink }}>{item.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin size={11} color={C.subtle} />
                        <span className="text-xs" style={{ color: C.muted }}>{item.loc}</span>
                      </div>
                      <span className="text-xs" style={{ color: C.subtle }}>{item.foundDays === 0 ? "Today" : `${item.foundDays}d ago`}</span>
                    </div>
                  </div>
                  <div className="flex items-center pr-3">
                    <ChevronRight size={15} color={C.ghost} />
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-5">
            <Btn variant="green" size="lg" fullWidth icon={<Upload size={18} />} onClick={() => onNav("upload-found")}>
              Upload New Found Item
            </Btn>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Reward History ───────────────────────────────────────────────────
function RewardHistoryScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const txns = [
    { type: "earned", title: "Returned Sarah's wallet", from: "Sarah M.", amount: 50, date: "Jul 28" },
    { type: "earned", title: "Returned James's phone", from: "James K.", amount: 100, date: "Jul 20" },
    { type: "posted", title: "Reward posted", for: "Lost Keys", amount: -30, date: "Jul 15" },
    { type: "earned", title: "Returned Ana's keys", from: "Ana G.", amount: 30, date: "Jul 10" },
    { type: "posted", title: "Reward posted", for: "Lost Bag", amount: -20, date: "Jul 2" },
    { type: "earned", title: "Returned Tom's briefcase", from: "Tom B.", amount: 80, date: "Jun 28" },
  ];

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Reward History" onBack={() => onNav("profile")} />
        <div className="flex-1 overflow-y-auto no-scroll px-5 pb-4">
          {/* Balance card */}
          <div
            className="rounded-3xl p-5 mb-5 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${C.primaryDeep} 0%, ${C.primary} 100%)` }}
          >
            <div style={{ position: "absolute", width: 200, height: 200, top: -50, right: -50, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Total Earned</p>
            <p style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: "-1.5px", lineHeight: 1.05, margin: "6px 0" }}>$340</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Lifetime across 9 successful returns</p>
            <div className="flex gap-3 mt-4">
              {[{ label: "Earned", val: "$370" }, { label: "Posted", val: "$30" }, { label: "Net", val: "$340" }].map(s => (
                <div key={s.label} className="flex-1 py-2.5 px-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "white" }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.subtle, letterSpacing: "0.06em" }}>Transaction History</p>

          <div className="flex flex-col gap-2">
            {txns.map((r, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: r.type === "earned" ? C.greenTint : C.amberTint }}
                  >
                    {r.type === "earned" ? <DollarSign size={18} color={C.green} /> : <Gift size={18} color={C.amber} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: C.ink }}>{r.title}</p>
                    <p className="text-xs" style={{ color: C.muted }}>{r.from ? `from ${r.from}` : `for ${r.for}`} · {r.date}</p>
                  </div>
                  <p
                    className="font-black text-base shrink-0"
                    style={{ color: r.amount > 0 ? C.green : C.muted, letterSpacing: "-0.3px" }}
                  >
                    {r.amount > 0 ? `+$${r.amount}` : `-$${Math.abs(r.amount)}`}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Settings ─────────────────────────────────────────────────────────
function SettingsScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [dark, setDark] = useState(false);
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [location, setLocation] = useState(true);
  const [matching, setMatching] = useState(true);
  const [twofa, setTwofa] = useState(false);

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest mb-2.5 px-1" style={{ color: C.subtle, letterSpacing: "0.08em" }}>{title}</p>
        <Card className="overflow-hidden divide-y" style={{ border: `1px solid ${C.border}` }}>
          {children}
        </Card>
      </div>
    );
  }

  function Row({ icon: Icon, label, sub, right, danger = false, onClick }: { icon: any; label: string; sub?: string; right?: React.ReactNode; danger?: boolean; onClick?: () => void }) {
    return (
      <button
        onClick={onClick}
        className="press w-full flex items-center gap-3.5 px-4 py-3.5 transition-colors text-left"
        style={{ borderBottom: `1px solid ${C.border}`, background: "transparent" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: danger ? C.redTint : C.surface }}
        >
          <Icon size={18} color={danger ? C.red : C.muted} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: danger ? C.red : C.ink }}>{label}</p>
          {sub && <p className="text-xs mt-0.5" style={{ color: C.subtle }}>{sub}</p>}
        </div>
        {right ?? <ChevronRight size={16} color={C.ghost} />}
      </button>
    );
  }

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Settings" onBack={() => onNav("profile")} />

        {/* Profile mini card */}
        <div className="px-5 mb-5 shrink-0">
          <Card className="p-4 flex items-center gap-3">
            <Avatar size={48} initials="AJ" src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=80&h=80&fit=crop&auto=format" />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: C.ink }}>Alex Johnson</p>
              <p className="text-xs" style={{ color: C.muted }}>alex@example.com</p>
            </div>
            <Pill label="Pro" variant="primary" />
          </Card>
        </div>

        <div className="flex-1 overflow-y-auto no-scroll px-5 pb-6">
          <Section title="Appearance">
            <Row icon={dark ? Moon : Sun} label="Dark Mode" sub="Switch between light and dark" right={<Toggle on={dark} onChange={setDark} />} />
            <Row icon={Globe} label="Language" sub="English (US)" right={<span className="text-sm font-semibold mr-2" style={{ color: C.muted }}>EN</span>} />
          </Section>

          <Section title="Notifications">
            <Row icon={Bell} label="Push Notifications" sub="Item matches, claims, messages" right={<Toggle on={push} onChange={setPush} />} />
            <Row icon={Mail} label="Email Notifications" sub="Weekly summary and alerts" right={<Toggle on={email} onChange={setEmail} />} />
            <Row icon={Zap} label="Instant Matching Alerts" sub="Notify when we find a match" right={<Toggle on={matching} onChange={setMatching} />} />
          </Section>

          <Section title="Privacy & Security">
            <Row icon={MapPin} label="Location Sharing" sub="Used to find nearby items" right={<Toggle on={location} onChange={setLocation} />} />
            <Row icon={Shield} label="Two-Factor Authentication" sub={twofa ? "Enabled" : "Not enabled"} right={<Toggle on={twofa} onChange={setTwofa} />} />
            <Row icon={Eye} label="Profile Visibility" sub="Public to verified users" />
            <Row icon={FileText} label="Data & Privacy" />
          </Section>

          <Section title="Account">
            <Row icon={Edit3} label="Edit Profile" />
            <Row icon={Key} label="Change Password" />
            <Row icon={Award} label="Upgrade to Pro" sub="Unlock advanced features" right={<Pill label="New" variant="amber" />} />
            <Row icon={HelpCircle} label="Help & Support" />
            <Row icon={Info} label="About Foundly" sub="Version 2.4.1" />
          </Section>

          <Section title="Danger Zone">
            <Row icon={LogOut} label="Sign Out" danger onClick={() => onNav("login")} right={<span />} />
            <Row icon={Trash2} label="Delete Account" sub="Permanently remove all data" danger right={<span />} />
          </Section>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── SCREEN: Admin Dashboard ──────────────────────────────────────────────────
function AdminScreen({ onNav: _onNav }: { onNav: (s: Screen) => void }) {
  const [tab, setTab] = useState("overview");

  const tabs = ["overview", "users", "reports", "claims"];

  return (
    <PhoneFrame>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin header */}
        <div
          className="px-5 pt-2 pb-4 shrink-0"
          style={{ background: `linear-gradient(135deg, ${C.primaryDeep}, ${C.primary})` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>Admin Panel</p>
              <h2 className="font-black text-white" style={{ fontSize: 22, letterSpacing: "-0.5px", marginTop: 2 }}>Dashboard</h2>
            </div>
            <Avatar size={40} initials="AD" />
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(0,0,0,0.2)" }}>
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="press flex-1 py-1.5 rounded-xl font-semibold transition-all"
                style={{
                  fontSize: 11,
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? C.primary : "rgba(255,255,255,0.6)",
                  letterSpacing: "0.02em",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scroll px-5 py-4 pb-6">
          {tab === "overview" && (
            <div className="flex flex-col gap-4">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Users", val: "12,847", icon: Users, color: C.primary, trend: "+8.2%", up: true },
                  { label: "Active Reports", val: "342", icon: FileText, color: C.amber, trend: "+12%", up: true },
                  { label: "Items Returned", val: "2,104", icon: CheckCircle, color: C.green, trend: "+5.1%", up: true },
                  { label: "Pending Claims", val: "89", icon: Clock, color: C.purple, trend: "-3%", up: false },
                ].map(s => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.label} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                          <Icon size={18} color={s.color} />
                        </div>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: s.up ? C.greenTint : C.redTint }}>
                          <ArrowUpRight size={11} color={s.up ? C.green : C.red} style={{ transform: s.up ? "none" : "rotate(90deg)" }} />
                          <span className="text-xs font-bold" style={{ color: s.up ? C.green : C.red }}>{s.trend}</span>
                        </div>
                      </div>
                      <p className="font-black" style={{ fontSize: 22, color: C.ink, letterSpacing: "-0.5px" }}>{s.val}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{s.label}</p>
                    </Card>
                  );
                })}
              </div>

              {/* Area Chart */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-sm" style={{ color: C.ink, letterSpacing: "-0.1px" }}>Weekly Activity</p>
                  <Pill label="This Week" variant="muted" />
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={CHART_WEEKLY} margin={{ top: 4, right: 4, bottom: 0, left: -32 }}>
                    <defs>
                      <linearGradient id="foundGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.primary} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lostGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.red} stopOpacity={0.12} />
                        <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" tick={{ fontSize: 10, fill: C.subtle }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: C.subtle }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: SH.lg, fontSize: 12 }} />
                    <Area type="monotone" dataKey="found" name="Found" stroke={C.primary} strokeWidth={2} fill="url(#foundGrad)" dot={false} />
                    <Area type="monotone" dataKey="lost" name="Lost" stroke={C.red} strokeWidth={2} fill="url(#lostGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: C.primary }} /><span className="text-xs" style={{ color: C.muted }}>Found</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: C.red }} /><span className="text-xs" style={{ color: C.muted }}>Lost</span></div>
                </div>
              </Card>

              {/* Category Pie + Bar */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4">
                  <p className="font-bold text-xs mb-3" style={{ color: C.ink }}>By Category</p>
                  <PieChart width={120} height={90}>
                    <Pie data={CHART_CATS} cx={56} cy={44} innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                      {CHART_CATS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="mt-1 flex flex-col gap-1">
                    {CHART_CATS.slice(0, 3).map(c => (
                      <div key={c.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                        <span style={{ fontSize: 10, color: C.muted }}>{c.name}</span>
                        <span className="ml-auto font-bold" style={{ fontSize: 10, color: C.ink }}>{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <p className="font-bold text-xs mb-3" style={{ color: C.ink }}>Daily Items</p>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={CHART_WEEKLY.slice(0, 5)} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
                      <Bar dataKey="found" fill={C.primary} radius={[4, 4, 0, 0]} />
                      <XAxis dataKey="d" tick={{ fontSize: 9, fill: C.subtle }} axisLine={false} tickLine={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="p-4">
                <p className="font-bold text-sm mb-3" style={{ color: C.ink }}>Recent Activity</p>
                {[
                  { user: "Sarah M.", action: "Submitted a claim for iPhone 15 Pro", time: "2m", avatar: "SM" },
                  { user: "James K.", action: "Reported a lost AirPods case", time: "8m", avatar: "JK" },
                  { user: "Ana G.", action: "Uploaded found Ray-Ban glasses", time: "15m", avatar: "AG" },
                  { user: "Tom B.", action: "Claim approved · $80 reward sent", time: "22m", avatar: "TB" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
                    <Avatar size={32} initials={a.avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: C.ink }}>
                        <span className="font-bold">{a.user}</span> {a.action}
                      </p>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: C.subtle }}>{a.time} ago</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {tab === "users" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-4 rounded-2xl" style={{ height: 44, background: C.surface, border: `1.5px solid ${C.border}` }}>
                <Search size={16} color={C.subtle} />
                <span className="text-sm" style={{ color: C.ghost }}>Search users…</span>
              </div>
              {[
                { name: "Sarah Mitchell", email: "sarah@example.com", returns: 15, score: 4.8, verified: true, img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&auto=format" },
                { name: "James Kumar", email: "james@example.com", returns: 8, score: 4.5, verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&auto=format" },
                { name: "Ana Garcia", email: "ana@example.com", returns: 3, score: 4.2, verified: false, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&auto=format" },
                { name: "Tom Blake", email: "tom@example.com", returns: 22, score: 5.0, verified: true, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&auto=format" },
              ].map((u, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar size={42} initials={u.name.split(" ").map(n => n[0]).join("")} src={u.img} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: C.ink }}>{u.name}</p>
                        {u.verified && <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: C.green }}><Check size={9} color="white" strokeWidth={3} /></div>}
                      </div>
                      <p className="text-xs" style={{ color: C.muted }}>{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: C.ink }}>{u.returns} returns</p>
                      <div className="flex items-center justify-end gap-0.5 mt-0.5">
                        <Star size={11} color={C.amber} fill={C.amber} />
                        <span className="text-xs font-bold" style={{ color: C.ink }}>{u.score}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === "reports" && (
            <div className="flex flex-col gap-2.5">
              {ITEMS.map((item, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: C.surface }}>
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill label={item.type === "lost" ? "LOST" : "FOUND"} variant={item.type === "lost" ? "red" : "green"} />
                        {item.verified && <Pill label="Verified" variant="primary" />}
                      </div>
                      <p className="font-semibold text-sm truncate" style={{ color: C.ink }}>{item.title}</p>
                      <p className="text-xs" style={{ color: C.muted }}>{item.loc} · {item.time}</p>
                    </div>
                    <button className="press w-8 h-8 flex items-center justify-center rounded-xl" style={{ background: C.surface }}>
                      <MoreVertical size={16} color={C.muted} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === "claims" && (
            <div className="flex flex-col gap-2.5">
              {[
                { item: "iPhone 15 Pro", claimant: "Alex J.", status: "pending", time: "30m ago" },
                { item: "Black Wallet", claimant: "Sarah M.", status: "approved", time: "2h ago" },
                { item: "AirPods Pro", claimant: "Tom B.", status: "rejected", time: "4h ago" },
                { item: "Ray-Ban Glasses", claimant: "Ana G.", status: "pending", time: "6h ago" },
              ].map((c, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: C.ink }}>{c.item}</p>
                      <p className="text-xs" style={{ color: C.muted }}>by {c.claimant} · {c.time}</p>
                    </div>
                    <Pill
                      label={c.status === "pending" ? "Pending" : c.status === "approved" ? "Approved" : "Rejected"}
                      variant={c.status === "pending" ? "amber" : c.status === "approved" ? "green" : "red"}
                      dot
                    />
                  </div>
                  {c.status === "pending" && (
                    <div className="flex gap-2">
                      <button className="press flex-1 h-9 rounded-xl text-xs font-bold" style={{ background: C.greenTint, color: C.greenDark }}>Approve</button>
                      <button className="press flex-1 h-9 rounded-xl text-xs font-bold" style={{ background: C.redTint, color: C.red }}>Reject</button>
                      <button className="press w-9 h-9 rounded-xl text-xs" style={{ background: C.surface }}>
                        <Eye size={15} color={C.muted} />
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─── Screen Registry ──────────────────────────────────────────────────────────
type ScreenGroup = { label: string; screens: { id: Screen; label: string; icon: any }[] };

const SCREEN_GROUPS: ScreenGroup[] = [
  {
    label: "Auth",
    screens: [
      { id: "splash", label: "Splash", icon: Sparkles },
      { id: "onboarding", label: "Onboarding", icon: ArrowRight },
      { id: "signup", label: "Sign Up", icon: Users },
      { id: "login", label: "Login", icon: Shield },
      { id: "forgot-password", label: "Forgot Password", icon: Key },
    ],
  },
  {
    label: "Core",
    screens: [
      { id: "home", label: "Home", icon: Home },
      { id: "search", label: "Search", icon: Search },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "chat", label: "Chat", icon: MessageCircle },
      { id: "profile", label: "Profile", icon: User },
    ],
  },
  {
    label: "Items",
    screens: [
      { id: "report-lost", label: "Report Lost", icon: AlertCircle },
      { id: "upload-found", label: "Upload Found", icon: Upload },
      { id: "item-details", label: "Item Details", icon: Package },
      { id: "claim-verification", label: "Claim Verification", icon: CheckCircle },
    ],
  },
  {
    label: "Account",
    screens: [
      { id: "my-lost", label: "My Lost Items", icon: Package },
      { id: "my-found", label: "My Found Items", icon: Heart },
      { id: "reward-history", label: "Reward History", icon: DollarSign },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Admin",
    screens: [
      { id: "admin", label: "Admin Dashboard", icon: BarChart2 },
    ],
  },
];

function renderScreen(current: Screen, onNav: (s: Screen) => void) {
  switch (current) {
    case "splash": return <SplashScreen onNext={() => onNav("onboarding")} />;
    case "onboarding": return <OnboardingScreen onNext={() => onNav("login")} />;
    case "signup": return <SignUpScreen onNav={onNav} />;
    case "login": return <LoginScreen onNav={onNav} />;
    case "forgot-password": return <ForgotPasswordScreen onNav={onNav} />;
    case "home": return <HomeScreen onNav={onNav} />;
    case "report-lost": return <ReportLostScreen onNav={onNav} />;
    case "upload-found": return <UploadFoundScreen onNav={onNav} />;
    case "search": return <SearchScreen onNav={onNav} />;
    case "item-details": return <ItemDetailsScreen onNav={onNav} />;
    case "claim-verification": return <ClaimVerificationScreen onNav={onNav} />;
    case "notifications": return <NotificationsScreen onNav={onNav} />;
    case "chat": return <ChatScreen onNav={onNav} />;
    case "profile": return <ProfileScreen onNav={onNav} />;
    case "my-lost": return <MyLostScreen onNav={onNav} />;
    case "my-found": return <MyFoundScreen onNav={onNav} />;
    case "reward-history": return <RewardHistoryScreen onNav={onNav} />;
    case "settings": return <SettingsScreen onNav={onNav} />;
    case "admin": return <AdminScreen onNav={onNav} />;
    default: return <HomeScreen onNav={onNav} />;
  }
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [current, setCurrent] = useState<Screen>("splash");
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);

  function navigate(s: Screen) {
    setPrevScreen(current);
    setCurrent(s);
  }

  const totalScreens = SCREEN_GROUPS.reduce((acc, g) => acc + g.screens.length, 0);

  return (
    <>
      <GlobalStyles />
      <div
        className="flex min-h-screen"
        style={{ background: "#090D1A", fontFamily: "'Inter', sans-serif" }}
      >
        {/* ── Sidebar ── */}
        <aside
          className="w-56 shrink-0 flex flex-col py-6 overflow-y-auto no-scroll"
          style={{ background: "#0D1120", borderRight: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 mb-7">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: C.primary, boxShadow: SH.blue }}>
              <Target size={17} color="white" strokeWidth={1.8} />
            </div>
            <div>
              <span className="font-black text-white" style={{ fontSize: 16, letterSpacing: "-0.4px" }}>Foundly</span>
              <span className="block text-xs" style={{ color: "rgba(255,255,255,0.3)", marginTop: -1 }}>{totalScreens} screens</span>
            </div>
          </div>

          {/* Groups */}
          {SCREEN_GROUPS.map(group => (
            <div key={group.label} className="mb-4 px-3">
              <p
                className="px-2 mb-1.5"
                style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                {group.label}
              </p>
              {group.screens.map(({ id, label, icon: Icon }) => {
                const isActive = current === id;
                return (
                  <button
                    key={id}
                    onClick={() => navigate(id)}
                    className="press w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-0.5 transition-all text-left"
                    style={{
                      background: isActive ? `rgba(37,99,235,0.18)` : "transparent",
                      borderLeft: isActive ? `2px solid ${C.primary}` : "2px solid transparent",
                    }}
                  >
                    <Icon
                      size={15}
                      color={isActive ? C.primary : "rgba(255,255,255,0.4)"}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: isActive ? "white" : "rgba(255,255,255,0.45)", letterSpacing: "0.01em" }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Version footer */}
          <div className="mt-auto px-5 pt-4">
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Foundly Design System v2.0</p>
          </div>
        </aside>

        {/* ── Main Canvas ── */}
        <main className="flex-1 flex items-center justify-center p-8 relative" style={{ minHeight: "100vh" }}>
          {/* Background glow */}
          <div style={{ position: "absolute", width: 600, height: 600, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: `radial-gradient(circle, ${C.primary}12 0%, transparent 70%)`, pointerEvents: "none" }} />

          {/* Phone shell */}
          <div
            className="relative"
            style={{
              borderRadius: 52,
              padding: 14,
              background: "linear-gradient(160deg, #2A2A3A 0%, #1A1A26 50%, #141420 100%)",
              boxShadow: "0 50px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)",
            }}
          >
            {/* Left buttons */}
            <div style={{ position: "absolute", left: -4, top: 90, width: 4, height: 32, borderRadius: "4px 0 0 4px", background: "#22222E" }} />
            <div style={{ position: "absolute", left: -4, top: 135, width: 4, height: 52, borderRadius: "4px 0 0 4px", background: "#22222E" }} />
            <div style={{ position: "absolute", left: -4, top: 200, width: 4, height: 52, borderRadius: "4px 0 0 4px", background: "#22222E" }} />
            {/* Right button */}
            <div style={{ position: "absolute", right: -4, top: 140, width: 4, height: 72, borderRadius: "0 4px 4px 0", background: "#22222E" }} />

            {/* Dynamic Island */}
            <div
              style={{
                position: "absolute",
                top: 22,
                left: "50%",
                transform: "translateX(-50%)",
                width: 120,
                height: 34,
                borderRadius: 20,
                background: "#000",
                zIndex: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#1A1A1A" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0D0D0D" }} />
            </div>

            {/* Screen */}
            <div
              key={current}
              className="screen-enter overflow-hidden"
              style={{ width: 393, height: 852, borderRadius: 38 }}
            >
              {renderScreen(current, navigate)}
            </div>

            {/* Home indicator */}
            <div className="flex justify-center mt-2.5">
              <div style={{ width: 130, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.18)" }} />
            </div>
          </div>

          {/* Screen info tooltip */}
          <div
            className="absolute right-8 top-8 flex flex-col gap-1.5"
            style={{ maxWidth: 200 }}
          >
            <div className="px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Current Screen</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 700, marginTop: 2 }}>
                {SCREEN_GROUPS.flatMap(g => g.screens).find(s => s.id === current)?.label ?? current}
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
