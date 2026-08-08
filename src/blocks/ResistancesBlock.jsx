import { useState } from "react";
import { X } from "lucide-react";
import { ELEMENT_RES_LEVELS, RESIST_BAR_VISUAL, STATUS_RES_LEVELS } from "../data/statFields.js";
import { CLASSIFICATION_COLOR_POOL } from "../data/theme.js";
import { styles } from "../styles.js";
import { activeElements, activeStatusEffects, setActiveElements, setActiveStatusEffects } from "../state/globals.js";

/* ---------- BLOCK: RESISTENCIAS Y DEBILIDADES ---------- */
// Una fila por concepto (elemento o estado alterado) de la lista configurable
// correspondiente, con un selector de nivel de reacción. Igual que ElementPicker,
// escribir + Enter en el campo de abajo agrega un concepto nuevo a esa lista del
// proyecto (compartida con habilidades/simbiontes), y la X de cada fila lo quita
// para siempre; "Normal" no se guarda (mantiene los datos livianos).
export function ResistanceRows({ list, setList, values, onChange, levels, placeholder }) {
  const [draft, setDraft] = useState("");
  function addConcept() {
    const name = draft.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!list.some((it) => it.key === key)) {
      const color = CLASSIFICATION_COLOR_POOL[list.length % CLASSIFICATION_COLOR_POOL.length];
      setList([...list, { key, label: name, color }]);
    }
    setDraft("");
  }
  function removeConcept(key) {
    setList(list.filter((it) => it.key !== key));
    if (values[key]) {
      const next = { ...values };
      delete next[key];
      onChange(next);
    }
  }
  function setLevel(key, level) {
    const next = { ...values };
    if (level === levels[0].key) delete next[key];
    else next[key] = level;
    onChange(next);
  }
  return (
    <div>
      {list.map((it) => (
        <div key={it.key} style={styles.resistRow}>
          <span style={{ color: it.color, display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            {it.label}
            <X size={10} style={{ opacity: 0.55, cursor: "pointer" }} onClick={() => removeConcept(it.key)} />
          </span>
          <select value={values[it.key] || levels[0].key} onChange={(e) => setLevel(it.key, e.target.value)} style={styles.resistSelect}>
            {levels.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
        </div>
      ))}
      <div style={styles.tagsRow}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addConcept(); } }}
          onBlur={() => { if (draft) addConcept(); }}
          placeholder={placeholder} style={styles.tagInput} />
      </div>
    </div>
  );
}

// Resumen en barras de las resistencias por elemento configuradas (Ficha de
// Resistencias) — cuanto más larga y roja la barra, más daño recibe de ese
// elemento; los estados alterados no entran acá porque no tienen un nivel
// "débil" graduable, solo resiste/inmune.
export function ResistanceBars({ block }) {
  const entries = Object.entries(block?.elementRes || {});
  if (entries.length === 0) return <span style={styles.bookBottomHint}>Sin elementos configurados todavía.</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {entries.map(([key, level]) => {
        const el = activeElements.find((e) => e.key === key);
        const visual = RESIST_BAR_VISUAL[level] || RESIST_BAR_VISUAL.resiste;
        const levelLabel = ELEMENT_RES_LEVELS.find((l) => l.key === level)?.label || level;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
            <span style={{ width: 110, flexShrink: 0, color: el?.color || "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el?.label || key}</span>
            <div style={{ flex: 1, height: 5, background: "var(--panel2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${visual.pct}%`, background: visual.color }} />
            </div>
            <span style={{ width: 140, textAlign: "right", fontSize: 10.5, color: "var(--muted)", flexShrink: 0 }}>{levelLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ResistancesBlock({ block, updateBlock }) {
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Elementos</div>
      <ResistanceRows list={activeElements} setList={setActiveElements}
        values={block.elementRes || {}} onChange={(v) => updateBlock(block.id, { elementRes: v })}
        levels={ELEMENT_RES_LEVELS} placeholder="+ elemento…" />
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 12 }}>Estados alterados</div>
      <ResistanceRows list={activeStatusEffects} setList={setActiveStatusEffects}
        values={block.statusRes || {}} onChange={(v) => updateBlock(block.id, { statusRes: v })}
        levels={STATUS_RES_LEVELS} placeholder="+ estado…" />
    </div>
  );
}
