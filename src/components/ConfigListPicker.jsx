import { useState, useEffect, useRef } from "react";
import { Flame, ChevronDown, X, CircleAlert } from "lucide-react";
import { CLASSIFICATION_COLOR_POOL } from "../data/theme.js";
import { styles } from "../styles.js";
import { activeElements, activeStatusEffects, setActiveElements, setActiveStatusEffects } from "../state/globals.js";

/* ---------- SELECTOR GENÉRICO DE LISTA CONFIGURABLE ---------- */
// Selector de una lista editable por el usuario ("Ninguno" + los chips de la
// lista). Escribir + Enter agrega un concepto nuevo a la lista del proyecto
// (con color tomado de CLASSIFICATION_COLOR_POOL); la X de cada chip lo quita
// para siempre (y desasigna el valor en donde estuviera seleccionado).
// Reutilizado por elementos de habilidad, roles de clase y tipos de arma/armadura.
// Con multi=true, value/onChange trabajan sobre un arreglo de keys en vez de una
// sola (así una clase puede tener más de un rol); sin multi, es de selección única.
// Botón compacto que muestra la selección actual y abre/cierra el menú
// desplegable con los chips (mismo contenido de antes, pero oculto por
// defecto para no ocupar tanto espacio vertical en formularios largos).
export function ConfigListPicker({ list, setList, value, onChange, icon: Icon, placeholder, multi }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const rootRef = useRef(null);
  const selected = multi ? (value || []) : value;
  function isSelected(key) { return multi ? selected.includes(key) : selected === key; }
  function selectKey(key) {
    if (multi) onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
    else { onChange(key); setOpen(false); }
  }
  function addItem() {
    const name = draft.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (!list.some((it) => it.key === key)) {
      const color = CLASSIFICATION_COLOR_POOL[list.length % CLASSIFICATION_COLOR_POOL.length];
      setList([...list, { key, label: name, color }]);
    }
    selectKey(key);
    setDraft("");
  }
  function removeItem(key, e) {
    e.stopPropagation();
    setList(list.filter((it) => it.key !== key));
    if (multi) { if (selected.includes(key)) onChange(selected.filter((k) => k !== key)); }
    else if (value === key) onChange(null);
  }
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e) { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const selectedItems = multi ? list.filter((it) => selected.includes(it.key)) : null;
  const selectedSingle = !multi ? list.find((it) => it.key === selected) : null;
  const summaryLabel = multi
    ? (selectedItems.length ? selectedItems.map((it) => it.label).join(", ") : "Ninguno")
    : (selectedSingle ? selectedSingle.label : "Ninguno");
  const summaryColor = multi
    ? (selectedItems.length === 1 ? selectedItems[0].color : undefined)
    : selectedSingle?.color;

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={styles.configPickerToggle}>
        {Icon && <Icon size={13} color="var(--muted)" />}
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: summaryColor || "var(--text)" }}>
          {summaryLabel}
        </span>
        <ChevronDown size={13} color="var(--muted)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .12s ease", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={styles.configPickerDropdown}>
          <div style={styles.tagsRow}>
            {!multi && (
              <button type="button" onClick={() => { onChange(null); setOpen(false); }}
                style={{ ...styles.tagChip, cursor: "pointer", border: "1px solid var(--border)", ...(!value ? { background: "var(--accent)", color: "var(--bg)" } : {}) }}>
                Ninguno
              </button>
            )}
            {list.map((it) => (
              <button key={it.key} type="button" onClick={() => selectKey(it.key)}
                style={{ ...styles.tagChip, cursor: "pointer", border: "1px solid var(--border)", ...(isSelected(it.key) ? { background: it.color, color: "var(--bg)" } : { color: it.color }) }}>
                {it.label}
                <X size={10} style={{ marginLeft: 4, opacity: 0.65 }} onClick={(e) => removeItem(it.key, e)} />
              </button>
            ))}
            <input value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
              onBlur={() => { if (draft) addItem(); }}
              placeholder={placeholder} style={styles.tagInput} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- BLOCK: INFO DE HABILIDAD ---------- */
export function ElementPicker({ value, onChange }) {
  return (
    <ConfigListPicker list={activeElements} setList={setActiveElements} value={value} onChange={onChange}
      icon={Flame} placeholder="+ elemento…" />
  );
}

// Selector de un solo estado alterado (o "Ninguno"), misma lista configurable
// que usa el bloque de Resistencias y debilidades del lado de quien lo recibe.
export function StatusPicker({ value, onChange }) {
  return (
    <ConfigListPicker list={activeStatusEffects} setList={setActiveStatusEffects} value={value} onChange={onChange}
      icon={CircleAlert} placeholder="+ estado…" />
  );
}
