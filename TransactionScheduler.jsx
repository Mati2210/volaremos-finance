import { useState, useMemo } from "react";
import {
  Minus, Plus, Calendar, Check, RefreshCcw,
  Clock, ChevronDown, Info
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

const FREQUENCIES = [
  { key: "once",    label: "One-time", sub: "חד-פעמי", unit: null,   units: null    },
  { key: "daily",   label: "Daily",    sub: "יומי",     unit: "Day",  units: "Days"  },
  { key: "weekly",  label: "Weekly",   sub: "שבועי",    unit: "Week", units: "Weeks" },
  { key: "monthly", label: "Monthly",  sub: "חודשי",    unit: "Month",units: "Months"},
  { key: "yearly",  label: "Yearly",   sub: "שנתי",     unit: "Year", units: "Years" },
];

const PRESETS = [
  { key: "3months",    badge: "3M", label: "3 Months"       },
  { key: "6months",    badge: "6M", label: "6 Months"       },
  { key: "1year",      badge: "1Y", label: "1 Year"         },
  { key: "fiscalYear", badge: "FY", label: "Fiscal Year End"},
  { key: "noEnd",      badge: "∞",  label: "No End Date"    },
  { key: "custom",     badge: "↗",  label: "Custom Date"    },
];

const CATEGORIES = [
  "Client Revenue","Consulting","Marketing",
  "Operations","Software","Travel","Utilities","Other",
];

const INIT = {
  type: "expense",
  description: "",
  amount: "",
  category: "Operations",
  startDate: TODAY,
  frequency: "once",
  multiplier: 1,
  endPreset: "noEnd",
  customEnd: "",
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

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
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
};
const fmtAmt = (n) =>
  isNaN(n) || !n
    ? ""
    : new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: 0,
      }).format(n);

const getEndDate = (preset, start, custom) => {
  if (preset === "3months")    return addMonths(start, 3);
  if (preset === "6months")    return addMonths(start, 6);
  if (preset === "1year")      return addYears(start, 1);
  if (preset === "fiscalYear") return `${new Date(start + "T00:00:00").getFullYear()}-12-31`;
  if (preset === "custom")     return custom || null;
  return null; // noEnd
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

const makeSummary = (form, endDate) => {
  const { type, amount, description, frequency, multiplier, startDate } = form;
  const amt    = parseFloat(amount);
  const amtStr = amt > 0 ? ` of ${fmtAmt(amt)}` : "";
  const descStr= description.trim() ? ` for "${description.trim()}"` : "";
  const typeL  = type === "income" ? "income" : "expense";

  if (frequency === "once") {
    return `📌  This is a one-time ${typeL}${amtStr}${descStr}, scheduled for ${fmtDate(startDate)}.`;
  }
  const f = FREQUENCIES.find(f => f.key === frequency);
  const unit = multiplier === 1
    ? f.unit.toLowerCase()
    : `${multiplier} ${f.units.toLowerCase()}`;
  const end = endDate
    ? `until ${fmtDate(endDate)}`
    : "with no end date (ongoing)";
  return `🔁  This recurring ${typeL}${amtStr}${descStr} will repeat every ${unit}, starting ${fmtDate(startDate)}, ${end}.`;
};

// ─────────────────────────────────────────────────────────────────
// STEPPER
// ─────────────────────────────────────────────────────────────────

function Stepper({ value, onChange }) {
  const btn = {
    width: 44, height: 44, border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "transparent", color: "#64748B", transition: "all 0.15s",
  };
  const hover = (e, on) => {
    e.currentTarget.style.background = on ? "#F1F5F9" : "transparent";
    e.currentTarget.style.color      = on ? "#0F172A" : "#64748B";
  };
  return (
    <div style={{ display: "inline-flex", alignItems: "center",
                  border: "1.5px solid #E2E8F0", borderRadius: 14,
                  overflow: "hidden", background: "white" }}>
      <button style={btn}
        onClick={() => onChange(Math.max(1, value - 1))}
        onMouseOver={e => hover(e, true)} onMouseOut={e => hover(e, false)}>
        <Minus size={15} />
      </button>
      <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
      <input type="number" value={value}
        onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= 99) onChange(v); }}
        style={{ width: 62, textAlign: "center", border: "none", fontSize: 24, fontWeight: 900,
                 color: "#0F172A", outline: "none", padding: "8px 0",
                 fontFamily: "inherit", background: "transparent" }}
      />
      <div style={{ width: 1, height: 24, background: "#E2E8F0" }} />
      <button style={btn}
        onClick={() => onChange(Math.min(99, value + 1))}
        onMouseOver={e => hover(e, true)} onMouseOut={e => hover(e, false)}>
        <Plus size={15} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// JSON PANEL
// ─────────────────────────────────────────────────────────────────

function JsonPane({ data }) {
  const lines = JSON.stringify(data, null, 2).split("\n");
  const hi = (l) =>
    l .replace(/"([^"]+)":/g,  `<span style="color:#34D399;font-weight:700">"$1"</span>:`)
      .replace(/: "([^"]*)"/g, `: <span style="color:#FDA4AF">"$1"</span>`)
      .replace(/: (\d+\.?\d*)/g, `: <span style="color:#60A5FA">$1</span>`)
      .replace(/: (true|false)/g, `: <span style="color:#C084FC">$1</span>`)
      .replace(/: null/g,      `: <span style="color:#475569">null</span>`);
  return (
    <pre style={{ margin: 0, overflowX: "auto", padding: "20px 22px",
                  fontFamily: "'Fira Code','Cascadia Code','Courier New',monospace",
                  fontSize: 12.5, lineHeight: 1.8, color: "#CBD5E1" }}>
      {lines.map((l, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: hi(l) }} />
      ))}
    </pre>
  );
}

// ─────────────────────────────────────────────────────────────────
// REVEAL ANIMATION
// ─────────────────────────────────────────────────────────────────

const reveal = (show) => ({
  maxHeight: show ? "800px" : "0px",
  opacity: show ? 1 : 0,
  overflow: "hidden",
  transition: "max-height 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease",
  pointerEvents: show ? "auto" : "none",
});

// ─────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────

const SLabel = ({ step, title, hint }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
    <div style={{ width: 26, height: 26, borderRadius: 8, background: "#1B2B4B", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 900, color: "white", letterSpacing: "0.05em" }}>
      {step}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em",
                    textTransform: "uppercase", color: "#334155" }}>{title}</div>
      {hint && <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 3, fontWeight: 500 }}>{hint}</div>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function TransactionScheduler() {
  const [form, setForm]       = useState(INIT);
  const [errors, setErrors]   = useState({});
  const [saved, setSaved]     = useState(false);
  const [jsonOpen, setJsonOpen] = useState(true);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const clearErr = (k) => setErrors(r => ({ ...r, [k]: null }));

  const isRec = form.frequency !== "once";
  const fd    = FREQUENCIES.find(f => f.key === form.frequency);
  const accent   = form.type === "income" ? "#10B981" : "#F43F5E";
  const accentBg = form.type === "income" ? "#ECFDF5" : "#FFF1F2";
  const accentMid= form.type === "income" ? "#D1FAE5" : "#FFE4E6";

  // ─ Computed values
  const endDate = useMemo(
    () => isRec ? getEndDate(form.endPreset, form.startDate, form.customEnd) : null,
    [isRec, form.endPreset, form.startDate, form.customEnd]
  );
  const occ = useMemo(
    () => countOcc(form.frequency, form.multiplier, form.startDate, endDate),
    [form.frequency, form.multiplier, form.startDate, endDate]
  );
  const summary = useMemo(() => makeSummary(form, endDate), [form, endDate]);

  const output = useMemo(() => ({
    type: form.type,
    description: form.description || null,
    amount: parseFloat(form.amount) || 0,
    category: form.category,
    startDate: form.startDate,
    schedule: isRec
      ? {
          frequency: form.frequency,
          multiplier: form.multiplier,
          isRecurring: true,
          endDate: endDate,
          noEndDate: !endDate,
          totalOccurrences: occ,
        }
      : { frequency: "once", isRecurring: false },
    _meta: { generatedAt: new Date().toISOString() },
  }), [form, isRec, endDate, occ]);

  // ─ Validation
  const validate = () => {
    const e = {};
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.amount || parseFloat(form.amount) <= 0)
      e.amount = "Enter a valid amount greater than 0";
    if (isRec && form.endPreset === "custom" && !form.customEnd)
      e.customEnd = "Please select an end date";
    if (isRec && form.endPreset === "custom" && form.customEnd && form.customEnd <= form.startDate)
      e.customEnd = "End date must be after the start date";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    const finalOutput = { ...output, id: `txn_${Date.now()}` };
    console.log("💾 Volaremos — Transaction Saved:", finalOutput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };

  // ─ Shared input style
  const inp = (field = "", extra = {}) => ({
    width: "100%", boxSizing: "border-box", padding: "11px 14px",
    borderRadius: 11, border: `1.5px solid ${errors[field] ? "#F43F5E" : "#E2E8F0"}`,
    fontSize: 14, fontWeight: 600, color: "#0F172A", outline: "none",
    background: "white", fontFamily: "inherit", transition: "border-color 0.2s",
    ...extra,
  });
  const onFocus = (e) => (e.target.style.borderColor = "#1B2B4B");
  const onBlurFld = (field) => (e) =>
    (e.target.style.borderColor = errors[field] ? "#F43F5E" : "#E2E8F0");

  // ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#EEF2F7",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "32px 16px 80px",
                  fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ══ HEADER CARD ══ */}
        <div style={{ background: "#1B2B4B", borderRadius: 22, padding: "26px 28px",
                      position: "relative", overflow: "hidden" }}>
          {/* Wings watermark */}
          <svg viewBox="0 0 300 130" style={{ position:"absolute",right:-10,top:0,
               width:"65%",height:"100%",opacity:0.065,pointerEvents:"none" }}>
            <path d="M150 118L80 30L5 18L38 40L73 50L96 72L150 118Z" fill="white"/>
            <path d="M150 118L220 30L295 18L262 40L227 50L204 72L150 118Z" fill="white"/>
            <path d="M150 118L165 40L180 30L195 18L175 28L165 52Z" fill="white" fillOpacity="0.5"/>
            <path d="M150 118L135 40L120 30L105 18L125 28L135 52Z" fill="white" fillOpacity="0.5"/>
            <path d="M135 38L150 118L165 38L158 18L150 26L142 18Z" fill="white" fillOpacity="0.7"/>
          </svg>

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Title row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13,
                            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
                            display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={21} color="white" />
              </div>
              <div>
                <div style={{ color: "white", fontWeight: 900, fontSize: 17, letterSpacing: "0.01em" }}>
                  Transaction Scheduler
                </div>
                <div style={{ color: "#475569", fontSize: 10.5, fontWeight: 700,
                              letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>
                  Volaremos · Finance
                </div>
              </div>
            </div>

            {/* Type Toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                          gap: 6, background: "rgba(0,0,0,0.28)", borderRadius: 15, padding: 5 }}>
              {[["income","↑  Income"],["expense","↓  Expense"]].map(([t, lbl]) => (
                <button key={t} onClick={() => set("type", t)} style={{
                  padding: "12px", borderRadius: 11, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 800, letterSpacing: "0.02em", transition: "all 0.22s",
                  background: form.type === t ? (t === "income" ? "#10B981" : "#F43F5E") : "transparent",
                  color: form.type === t ? "white" : "#475569",
                  boxShadow: form.type === t ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
                }}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ FORM BODY ══ */}
        <div style={{ background: "white", borderRadius: 22, padding: "28px 28px 24px",
                      border: "1px solid #E8EDF5",
                      boxShadow: "0 2px 12px rgba(27,43,75,0.06)",
                      display: "flex", flexDirection: "column", gap: 0 }}>

          {/* ── SECTION A: Basic Info ── */}
          <div style={{ paddingBottom: 26 }}>
            <SLabel step="A" title="Basic Information" />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Description */}
              <div>
                <input value={form.description}
                  onChange={e => { set("description", e.target.value); clearErr("description"); }}
                  placeholder="e.g. Team Payroll, Client Invoice, Office Rent"
                  style={inp("description")}
                  onFocus={onFocus} onBlur={onBlurFld("description")}
                />
                {errors.description && (
                  <p style={{ color:"#F43F5E", fontSize:11, margin:"5px 0 0", fontWeight:700,
                               display:"flex", alignItems:"center", gap:4 }}>
                    <Info size={11} /> {errors.description}
                  </p>
                )}
              </div>

              {/* Amount + Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ position: "relative" }}>
                    <span style={{ position:"absolute", left:13, top:"50%",
                                   transform:"translateY(-50%)", color:"#94A3B8",
                                   fontWeight:800, fontSize:15 }}>$</span>
                    <input type="number" placeholder="0" value={form.amount} min="0"
                      onChange={e => { set("amount", e.target.value); clearErr("amount"); }}
                      style={{ ...inp("amount"), paddingLeft: 28 }}
                      onFocus={onFocus} onBlur={onBlurFld("amount")}
                    />
                  </div>
                  {errors.amount && (
                    <p style={{ color:"#F43F5E", fontSize:11, margin:"5px 0 0", fontWeight:700,
                                 display:"flex", alignItems:"center", gap:4 }}>
                      <Info size={11} /> {errors.amount}
                    </p>
                  )}
                </div>

                <div style={{ position: "relative" }}>
                  <select value={form.category} onChange={e => set("category", e.target.value)}
                    style={{ ...inp(), appearance:"none", paddingRight:30, cursor:"pointer" }}
                    onFocus={onFocus} onBlur={onBlurFld("")}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} style={{ position:"absolute", right:11, top:"50%",
                                                  transform:"translateY(-50%)", color:"#94A3B8",
                                                  pointerEvents:"none" }} />
                </div>
              </div>

              {/* Start Date */}
              <div style={{ position: "relative" }}>
                <Calendar size={13} style={{ position:"absolute", left:13, top:"50%",
                                             transform:"translateY(-50%)", color:"#94A3B8",
                                             pointerEvents:"none" }} />
                <input type="date" value={form.startDate}
                  onChange={e => set("startDate", e.target.value)}
                  style={{ ...inp(), paddingLeft:34 }}
                  onFocus={onFocus} onBlur={onBlurFld("")}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:"#F1F5F9", margin:"0 -28px 26px" }} />

          {/* ── SECTION B: Frequency ── */}
          <div style={{ paddingBottom: 26 }}>
            <SLabel step="B" title="Frequency"
              hint="How often does this transaction occur?" />
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
                      padding: "10px 18px", borderRadius: 12, border: "none",
                      cursor: "pointer", textAlign: "center", transition: "all 0.22s",
                      background: sel ? "#1B2B4B" : "#F8FAFC",
                      boxShadow: sel ? "0 4px 16px rgba(27,43,75,0.28)" : "none",
                      transform: sel ? "translateY(-1px)" : "none",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800,
                                  color: sel ? "white" : "#475569" }}>{f.label}</div>
                    <div style={{ fontSize: 9.5, fontWeight: 600, marginTop: 2,
                                  color: sel ? "rgba(255,255,255,0.45)" : "#CBD5E1",
                                  letterSpacing: "0.06em" }}>{f.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SECTION C: Recurrence Interval (animated) ── */}
          <div style={reveal(isRec)}>
            <div style={{ height:1, background:"#F1F5F9", margin:"0 -28px 26px" }} />
            <SLabel step="C" title="Recurrence Interval"
              hint={`Space between each occurrence (in ${fd?.units?.toLowerCase() ?? "units"})`} />

            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
              <span style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>
                Repeat every
              </span>
              <Stepper value={form.multiplier} onChange={v => set("multiplier", v)} />
              <span style={{ fontSize: 18, fontWeight: 900, color: "#1B2B4B", minWidth: 70 }}>
                {form.multiplier === 1 ? fd?.unit : fd?.units}
              </span>

              {/* Quick-pick chips */}
              <div style={{ display: "flex", gap: 6, marginLeft: 4 }}>
                {[1, 2, 3, 6].map(n => (
                  <button key={n} onClick={() => set("multiplier", n)} style={{
                    width: 36, height: 36, borderRadius: 9, border: "none",
                    cursor: "pointer", fontSize: 13, fontWeight: 800, transition: "all 0.18s",
                    background: form.multiplier === n ? accent : "#F1F5F9",
                    color: form.multiplier === n ? "white" : "#64748B",
                    boxShadow: form.multiplier === n ? `0 3px 10px ${accent}44` : "none",
                  }}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{ paddingBottom: 26 }} />
          </div>

          {/* ── SECTION D: End Date (animated) ── */}
          <div style={reveal(isRec)}>
            <div style={{ height:1, background:"#F1F5F9", margin:"0 -28px 26px" }} />
            <SLabel step="D" title="End Date"
              hint="Select a preset shortcut or pick a custom date" />

            {/* Preset chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {PRESETS.map(p => {
                const active = form.endPreset === p.key;
                return (
                  <button key={p.key}
                    onClick={() => {
                      set("endPreset", p.key);
                      if (p.key !== "custom") set("customEnd", "");
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "8px 15px", borderRadius: 11, cursor: "pointer",
                      fontSize: 12, fontWeight: 700, transition: "all 0.2s",
                      border: active ? `2px solid ${accent}` : "2px solid #E2E8F0",
                      background: active ? accentBg : "white",
                      color: active ? accent : "#64748B",
                      boxShadow: active ? `0 0 0 3px ${accent}22` : "none",
                      transform: active ? "translateY(-1px)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 900 }}>{p.badge}</span>
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Computed end-date pill */}
            {form.endPreset !== "noEnd" && form.endPreset !== "custom" && endDate && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:8,
                            padding:"9px 14px", background:accentBg, borderRadius:11,
                            border:`1px solid ${accent}33`, marginBottom:14 }}>
                <Calendar size={13} color={accent} />
                <span style={{ fontSize:13, fontWeight:700, color:accent }}>
                  Computed end date: {fmtDate(endDate)}
                </span>
              </div>
            )}

            {/* Custom date picker (nested animated) */}
            <div style={reveal(form.endPreset === "custom")}>
              <div style={{ paddingBottom: 14 }}>
                <input type="date" value={form.customEnd}
                  min={form.startDate}
                  onChange={e => { set("customEnd", e.target.value); clearErr("customEnd"); }}
                  style={inp("customEnd")}
                  onFocus={onFocus} onBlur={onBlurFld("customEnd")}
                />
                {errors.customEnd && (
                  <p style={{ color:"#F43F5E", fontSize:11, margin:"5px 0 0", fontWeight:700,
                               display:"flex", alignItems:"center", gap:4 }}>
                    <Info size={11} /> {errors.customEnd}
                  </p>
                )}
              </div>
            </div>

            {/* Occurrence count badge */}
            {occ !== null && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:8,
                            padding:"7px 15px", background:"#1B2B4B", borderRadius:9 }}>
                <span style={{ fontSize:12.5, fontWeight:800, color:"white" }}>
                  🔁&nbsp; {occ} occurrence{occ !== 1 ? "s" : ""} total
                </span>
              </div>
            )}
            <div style={{ paddingBottom: 8 }} />
          </div>

          {/* ── SUMMARY BOX ── */}
          <div style={{ height:1, background:"#F1F5F9", margin:"0 -28px 24px" }} />

          <div style={{
            background: `linear-gradient(135deg, ${accentBg} 0%, #F8FAFC 100%)`,
            border: `1.5px solid ${accent}30`, borderRadius: 16,
            padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start",
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: accent,
                          flexShrink:0, display:"flex", alignItems:"center",
                          justifyContent:"center", boxShadow:`0 4px 14px ${accent}44` }}>
              <Calendar size={19} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:"0.12em",
                            textTransform:"uppercase", color:accent, marginBottom:7 }}>
                Schedule Summary
              </div>
              <p style={{ margin:0, fontSize:13.5, fontWeight:600, color:"#1B2B4B", lineHeight:1.7 }}>
                {summary}
              </p>
              {occ !== null && (
                <p style={{ margin:"9px 0 0", fontSize:12, color:"#64748B",
                            lineHeight:1.5, fontWeight:500 }}>
                  💡 This transaction will occur{" "}
                  <strong style={{ color:"#1B2B4B", fontWeight:800 }}>
                    {occ} time{occ !== 1 ? "s" : ""}
                  </strong>{" "}
                  over the selected period.
                </p>
              )}
            </div>
          </div>

          {/* ── ACTIONS ── */}
          <div style={{ display:"flex", gap:10, marginTop:24 }}>
            <button
              onClick={() => { setForm(INIT); setErrors({}); setSaved(false); }}
              style={{ padding:"12px 20px", borderRadius:12, border:"1.5px solid #E2E8F0",
                       background:"white", color:"#64748B", fontSize:13, fontWeight:700,
                       cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                       transition:"all 0.15s", flexShrink:0 }}
              onMouseOver={e => { e.currentTarget.style.borderColor="#94A3B8"; e.currentTarget.style.color="#0F172A"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor="#E2E8F0"; e.currentTarget.style.color="#64748B"; }}
            >
              <RefreshCcw size={14} />
              Reset
            </button>

            <button onClick={handleSave} style={{
              flex:1, padding:"13px", borderRadius:12, border:"none",
              cursor:"pointer", fontSize:14, fontWeight:800, letterSpacing:"0.02em",
              background: saved ? "#10B981" : accent, color:"white",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              transition:"all 0.3s", boxShadow:`0 4px 18px ${saved ? "#10B98144" : accent + "44"}`,
            }}>
              {saved ? <><Check size={17} strokeWidth={3} /> Saved!</> : "Save Transaction"}
            </button>
          </div>
        </div>

        {/* ══ JSON PREVIEW PANEL ══ */}
        <div style={{ background:"#0C1526", borderRadius:20, overflow:"hidden",
                      border:"1px solid #1E293B",
                      boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>

          {/* Terminal bar */}
          <button onClick={() => setJsonOpen(o => !o)}
            style={{ width:"100%", padding:"13px 20px", background:"transparent",
                     border:"none", cursor:"pointer",
                     display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              {/* macOS traffic lights */}
              <div style={{ display:"flex", gap:6 }}>
                {["#FF5F57","#FEBC2E","#28C840"].map(c => (
                  <span key={c} style={{ width:11, height:11, borderRadius:"50%",
                                         background:c, display:"block" }} />
                ))}
              </div>
              <span style={{ color:"#475569", fontSize:11.5, fontWeight:700,
                             letterSpacing:"0.1em", textTransform:"uppercase" }}>
                JSON Output · Live Preview
              </span>
              <span style={{ background:"#1E293B", color:"#10B981", fontSize:10,
                             fontWeight:700, padding:"2px 9px", borderRadius:6,
                             letterSpacing:"0.06em" }}>
                LIVE
              </span>
            </div>
            <ChevronDown size={15} color="#475569"
              style={{ transform: jsonOpen ? "rotate(180deg)" : "rotate(0)",
                       transition:"transform 0.32s" }} />
          </button>

          <div style={reveal(jsonOpen)}>
            <div style={{ borderTop:"1px solid #1E293B" }}>
              <JsonPane data={output} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
