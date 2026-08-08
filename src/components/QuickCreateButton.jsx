import { useState } from "react";
import { Plus } from "lucide-react";
import { styles } from "../styles.js";

// Botón "+" que se convierte en un campo de texto angosto al hacer clic, para
// crear una entrada nueva (objeto/habilidad) sin salir de donde se la está
// asignando — Enter o perder el foco confirma, Escape cancela. `onCreate`
// hace el alta real y devuelve el id nuevo.
export function QuickCreateButton({ onCreate, title }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  if (!open) {
    return (
      <button type="button" title={title || "Crear nueva"} onClick={() => setOpen(true)}
        style={{ ...styles.miniBtn, flexShrink: 0 }}>
        <Plus size={12} />
      </button>
    );
  }
  function submit() {
    const name = draft.trim();
    setOpen(false); setDraft("");
    if (name) onCreate(name);
  }
  return (
    <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); submit(); }
        if (e.key === "Escape") { setDraft(""); setOpen(false); }
      }}
      onBlur={submit} placeholder="Nombre… (Enter)" style={{ ...styles.statsInput, flex: "1 1 90px", minWidth: 90 }} />
  );
}
