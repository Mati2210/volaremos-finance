import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Plus, X, Trash2,
  ArrowUpRight, ArrowDownRight, Calendar, ChevronDown,
  Minus, RefreshCcw, Info
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

/* ─── קבועים ──────────────────────────────────────────────────── */

const CATEGORIES = [
  "הכנסות לקוחות", "ייעוץ", "שיווק",
  "תפעול", "תוכנה", "נסיעות", "שירותים", "אחר"
];

const MONTH_NAMES = ["ינו׳","פבר׳","מרץ","אפר׳","מאי","יוני","יולי","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"];

const FREQUENCIES = [
  { key: "once",    label: "חד-פעמי",  unit: null,    units: null     },
  { key: "daily",   label: "יומי",     unit: "יום",   units: "ימים"   },
  { key: "weekly",  label: "שבועי",    unit: "שבוע",  units: "שבועות" },
  { key: "monthly", label: "חודשי",    unit: "חודש",  units: "חודשים" },
  { key: "yearly",  label: "שנתי",     unit: "שנה",   units: "שנים"   },
];

const PRESETS = [
  { key: "3months",    badge: "3M", label: "3 חודשים"       },
  { key: "6months",    badge: "6M", label: "6 חודשים"       },
  { key: "1year",      badge: "1Y", label: "שנה"            },
  { key: "fiscalYear", badge: "FY", label: "סוף שנת כספים"  },
  { key: "noEnd",      badge: "∞",  label: "ללא תאריך סיום" },
  { key: "custom",     badge: "↗",  label: "תאריך מותאם"    },
];

const INITIAL_TRANSACTIONS = [
  { id: 1, date: "2026-03-10", description: "TechCorp — מסירת פרויקט",         category: "הכנסות לקוחות", type: "income",  amount: 12500, frequency: "once", multiplier: 1 },
  { id: 2, date: "2026-04-03", description: "Google Ads — קמפיין רבעון 2",     category: "שיווק",          type: "expense", amount: 2300,  frequency: "once", multiplier: 1 },
  { id: 3, date: "2026-04-18", description: "DataSoft — רישיון ארגוני",        category: "הכנסות לקוחות", type: "income",  amount: 8750,  frequency: "once", multiplier: 1 },
  { id: 4, date: "2026-05-07", description: "שכירות משרד — מאי",               category: "תפעול",          type: "expense", amount: 3200,  frequency: "monthly", multiplier: 1 },
  { id: 5, date: "2026-05-22", description: "SaaS Stack — חידוש שנתי",         category: "תוכנה",          type: "expense", amount: 890,   frequency: "yearly", multiplier: 1 },
  { id: 6, date: "2026-06-01", description: "GlobalTech — שכר טרחה ייעוצי",   category: "ייעוץ",          type: "income",  amount: 6000,  frequency: "once", multiplier: 1 },
  { id: 7, date: "2026-06-12", description: "שכר עובדים — יוני",               category: "תפעול",          type: "expense", amount: 4500,  frequency: "monthly", multiplier: 1 },
  { id: 8, date: "2026-06-20", description: "אסטרטגיית מותג — פרסום דיגיטלי", category: "שיווק",          type: "expense", amount: 1200,  frequency: "once", multiplier: 1 },
];

/* ─── עזרים ──────────────────────────────────────────────────── */

const fmt = (n) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);

const parseDate = (d) => new Date(d + "T00:00:00");

const addMonths = (d, n) => {
  const dt = new Date(d + "T00:00:00");
  dt.setMonth(dt.getMonth() + n);
  return dt.toISOString().split("T")[0];
};
const addYears = (d, n) => {
  const dt = new Date(d + "T00:00:00");
  dt.setFullYear(dt.getFullYear() + n);
  return dt.toISOString().split("T")[0];
};

const getEndDate = (preset, start, custom) => {
  if (preset === "3months")    return addMonths(start, 3);
  if (preset === "6months")    return addMonths(start, 6);
  if (preset === "1year")      return addYears(start, 1);
  if (preset === "fiscalYear") return `${new Date(start + "T00:00:00").getFullYear()}-12-31`;
  if (preset === "custom")     return custom || null;
  return null;
};

const countOcc = (freq, mult, start, end) => {
  if (!end || freq === "once") return null;
  const s = new Date(start + "T00:00:00");
  const e = new Date(end   + "T00:00:00");
  if (e < s) return 0;
  let n = 0, c = new Date(s);
  while (c <= e && n <= 9999) {
    n++;
    if      (freq === "daily")   c.setDate(c.getDate() + mult);
    else if (freq === "weekly")  c.setDate(c.getDate() + mult * 7);
    else if (freq === "monthly") c.setMonth(c.getMonth() + mult);
    else if (freq === "yearly")  c.setFullYear(c.getFullYear() + mult);
  }
  return n;
};

const freqLabel = (freq, mult) => {
  const f = FREQUENCIES.find(f => f.key === freq);
  if (!f || freq === "once") return null;
  return `כל ${mult > 1 ? mult + " " + f.units : f.unit}`;
};

/* ─── סגנונות משותפים ─────────────────────────────────────────── */

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 12,
  border: "1.5px solid #E2E8F0", fontSize: 14, fontWeight: 600,
  color: "#0F172A", outline: "none", boxSizing: "border-box",
  background: "white", transition: "border-color 0.15s",
  fontFamily: "inherit", direction: "rtl", textAlign: "right"
};

const labelStyle = {
  display: "block", fontSize: 10, fontWeight: 700,
  letterSpacing: "0.08em", textTransform: "uppercase",
  color: "#94A3B8", marginBottom: 8, textAlign: "right"
};

const reveal = (show) => ({
  maxHeight: show ? "800px" : "0px",
  opacity: show ? 1 : 0,
  overflow: "hidden",
  transition: "max-height 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease",
  pointerEvents: show ? "auto" : "none",
});

/* ─── רכיבי עזר ──────────────────────────────────────────────── */

const WingsWatermark = () => (
  <svg
    viewBox="0 0 200 90" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ position: "absolute", left: 0, top: 0, width: "80%", height: "100%",
             opacity: 0.07, color: "white", pointerEvents: "none" }}
  >
    <path d="M100 82 L58 24 L4 16 L24 28 L48 35 L64 50 L100 82Z" fill="currentColor"/>
    <path d="M100 82 L66 31 L20 24 L40 35 L58 42 L72 57 L100 82Z" fill="currentColor" fillOpacity="0.65"/>
    <path d="M100 82 L74 40 L38 33 L54 42 L69 48 L80 61 L100 82Z" fill="currentColor" fillOpacity="0.35"/>
    <path d="M100 82 L142 24 L196 16 L176 28 L152 35 L136 50 L100 82Z" fill="currentColor"/>
    <path d="M100 82 L134 31 L180 24 L160 35 L142 42 L128 57 L100 82Z" fill="currentColor" fillOpacity="0.65"/>
    <path d="M100 82 L126 40 L162 33 L146 42 L131 48 L120 61 L100 82Z" fill="currentColor" fillOpacity="0.35"/>
    <path d="M90 27 L100 82 L110 27 L104 16 L100 20 L96 16 Z" fill="currentColor" fillOpacity="0.55"/>
  </svg>
);

function Stepper({ value, onChange }) {
  const btn = {
    width: 38, height: 38, border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "transparent", color: "#64748B", transition: "all 0.15s",
  };
  const hover = (e, on) => {
    e.currentTarget.style.background = on ? "#F1F5F9" : "transparent";
    e.currentTarget.style.color      = on ? "#0F172A" : "#64748B";
  };
  return (
    <div style={{ display: "inline-flex", alignItems: "center",
                  border: "1.5px solid #E2E8F0", borderRadius: 12,
                  overflow: "hidden", background: "white" }}>
      <button style={btn}
        onClick={() => onChange(Math.max(1, value - 1))}
        onMouseOver={e => hover(e, true)} onMouseOut={e => hover(e, false)}>
        <Minus size={14} />
      </button>
      <div style={{ width: 1, height: 22, background: "#E2E8F0" }} />
      <input type="number" value={value}
        onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= 99) onChange(v); }}
        style={{ width: 52, textAlign: "center", border: "none", fontSize: 20, fontWeight: 900,
                 color: "#0F172A", outline: "none", padding: "6px 0",
                 fontFamily: "inherit", background: "transparent" }}
      />
      <div style={{ width: 1, height: 22, background: "#E2E8F0" }} />
      <button style={btn}
        onClick={() => onChange(Math.min(99, value + 1))}
        onMouseOver={e => hover(e, true)} onMouseOut={e => hover(e, false)}>
        <Plus size={14} />
      </button>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0F172A", border: "1px solid #1E293B", borderRadius: 14, direction: "rtl",
      padding: "12px 18px", fontSize: 13, boxShadow: "0 24px 48px rgba(0,0,0,0.45)"
    }}>
      <p style={{ color: "#64748B", fontWeight: 700, marginBottom: 10, fontSize: 11,
                  letterSpacing: "0.08em" }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{
          color: p.name === "income" ? "#10B981" : "#F43F5E",
          fontWeight: 800, margin: "4px 0", fontSize: 14
        }}>
          {p.name === "income" ? "↑ " : "↓ "}
          {p.name === "income" ? "הכנסות" : "הוצאות"}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

function TxRow({ tx, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const fl = freqLabel(tx.frequency, tx.multiplier);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "#FAFBFD" : "transparent", transition: "background 0.1s" }}
    >
      <td style={{ padding: "15px 20px", fontSize: 13, color: "#64748B",
                   whiteSpace: "nowrap", borderBottom: "1px solid #F8FAFC", textAlign: "right" }}>
        {parseDate(tx.date).toLocaleDateString("he-IL", { month: "short", day: "numeric", year: "numeric" })}
      </td>
      <td style={{ padding: "15px 20px", borderBottom: "1px solid #F8FAFC", textAlign: "right" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{tx.description}</span>
        {fl && (
          <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginTop: 2, fontWeight: 600 }}>
            🔁 {fl}
          </span>
        )}
      </td>
      <td style={{ padding: "15px 20px", borderBottom: "1px solid #F8FAFC", textAlign: "right" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", padding: "4px 10px",
          borderRadius: 8, background: "#F1F5F9", color: "#475569", fontSize: 12, fontWeight: 600
        }}>
          {tx.category}
        </span>
      </td>
      <td style={{ padding: "15px 20px", borderBottom: "1px solid #F8FAFC", textAlign: "right" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: tx.type === "income" ? "#ECFDF5" : "#FFF1F2",
          color: tx.type === "income" ? "#059669" : "#E11D48"
        }}>
          {tx.type === "income" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {tx.type === "income" ? "הכנסה" : "הוצאה"}
        </span>
      </td>
      <td style={{ padding: "15px 20px", textAlign: "left", borderBottom: "1px solid #F8FAFC" }}>
        <span style={{
          fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em",
          color: tx.type === "income" ? "#059669" : "#E11D48",
          direction: "ltr", display: "inline-block"
        }}>
          {tx.type === "income" ? "+" : "−"}{fmt(tx.amount)}
        </span>
      </td>
      <td style={{ padding: "15px 12px", textAlign: "left", borderBottom: "1px solid #F8FAFC" }}>
        <button
          onClick={() => onDelete(tx.id)}
          title="מחק עסקה"
          style={{
            opacity: hovered ? 1 : 0, transition: "opacity 0.15s, background 0.15s",
            width: 32, height: 32, borderRadius: 8, border: "none",
            background: "transparent", cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#94A3B8"
          }}
          onMouseOver={e => { e.currentTarget.style.background = "#FFF1F2"; e.currentTarget.style.color = "#F43F5E"; }}
          onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

/* ─── לוח הבקרה הראשי ─────────────────────────────────────────── */

const EMPTY_FORM = {
  description: "", amount: "", type: "income",
  category: "הכנסות לקוחות",
  date: new Date().toISOString().split("T")[0],
  frequency: "once", multiplier: 1,
  endPreset: "noEnd", customEnd: "",
};

export default function VolaremosDashboard() {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [filter, setFilter]             = useState("all");
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [errors, setErrors]             = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const clearErr = (k) => setErrors(r => ({ ...r, [k]: null }));

  const isRec = form.frequency !== "once";
  const fd    = FREQUENCIES.find(f => f.key === form.frequency);

  const endDate = useMemo(
    () => isRec ? getEndDate(form.endPreset, form.date, form.customEnd) : null,
    [isRec, form.endPreset, form.date, form.customEnd]
  );
  const occ = useMemo(
    () => countOcc(form.frequency, form.multiplier, form.date, endDate),
    [form.frequency, form.multiplier, form.date, endDate]
  );

  const { totalIncome, totalExpenses, netBalance } = useMemo(() => {
    const inc = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { totalIncome: inc, totalExpenses: exp, netBalance: inc - exp };
  }, [transactions]);

  const margin = totalIncome > 0
    ? Math.max(0, Math.min(100, Math.round((1 - totalExpenses / totalIncome) * 100)))
    : 0;

  const chartData = useMemo(() => {
    const months = {};
    transactions.forEach(t => {
      const m = MONTH_NAMES[parseDate(t.date).getMonth()];
      if (!months[m]) months[m] = { month: m, income: 0, expenses: 0 };
      if (t.type === "income") months[m].income  += t.amount;
      else                     months[m].expenses += t.amount;
    });
    return Object.values(months).sort(
      (a, b) => MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month)
    );
  }, [transactions]);

  const filteredTx = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => parseDate(b.date) - parseDate(a.date));
    return filter === "all" ? sorted : sorted.filter(t => t.type === filter);
  }, [transactions, filter]);

  const handleAdd = () => {
    const e = {};
    if (!form.description.trim()) e.description = "נא להזין תיאור";
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = "נא להזין סכום תקין";
    if (isRec && form.endPreset === "custom" && !form.customEnd) e.customEnd = "נא לבחור תאריך סיום";
    if (isRec && form.endPreset === "custom" && form.customEnd && form.customEnd <= form.date)
      e.customEnd = "תאריך הסיום חייב להיות אחרי תאריך ההתחלה";
    setErrors(e);
    if (Object.keys(e).length) return;

    setTransactions(prev => [...prev, {
      ...form,
      id: Date.now(),
      amount: parseFloat(form.amount),
    }]);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(false);
  };

  const handleDelete = (id) => setTransactions(prev => prev.filter(t => t.id !== id));

  const today = new Date().toLocaleDateString("he-IL", {
    month: "long", day: "numeric", year: "numeric"
  });

  const accent   = form.type === "income" ? "#10B981" : "#F43F5E";
  const accentBg = form.type === "income" ? "#ECFDF5" : "#FFF1F2";

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#F1F5F9",
                  fontFamily: "'Heebo', 'Assistant', 'Inter', system-ui, sans-serif" }}>

      {/* ── כותרת ── */}
      <header style={{ background: "white", borderBottom: "1px solid #E2E8F0",
                       position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px",
                      display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="./volaremos-logo.png"
              alt="Volaremos"
              style={{ height: 38, width: "auto", objectFit: "contain", flexShrink: 0 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94A3B8", fontSize: 13 }}>
              <Calendar size={14} />
              <span>{today}</span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 8,
                       background: "#1B2B4B", color: "white", padding: "9px 18px",
                       borderRadius: 12, border: "none", fontSize: 13, fontWeight: 700,
                       cursor: "pointer", letterSpacing: "0.02em", transition: "background 0.2s" }}
              onMouseOver={e => e.currentTarget.style.background = "#243d6d"}
              onMouseOut={e => e.currentTarget.style.background = "#1B2B4B"}
            >
              <Plus size={16} />
              הוסף עסקה
            </button>
          </div>
        </div>
      </header>

      {/* ── תוכן ראשי ── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px",
                     display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── כרטיסי KPI ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>

          {/* סה"כ הכנסות */}
          <div style={{ background: "white", borderRadius: 20, padding: 26,
                        border: "1px solid #F1F5F9", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: "#94A3B8", fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.08em", margin: 0, textAlign: "right" }}>
                  סה״כ הכנסות
                </p>
                <p style={{ color: "#0F172A", fontSize: 34, fontWeight: 900,
                            margin: "10px 0 0", letterSpacing: "-0.02em", direction: "ltr" }}>
                  {fmt(totalIncome)}
                </p>
              </div>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: "#ECFDF5",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ArrowUpRight size={22} color="#10B981" />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>הכנסות מצטברות</span>
              <TrendingUp size={14} color="#10B981" />
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 88,
                          height: 4, background: "#10B981", borderRadius: "0 4px 0 0" }} />
          </div>

          {/* סה"כ הוצאות */}
          <div style={{ background: "white", borderRadius: 20, padding: 26,
                        border: "1px solid #F1F5F9", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: "#94A3B8", fontSize: 10, fontWeight: 700,
                            letterSpacing: "0.08em", margin: 0, textAlign: "right" }}>
                  סה״כ הוצאות
                </p>
                <p style={{ color: "#0F172A", fontSize: 34, fontWeight: 900,
                            margin: "10px 0 0", letterSpacing: "-0.02em", direction: "ltr" }}>
                  {fmt(totalExpenses)}
                </p>
              </div>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: "#FFF1F2",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ArrowDownRight size={22} color="#F43F5E" />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 12, color: "#E11D48", fontWeight: 600 }}>הוצאות מצטברות</span>
              <TrendingDown size={14} color="#F43F5E" />
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 88,
                          height: 4, background: "#F43F5E", borderRadius: "0 4px 0 0" }} />
          </div>

          {/* יתרה נטו */}
          <div style={{ background: netBalance >= 0 ? "#1B2B4B" : "#9F1239",
                        borderRadius: 20, padding: 26, border: "none",
                        position: "relative", overflow: "hidden" }}>
            <WingsWatermark />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "#64748B", fontSize: 10, fontWeight: 700,
                              letterSpacing: "0.08em", margin: 0, textAlign: "right" }}>
                    יתרה נטו
                  </p>
                  <p style={{ fontSize: 34, fontWeight: 900, margin: "10px 0 0",
                              letterSpacing: "-0.02em", direction: "ltr",
                              color: netBalance >= 0 ? "#10B981" : "#FDA4AF" }}>
                    {netBalance >= 0 ? "+" : ""}{fmt(netBalance)}
                  </p>
                </div>
                <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                              background: "rgba(255,255,255,0.09)",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {netBalance >= 0
                    ? <TrendingUp  size={22} color="#10B981"  />
                    : <TrendingDown size={22} color="#FDA4AF" />}
                </div>
              </div>
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 800,
                                 color: netBalance >= 0 ? "#10B981" : "#FDA4AF" }}>
                    {margin}%
                  </span>
                  <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>שולי רווח</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99 }}>
                  <div style={{
                    height: "100%", borderRadius: 99, transition: "width 0.6s ease",
                    background: netBalance >= 0 ? "#10B981" : "#FDA4AF",
                    width: `${margin}%`, marginRight: "auto"
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── גרף תזרים ── */}
        <div style={{ background: "white", borderRadius: 20, padding: 28,
                      border: "1px solid #F1F5F9" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                        marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 20 }}>
              {[["#10B981","הכנסות"],["#F43F5E","הוצאות"]].map(([clr, lbl]) => (
                <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 7,
                                         fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%",
                                 background: clr, display: "inline-block", flexShrink: 0 }} />
                  {lbl}
                </span>
              ))}
            </div>
            <div style={{ textAlign: "right" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
                סקירת תזרים מזומנים
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
                הכנסות מול הוצאות לפי חודש
              </p>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={5} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month" axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: "#94A3B8", fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: "#CBD5E1" }}
                  tickFormatter={v => `₪${(v / 1000).toFixed(0)}K`}
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC", radius: 8 }} />
                <Bar dataKey="income"   fill="#10B981" radius={[7, 7, 0, 0]} />
                <Bar dataKey="expenses" fill="#F43F5E" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── ספר עסקאות ── */}
        <div style={{ background: "white", borderRadius: 20,
                      border: "1px solid #F1F5F9", overflow: "hidden" }}>

          <div style={{ padding: "22px 28px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 13, padding: 4, gap: 3 }}>
                {[["all","הכל"],["income","הכנסות"],["expense","הוצאות"]].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    style={{
                      padding: "7px 16px", borderRadius: 10, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 700, transition: "all 0.15s",
                      background: filter === key ? "white" : "transparent",
                      color: filter === key ? "#0F172A" : "#94A3B8",
                      boxShadow: filter === key ? "0 1px 5px rgba(0,0,0,0.08)" : "none"
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
                  ספר עסקאות
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
                  {filteredTx.length} {filteredTx.length === 1 ? "עסקה" : "עסקאות"}
                </p>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["תאריך","תיאור","קטגוריה","סוג","סכום",""].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i === 4 ? "left" : "right",
                      padding: "11px 20px", fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#CBD5E1", borderBottom: "1px solid #F1F5F9", whiteSpace: "nowrap"
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "64px 20px", textAlign: "center",
                                             color: "#CBD5E1", fontSize: 14 }}>
                      אין עסקאות עדיין — הוסף את הראשונה למעלה.
                    </td>
                  </tr>
                ) : filteredTx.map(tx => (
                  <TxRow key={tx.id} tx={tx} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── מודל הוספת עסקה ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50,
                      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div
            onClick={() => setShowModal(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.6)",
                     backdropFilter: "blur(5px)" }}
          />
          <div style={{
            position: "relative", background: "white", zIndex: 10,
            width: "100%", maxWidth: 520,
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -24px 64px rgba(0,0,0,0.25)",
            maxHeight: "92vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 4 }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: "#E2E8F0" }} />
            </div>

            <div style={{ padding: "8px 24px 18px", borderBottom: "1px solid #F1F5F9",
                          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => { setShowModal(false); setErrors({}); }}
                style={{ width: 36, height: 36, borderRadius: 10, border: "none",
                         background: "#F1F5F9", cursor: "pointer", display: "flex",
                         alignItems: "center", justifyContent: "center", color: "#64748B" }}
              >
                <X size={18} />
              </button>
              <div style={{ textAlign: "right" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0F172A" }}>
                  הוסף עסקה
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
                  רשום הכנסה או הוצאה חדשה
                </p>
              </div>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* בחירת סוג */}
              <div>
                <label style={labelStyle}>סוג עסקה</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
                              background: "#F1F5F9", borderRadius: 14, padding: 5 }}>
                  {[["income","↑ הכנסה"],["expense","↓ הוצאה"]].map(([t, lbl]) => (
                    <button
                      key={t}
                      onClick={() => set("type", t)}
                      style={{
                        padding: 12, borderRadius: 10, border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: 800, transition: "all 0.15s",
                        background: form.type === t
                          ? (t === "income" ? "#10B981" : "#F43F5E")
                          : "transparent",
                        color: form.type === t ? "white" : "#94A3B8",
                        boxShadow: form.type === t ? "0 2px 10px rgba(0,0,0,0.15)" : "none"
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* תיאור */}
              <div>
                <label style={labelStyle}>תיאור</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => { set("description", e.target.value); clearErr("description"); }}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  placeholder="לדוגמה: חשבונית לקוח #0042"
                  style={{ ...inputStyle, borderColor: errors.description ? "#F43F5E" : "#E2E8F0" }}
                  onFocus={e => e.target.style.borderColor = "#1B2B4B"}
                  onBlur={e => e.target.style.borderColor = errors.description ? "#F43F5E" : "#E2E8F0"}
                />
                {errors.description && (
                  <p style={{ color:"#F43F5E", fontSize:11, margin:"5px 0 0", fontWeight:700,
                               display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                    {errors.description} <Info size={11} />
                  </p>
                )}
              </div>

              {/* סכום */}
              <div>
                <label style={labelStyle}>סכום (₪)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%",
                                 transform: "translateY(-50%)", color: "#94A3B8", fontWeight: 700 }}>
                    ₪
                  </span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => { set("amount", e.target.value); clearErr("amount"); }}
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    placeholder="0.00"
                    min="0"
                    style={{ ...inputStyle, paddingLeft: 32, borderColor: errors.amount ? "#F43F5E" : "#E2E8F0" }}
                    onFocus={e => e.target.style.borderColor = "#1B2B4B"}
                    onBlur={e => e.target.style.borderColor = errors.amount ? "#F43F5E" : "#E2E8F0"}
                  />
                </div>
                {errors.amount && (
                  <p style={{ color:"#F43F5E", fontSize:11, margin:"5px 0 0", fontWeight:700,
                               display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                    {errors.amount} <Info size={11} />
                  </p>
                )}
              </div>

              {/* קטגוריה */}
              <div>
                <label style={labelStyle}>קטגוריה</label>
                <div style={{ position: "relative" }}>
                  <select
                    value={form.category}
                    onChange={e => set("category", e.target.value)}
                    style={{ ...inputStyle, appearance: "none", paddingLeft: 40 }}
                    onFocus={e => e.target.style.borderColor = "#1B2B4B"}
                    onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={16} style={{ position: "absolute", left: 14,
                                                  top: "50%", transform: "translateY(-50%)",
                                                  color: "#94A3B8", pointerEvents: "none" }} />
                </div>
              </div>

              {/* תאריך */}
              <div>
                <label style={labelStyle}>תאריך</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => set("date", e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#1B2B4B"}
                  onBlur={e => e.target.style.borderColor = "#E2E8F0"}
                />
              </div>

              {/* תדירות */}
              <div>
                <label style={labelStyle}>תדירות</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {FREQUENCIES.map(f => {
                    const sel = form.frequency === f.key;
                    return (
                      <button key={f.key}
                        onClick={() => {
                          set("frequency", f.key);
                          if (f.key === "once") { set("endPreset","noEnd"); set("customEnd",""); }
                        }}
                        style={{
                          padding: "9px 16px", borderRadius: 11, border: "none",
                          cursor: "pointer", transition: "all 0.2s",
                          background: sel ? "#1B2B4B" : "#F8FAFC",
                          color: sel ? "white" : "#475569",
                          fontSize: 13, fontWeight: 700,
                          boxShadow: sel ? "0 4px 14px rgba(27,43,75,0.25)" : "none",
                          transform: sel ? "translateY(-1px)" : "none",
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* מרווח חזרה — מוצג רק אם חוזר */}
              <div style={reveal(isRec)}>
                <label style={labelStyle}>חזרה כל</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Stepper value={form.multiplier} onChange={v => set("multiplier", v)} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#1B2B4B" }}>
                    {form.multiplier === 1 ? fd?.unit : fd?.units}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 6].map(n => (
                      <button key={n} onClick={() => set("multiplier", n)} style={{
                        width: 34, height: 34, borderRadius: 9, border: "none",
                        cursor: "pointer", fontSize: 13, fontWeight: 800, transition: "all 0.15s",
                        background: form.multiplier === n ? accent : "#F1F5F9",
                        color: form.multiplier === n ? "white" : "#64748B",
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* תאריך סיום — מוצג רק אם חוזר */}
              <div style={reveal(isRec)}>
                <label style={labelStyle}>תאריך סיום</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {PRESETS.map(p => {
                    const active = form.endPreset === p.key;
                    return (
                      <button key={p.key}
                        onClick={() => {
                          set("endPreset", p.key);
                          if (p.key !== "custom") set("customEnd", "");
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 13px", borderRadius: 10, cursor: "pointer",
                          fontSize: 12, fontWeight: 700, transition: "all 0.2s",
                          border: active ? `2px solid ${accent}` : "2px solid #E2E8F0",
                          background: active ? accentBg : "white",
                          color: active ? accent : "#64748B",
                        }}
                      >
                        <span style={{ fontWeight: 900 }}>{p.badge}</span>
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {form.endPreset !== "noEnd" && form.endPreset !== "custom" && endDate && (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:10,
                                padding:"8px 12px", background:accentBg, borderRadius:10,
                                border:`1px solid ${accent}33` }}>
                    <Calendar size={12} color={accent} />
                    <span style={{ fontSize:12, fontWeight:700, color:accent }}>
                      תאריך סיום: {new Date(endDate + "T00:00:00").toLocaleDateString("he-IL")}
                    </span>
                  </div>
                )}

                <div style={reveal(form.endPreset === "custom")}>
                  <input type="date" value={form.customEnd}
                    min={form.date}
                    onChange={e => { set("customEnd", e.target.value); clearErr("customEnd"); }}
                    style={{ ...inputStyle, marginBottom: 8, borderColor: errors.customEnd ? "#F43F5E" : "#E2E8F0" }}
                    onFocus={e => e.target.style.borderColor = "#1B2B4B"}
                    onBlur={e => e.target.style.borderColor = errors.customEnd ? "#F43F5E" : "#E2E8F0"}
                  />
                  {errors.customEnd && (
                    <p style={{ color:"#F43F5E", fontSize:11, margin:"5px 0 0", fontWeight:700,
                                 display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                      {errors.customEnd} <Info size={11} />
                    </p>
                  )}
                </div>

                {occ !== null && (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                                padding:"7px 14px", background:"#1B2B4B", borderRadius:9 }}>
                    <span style={{ fontSize:12, fontWeight:800, color:"white" }}>
                      🔁 {occ} הופעות סה״כ
                    </span>
                  </div>
                )}
              </div>

              {/* כפתורי פעולה */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setForm(EMPTY_FORM); setErrors({}); }}
                  style={{ padding:"11px 16px", borderRadius:12, border:"1.5px solid #E2E8F0",
                           background:"white", color:"#64748B", fontSize:13, fontWeight:700,
                           cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                           transition:"all 0.15s", flexShrink:0 }}
                  onMouseOver={e => { e.currentTarget.style.borderColor="#94A3B8"; e.currentTarget.style.color="#0F172A"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.color="#64748B"; }}
                >
                  <RefreshCcw size={14} />
                  איפוס
                </button>

                <button
                  onClick={handleAdd}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 14, border: "none",
                    cursor: "pointer",
                    fontSize: 14, fontWeight: 800, letterSpacing: "0.04em", transition: "all 0.2s",
                    background: form.type === "income" ? "#10B981" : "#1B2B4B",
                    color: "white",
                  }}
                >
                  שמור עסקה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
