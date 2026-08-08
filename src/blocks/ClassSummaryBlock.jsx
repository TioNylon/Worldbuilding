import { useState, useEffect, useRef, useMemo } from "react";
import { Ghost, ChevronDown, Shield } from "lucide-react";
import { getPageBlocks } from "../utils/blocks.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: HABILIDADES Y OBJETOS DE LA CLASE ---------- */
// Puramente inferido (como las relaciones entrantes de Personaje): escanea
// todos los nodos buscando quién tiene esta clase asignada o restringida.
export function ClassSummaryBlock({ nodes, nodeId }) {
  const characters = useMemo(
    () => nodes.filter((n) => n.category === "character" && (n.classIds || []).includes(nodeId)),
    [nodes, nodeId]
  );
  const items = useMemo(
    () => nodes.filter((n) => n.category === "object" && getPageBlocks(n).some((b) => b.type === "itemStats" && b.usableBy === nodeId)),
    [nodes, nodeId]
  );
  const skills = useMemo(
    () => nodes.filter((n) => n.category === "skill" && getPageBlocks(n).some((b) => b.type === "skillInfo" && b.usableBy === nodeId)),
    [nodes, nodeId]
  );
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Personajes con esta clase</div>
      {characters.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Ninguno todavía.</div>
      ) : characters.map((n) => (
        <div key={n.id} style={{ fontSize: 12, color: "var(--text)", padding: "3px 0" }}>{n.name}</div>
      ))}
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 14 }}>Objetos exclusivos</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Ninguno todavía.</div>
      ) : items.map((n) => (
        <div key={n.id} style={{ fontSize: 12, color: "var(--text)", padding: "3px 0" }}>{n.name}</div>
      ))}
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 14 }}>Habilidades exclusivas</div>
      {skills.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Ninguna todavía.</div>
      ) : skills.map((n) => (
        <div key={n.id} style={{ fontSize: 12, color: "var(--text)", padding: "3px 0" }}>{n.name}</div>
      ))}
    </div>
  );
}

// Versión desplegable del selector de clases, para la Ficha del libro de
// Personajes: colapsado por defecto (solo el resumen), se abre al clic y se
// cierra si se hace clic afuera — mismo patrón que ConfigListPicker.
export function CharacterClassDropdown({ nodes, classIds, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e) { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);
  const classes = nodes.filter((n) => n.category === "class").sort((a, b) => a.name.localeCompare(b.name));
  const selected = classIds || [];
  const selectedNames = classes.filter((c) => selected.includes(c.id)).map((c) => c.name);
  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={styles.configPickerToggle}>
        <Shield size={13} color="var(--muted)" />
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedNames.length ? selectedNames.join(", ") : "Elegir clases…"}
        </span>
        <ChevronDown size={13} color="var(--muted)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .12s ease", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={styles.configPickerDropdown}>
          <CharacterClassPicker nodes={nodes} classIds={classIds} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

/* ---------- SELECTOR DE CLASE(S) (solo páginas de Personaje) ---------- */
export function CharacterClassPicker({ nodes, classIds, onChange }) {
  const classes = nodes.filter((n) => n.category === "class").sort((a, b) => a.name.localeCompare(b.name));
  const selected = classIds || [];
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  if (!classes.length) return null;
  return (
    <div style={styles.tagsRow}>
      <Shield size={13} color="var(--muted)" />
      {classes.map((c) => {
        const active = selected.includes(c.id);
        return (
          <button key={c.id} type="button" onClick={() => toggle(c.id)}
            style={{
              ...styles.tagChip, cursor: "pointer", border: "1px solid var(--border)",
              ...(active ? { background: "var(--accent)", color: "var(--bg)" } : {}),
            }}>
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- SELECTOR DE SIMBIONTE(S) (solo páginas de Personaje) ---------- */
export function CharacterSymbiontPicker({ nodes, symbiontIds, onChange }) {
  const symbionts = nodes.filter((n) => n.category === "symbiont").sort((a, b) => a.name.localeCompare(b.name));
  const selected = symbiontIds || [];
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  if (!symbionts.length) return null;
  return (
    <div style={styles.tagsRow}>
      <Ghost size={13} color="var(--muted)" />
      {symbionts.map((s) => {
        const active = selected.includes(s.id);
        return (
          <button key={s.id} type="button" onClick={() => toggle(s.id)}
            style={{
              ...styles.tagChip, cursor: "pointer", border: "1px solid var(--border)",
              ...(active ? { background: "var(--accent)", color: "var(--bg)" } : {}),
            }}>
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
