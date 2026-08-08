import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { styles } from "../styles.js";
import { keyActivate } from "../utils/misc.js";

// Combo con autocompletado: a diferencia de un <select> plano, escribir
// filtra la lista en vivo — pensado para listas largas (materiales, objetos
// resultado) donde desplazarse por un <select> alfabético es tedioso.
// `options` es [{ id, label, sublabel? }]; `value` es el id elegido o null.
export function SearchSelect({ options, value, onChange, placeholder, clearLabel = "— ninguno —" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const selected = options.find((o) => o.id === value) || null;

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e) { if (rootRef.current && !rootRef.current.contains(e.target)) { setOpen(false); setQuery(""); } }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function pick(id) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={open ? query : (selected ? selected.label : "")}
          placeholder={selected && !open ? undefined : (placeholder || "Buscar…")}
          onFocus={(e) => { setOpen(true); setQuery(""); e.target.select(); }}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setOpen(false); setQuery(""); inputRef.current?.blur(); }
            if (e.key === "Enter" && filtered.length) { e.preventDefault(); pick(filtered[0].id); }
          }}
          style={{ ...styles.statsInput, paddingRight: 26 }}
        />
        <Search size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 30,
          background: "var(--panel3, var(--panel2))", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)",
          maxHeight: 220, overflowY: "auto", boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
        }}>
          {value && (
            <div onClick={() => pick(null)} role="option" aria-selected="false" tabIndex={0} onKeyDown={keyActivate}
              style={{ padding: "7px 10px", fontSize: 12.5, cursor: "pointer", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
              <X size={11} style={{ marginRight: 5, verticalAlign: -1 }} />{clearLabel}
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ padding: "9px 10px", fontSize: 12.5, color: "var(--muted)", fontStyle: "italic" }}>Sin resultados.</div>
          )}
          {filtered.map((o) => (
            <div key={o.id} onClick={() => pick(o.id)} role="option" aria-selected={o.id === value} tabIndex={0} onKeyDown={keyActivate}
              style={{ padding: "7px 10px", fontSize: 12.5, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 8 }}
              onMouseDown={(e) => e.preventDefault()}>
              <span>{o.label}</span>
              {o.sublabel && <span style={{ color: "var(--muted)", fontSize: 11 }}>{o.sublabel}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
