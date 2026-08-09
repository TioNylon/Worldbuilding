import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { getPageBlocks } from "../utils/blocks.js";
import { uid } from "../utils/misc.js";
import { threatLabelFor } from "../utils/stats.js";
import { styles } from "../styles.js";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { QuickCreateButton } from "../components/QuickCreateButton.jsx";

/* ---------- BLOCK: ENCUENTRO (Acontecimiento/Misión) ---------- */
// Lista de enemigos/jefes del Bestiario que participan, con cantidad y notas;
// muestra el nivel de amenaza de cada uno en vivo (tomado de su propio bloque
// de Nivel de amenaza) para no duplicar ese dato.
export function EncounterBlock({ block, nodes, updateBlock }) {
  const entries = block.enemies || [];
  const monsters = useMemo(
    () => nodes.filter((n) => n.category === "enemy" || n.category === "boss").sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  function addEntry() {
    updateBlock(block.id, { enemies: [...entries, { id: uid(), enemyId: monsters[0]?.id || null, count: 1, notes: "" }] });
  }
  function updateEntry(id, patch) {
    updateBlock(block.id, { enemies: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }
  function removeEntry(id) {
    updateBlock(block.id, { enemies: entries.filter((e) => e.id !== id) });
  }
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Encuentro</div>
      {entries.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin enemigos todavía.</div>
      )}
      {entries.map((e) => {
        const m = nodes.find((n) => n.id === e.enemyId);
        const threatB = m ? getPageBlocks(m).find((b) => b.type === "threatLevel") : null;
        const t = threatB ? threatLabelFor(threatB.level ?? 5) : null;
        return (
          <div key={e.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <div style={{ flex: 2 }}>
              <SearchSelect options={monsters.map((mo) => ({ id: mo.id, label: mo.name }))}
                value={e.enemyId || null} onChange={(v) => updateEntry(e.id, { enemyId: v })}
                placeholder="Buscar enemigo…" clearLabel="— ninguno —" />
            </div>
            <input type="number" min={1} value={e.count ?? 1}
              onChange={(ev) => updateEntry(e.id, { count: Math.max(1, parseInt(ev.target.value, 10) || 1) })}
              style={{ ...styles.statsMiniInput, width: 50 }} />
            {t && <span style={{ fontSize: 11, fontWeight: 600, color: t.color, whiteSpace: "nowrap" }}>{t.label}</span>}
            <input value={e.notes || ""} onChange={(ev) => updateEntry(e.id, { notes: ev.target.value })}
              placeholder="Notas (posición, condición…)" style={{ ...styles.statsInput, flex: 1 }} />
            <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeEntry(e.id)} />
          </div>
        );
      })}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addEntry}><Plus size={12} /> Agregar enemigo</button>
    </div>
  );
}

/* ---------- BLOCK: INVENTARIO DE TIENDA ---------- */
// Objetos a la venta con precio propio (sugerido desde el precio del objeto,
// editable por tienda) y stock opcional.
export function ShopInventoryBlock({ block, nodes, updateBlock, addObjectItem, nodeId }) {
  const entries = block.entries || [];
  const items = useMemo(() => nodes.filter((n) => n.category === "object").sort((a, b) => a.name.localeCompare(b.name)), [nodes]);
  function addEntry() {
    const first = items[0];
    const firstStats = first ? getPageBlocks(first).find((b) => b.type === "itemStats") : null;
    updateBlock(block.id, { entries: [...entries, { id: uid(), itemId: first?.id || null, price: firstStats?.price ?? 0, stock: "" }] });
  }
  function updateEntry(id, patch) {
    updateBlock(block.id, { entries: entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  }
  function removeEntry(id) {
    updateBlock(block.id, { entries: entries.filter((e) => e.id !== id) });
  }
  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Inventario de la tienda</div>
      {entries.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin objetos todavía.</div>
      )}
      {entries.map((e) => (
        <div key={e.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <div style={{ flex: 2 }}>
            <SearchSelect options={items.map((it) => ({ id: it.id, label: it.name }))}
              value={e.itemId || null} onChange={(v) => updateEntry(e.id, { itemId: v })}
              placeholder="Buscar objeto…" clearLabel="— ninguno —" />
          </div>
          <input type="number" min={0} value={e.price ?? 0}
            onChange={(ev) => updateEntry(e.id, { price: Math.max(0, parseInt(ev.target.value, 10) || 0) })}
            style={{ ...styles.statsMiniInput, width: 60 }} />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>oro</span>
          <input value={e.stock ?? ""} onChange={(ev) => updateEntry(e.id, { stock: ev.target.value })}
            placeholder="Stock (vacío = ilimitado)" style={{ ...styles.statsInput, width: 150 }} />
          <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeEntry(e.id)} />
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addEntry}><Plus size={12} /> Agregar objeto</button>
        {addObjectItem && nodeId && (
          <>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>o crear uno nuevo:</span>
            <QuickCreateButton title="Crear objeto nuevo y agregarlo al inventario"
              onCreate={(name) => addObjectItem(name, {
                nodeId, blockId: block.id,
                apply: (b, newId) => ({ ...b, entries: [...(b.entries || []), { id: uid(), itemId: newId, price: 0, stock: "" }] }),
              })} />
          </>
        )}
      </div>
    </div>
  );
}
