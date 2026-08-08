import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import { uid } from "../utils/misc.js";
import { styles } from "../styles.js";
import { QuickCreateButton } from "../components/QuickCreateButton.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";

// Recetas de forja: a qué objeto se puede mejorar ESTE objeto, con qué
// materiales (otros objetos + cantidad) y cuánto oro. Vive dentro del propio
// itemStats (block.recipes), pero sólo se edita desde la página "Forja" del
// Libro de objetos — el bloque normal de estadísticas no la muestra, para no
// recargarlo. Reutiliza el mismo patrón de lista que Tabla de botín/Encuentro.
export function ForgeRecipesBlock({ block, nodes, excludeId, updateBlock, addObjectItem }) {
  const recipes = block.recipes || [];
  const items = useMemo(
    () => nodes.filter((n) => n.category === "object" && n.id !== excludeId).sort((a, b) => a.name.localeCompare(b.name)),
    [nodes, excludeId]
  );
  const itemOptions = useMemo(() => items.map((it) => ({ id: it.id, label: it.name })), [items]);

  function addRecipe() {
    updateBlock(block.id, { recipes: [...recipes, { id: uid(), resultItemId: null, materials: [], gold: 0, notes: "" }] });
  }
  function updateRecipe(id, patch) {
    updateBlock(block.id, { recipes: recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }
  function removeRecipe(id) {
    updateBlock(block.id, { recipes: recipes.filter((r) => r.id !== id) });
  }
  function addMaterial(recipeId) {
    const r = recipes.find((x) => x.id === recipeId);
    updateRecipe(recipeId, { materials: [...(r.materials || []), { id: uid(), itemId: items[0]?.id || null, qty: 1 }] });
  }
  function updateMaterial(recipeId, matId, patch) {
    const r = recipes.find((x) => x.id === recipeId);
    updateRecipe(recipeId, { materials: (r.materials || []).map((m) => (m.id === matId ? { ...m, ...patch } : m)) });
  }
  function removeMaterial(recipeId, matId) {
    const r = recipes.find((x) => x.id === recipeId);
    updateRecipe(recipeId, { materials: (r.materials || []).filter((m) => m.id !== matId) });
  }

  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Recetas de mejora</div>
      {recipes.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Sin recetas todavía.</div>
      )}
      {recipes.map((r) => (
        <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 5px)", padding: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>Resultado:</span>
            <div style={{ flex: 1 }}>
              <SearchSelect options={itemOptions} value={r.resultItemId || null}
                onChange={(v) => updateRecipe(r.id, { resultItemId: v })} placeholder="Buscar objeto…" />
            </div>
            {addObjectItem && (
              <QuickCreateButton title="Crear objeto nuevo como resultado"
                onCreate={(name) => addObjectItem(name, {
                  nodeId: excludeId, blockId: block.id,
                  apply: (b, newId) => ({ ...b, recipes: (b.recipes || []).map((rr) => (rr.id === r.id ? { ...rr, resultItemId: newId } : rr)) }),
                })} />
            )}
            <X size={14} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeRecipe(r.id)} />
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Materiales:</div>
          {(r.materials || []).map((m) => (
            <div key={m.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
              <div style={{ flex: 2 }}>
                <SearchSelect options={itemOptions} value={m.itemId || null}
                  onChange={(v) => updateMaterial(r.id, m.id, { itemId: v })} placeholder="Buscar material…" />
              </div>
              {addObjectItem && (
                <QuickCreateButton title="Crear objeto nuevo como material"
                  onCreate={(name) => addObjectItem(name, {
                    nodeId: excludeId, blockId: block.id,
                    apply: (b, newId) => ({
                      ...b,
                      recipes: (b.recipes || []).map((rr) => (rr.id !== r.id ? rr : {
                        ...rr, materials: (rr.materials || []).map((mm) => (mm.id === m.id ? { ...mm, itemId: newId } : mm)),
                      })),
                    }),
                  })} />
              )}
              <input type="number" min={1} value={m.qty ?? 1}
                onChange={(ev) => updateMaterial(r.id, m.id, { qty: Math.max(1, parseInt(ev.target.value, 10) || 1) })}
                style={{ ...styles.statsMiniInput, width: 50 }} />
              <X size={12} style={{ cursor: "pointer", color: "#c45c5c", flexShrink: 0 }} onClick={() => removeMaterial(r.id, m.id)} />
            </div>
          ))}
          <button style={{ ...styles.pillBtn, fontSize: 11, padding: "3px 8px" }} onClick={() => addMaterial(r.id)}><Plus size={11} /> Agregar material</button>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <label style={{ ...styles.statsField, flex: 1 }}>
              <span style={styles.statsLabel}>Oro</span>
              <input type="number" min={0} value={r.gold ?? 0}
                onChange={(e) => updateRecipe(r.id, { gold: Math.max(0, parseInt(e.target.value, 10) || 0) })} style={styles.statsMiniInput} />
            </label>
            <label style={{ ...styles.statsField, flex: 2 }}>
              <span style={styles.statsLabel}>Notas</span>
              <input value={r.notes || ""} onChange={(e) => updateRecipe(r.id, { notes: e.target.value })}
                placeholder="Ej. sólo en la forja del pueblo" style={styles.statsInput} />
            </label>
          </div>
        </div>
      ))}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }} onClick={addRecipe}><Plus size={12} /> Nueva receta</button>
    </div>
  );
}
