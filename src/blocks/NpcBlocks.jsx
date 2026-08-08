import { useState, useEffect } from "react";
import { ROUTINE_PERIODS, VERACITY_OPTIONS } from "../data/entryTypes.js";
import { threatLabelFor } from "../utils/stats.js";
import { styles } from "../styles.js";
import { StatusPicker } from "../components/ConfigListPicker.jsx";

/* ---------- BLOCK: RUTINA HORARIA (NPC) ---------- */
export function RoutineBlock({ block, updateBlock }) {
  const slots = block.slots && block.slots.length ? block.slots : ROUTINE_PERIODS.map((p) => ({ period: p.key, location: "", activity: "" }));
  function updateSlot(period, patch) {
    updateBlock(block.id, {
      slots: ROUTINE_PERIODS.map((p) => {
        const cur = slots.find((s) => s.period === p.key) || { period: p.key, location: "", activity: "" };
        return p.key === period ? { ...cur, ...patch } : cur;
      }),
    });
  }
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Rutina horaria</div>
      {ROUTINE_PERIODS.map((p) => {
        const s = slots.find((x) => x.period === p.key) || {};
        return (
          <div key={p.key} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 3, fontWeight: 600 }}>{p.label}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input value={s.location || ""} onChange={(e) => updateSlot(p.key, { location: e.target.value })}
                placeholder="Dónde está" style={{ ...styles.statsInput, flex: 1 }} />
              <input value={s.activity || ""} onChange={(e) => updateSlot(p.key, { activity: e.target.value })}
                placeholder="Qué hace" style={{ ...styles.statsInput, flex: 1 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- BLOCK: RUMOR / SECRETO ---------- */
export function RumorBlock({ block, updateBlock }) {
  const [draft, setDraft] = useState(block.text || "");
  useEffect(() => { setDraft(block.text || ""); }, [block.id]);
  const veracity = block.veracity || "parcial";
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {VERACITY_OPTIONS.map((o) => (
          <button key={o.key} type="button" onClick={() => updateBlock(block.id, { veracity: o.key })}
            style={{
              ...styles.pillBtn,
              ...(veracity === o.key ? { background: o.color, borderColor: o.color, color: "var(--bg)" } : { color: o.color }),
            }}>
            {o.label}
          </button>
        ))}
      </div>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => updateBlock(block.id, { text: draft })}
        placeholder="¿Qué dice el rumor o secreto?" style={{ ...styles.textarea, minHeight: 80 }} />
      <label style={{ ...styles.statsField, marginTop: 8 }}>
        <span style={styles.statsLabel}>A quién se le puede revelar</span>
        <input value={block.revealTo || ""} onChange={(e) => updateBlock(block.id, { revealTo: e.target.value })}
          placeholder="Ej. solo si superan Persuasión CD 15" style={styles.statsInput} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer", marginTop: 8 }}>
        <input type="checkbox" checked={!!block.resolved} onChange={(e) => updateBlock(block.id, { resolved: e.target.checked })} />
        Ya resuelto/revelado (no aparece en Cabos sueltos)
      </label>
    </div>
  );
}

/* ---------- BLOCK: NIVEL DE AMENAZA (Enemigo/Jefe) ---------- */
export function ThreatLevelBlock({ block, updateBlock }) {
  const level = block.level ?? 5;
  const t = threatLabelFor(level);
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Nivel de amenaza</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <input type="range" min={1} max={10} value={level}
          onChange={(e) => updateBlock(block.id, { level: parseInt(e.target.value, 10) })} style={{ flex: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: t.color, minWidth: 20, textAlign: "right" }}>{level}</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "var(--panel2)", overflow: "hidden", marginBottom: 6 }}>
        <div style={{ height: "100%", width: "100%", transform: `scaleX(${level / 10})`, transformOrigin: "left", background: t.color, transition: "transform .15s ease" }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.color, marginBottom: 8 }}>{t.label}</div>
      <input value={block.note || ""} onChange={(e) => updateBlock(block.id, { note: e.target.value })}
        placeholder="Nota (ej. requiere grupo de 4, cuidado con veneno…)" style={styles.statsInput} />
    </div>
  );
}

/* ---------- BLOCK: INFO DE ESTADO ALTERADO ---------- */
export function StatusEffectInfoBlock({ block, updateBlock }) {
  const [draft, setDraft] = useState(block.description || "");
  useEffect(() => { setDraft(block.description || ""); }, [block.id]);
  const kind = block.kind || "debuff";
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button type="button" onClick={() => updateBlock(block.id, { kind: "buff" })}
          style={{ ...styles.pillBtn, ...(kind === "buff" ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--bg)" } : { color: "var(--accent)" }) }}>
          Buff
        </button>
        <button type="button" onClick={() => updateBlock(block.id, { kind: "debuff" })}
          style={{ ...styles.pillBtn, ...(kind === "debuff" ? { background: "#b04848", borderColor: "#b04848", color: "var(--bg)" } : { color: "#b04848" }) }}>
          Debuff
        </button>
      </div>
      <label style={styles.statsField}>
        <span style={styles.statsLabel}>Estado vinculado (mismo tag de Habilidades/Resistencias)</span>
        <StatusPicker value={block.linkedStatusKey || null} onChange={(v) => updateBlock(block.id, { linkedStatusKey: v })} />
      </label>
      <label style={{ ...styles.statsField, marginTop: 8 }}>
        <span style={styles.statsLabel}>Duración</span>
        <input value={block.duration || ""} onChange={(e) => updateBlock(block.id, { duration: e.target.value })}
          placeholder="Ej. 3 turnos, hasta fin de combate…" style={styles.statsInput} />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer", margin: "8px 0" }}>
        <input type="checkbox" checked={!!block.stackable} onChange={(e) => updateBlock(block.id, { stackable: e.target.checked })} />
        Se puede acumular (stack)
      </label>
      <label style={styles.statsField}>
        <span style={styles.statsLabel}>Cómo se cura / termina</span>
        <input value={block.cureNote || ""} onChange={(e) => updateBlock(block.id, { cureNote: e.target.value })}
          placeholder="Ej. Antídoto, al terminar el combate…" style={styles.statsInput} />
      </label>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => updateBlock(block.id, { description: draft })}
        placeholder="Descripción / efecto completo (a desarrollar)..." style={{ ...styles.textarea, minHeight: 100, marginTop: 8 }} />
    </div>
  );
}
