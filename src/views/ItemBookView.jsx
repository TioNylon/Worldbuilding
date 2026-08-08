import { useState, useEffect, useMemo } from "react";
import { Gem, Plus, ChevronRight, ChevronLeft, X, BookOpen, GitBranch, Beaker } from "lucide-react";
import { ITEM_SLOTS } from "../data/statFields.js";
import { getPageBlocks } from "../utils/blocks.js";
import { buildUpgradeGraph } from "../utils/graph.js";
import { itemSlotIcon, keyActivate } from "../utils/misc.js";
import { rarityColor, recipeCostLabel } from "../utils/stats.js";
import { styles } from "../styles.js";
import { activeArmorTypes, activeWeaponTypes } from "../state/globals.js";
import { useModals } from "../components/Modals.jsx";
import { ForgeRecipesBlock } from "../blocks/ForgeRecipesBlock.jsx";
import { ItemStatsBlock } from "../blocks/ItemStatsBlock.jsx";
import { UpgradeNodeDetail, UpgradeTreeGraph } from "./UpgradeTreeGraph.jsx";

// Libro de objetos: a diferencia del de Clases/Bestiario (pocas entradas, una
// pestaña por cada una), acá puede haber muchísimos objetos — así que en vez de
// pestañas se filtra por posición y, si aplica, por su clasificación (tipo de
// arma/armadura), y se navega desde un listado con ícono (hoja izquierda) hacia
// el detalle con sus estadísticas completas (hoja derecha, reutilizando
// ItemStatsBlock tal cual, igual que el Bestiario reutiliza sus bloques).
export function ItemBookView({ nodes, navigateToId, updateNode, addObjectItem, addConsumableItem, addSkillItem, deleteNode, isMobile }) {
  const { promptValue } = useModals();
  const [slotFilter, setSlotFilter] = useState(null);
  const [classFilter, setClassFilter] = useState(null);
  const [page, setPage] = useState("ficha");
  const [mode, setMode] = useState("detail");
  const [treeTypeFilter, setTreeTypeFilter] = useState(null);
  const allItems = useMemo(() => nodes.filter((n) => n.category === "object"), [nodes]);

  const filtered = useMemo(() => {
    return allItems.filter((n) => {
      const b = getPageBlocks(n).find((x) => x.type === "itemStats");
      if (slotFilter && b?.itemSlot !== slotFilter) return false;
      if (classFilter && b?.weaponType !== classFilter && b?.armorType !== classFilter) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItems, slotFilter, classFilter]);

  const [selectedId, setSelectedId] = useState(null);
  useEffect(() => {
    if (!filtered.some((n) => n.id === selectedId)) setSelectedId(filtered[0]?.id || null);
  }, [filtered, selectedId]);

  const selected = allItems.find((n) => n.id === selectedId) || null;
  const selectedBlock = selected ? getPageBlocks(selected).find((b) => b.type === "itemStats") : null;

  // Mapa receta -> objeto de origen, indexado por resultado. Sirve tanto para
  // mostrar "se forja desde X" en la Forja como para hallar las armas base
  // (sin predecesor) del Árbol de mejoras, sin guardar la referencia dos veces.
  const predecessorMap = useMemo(() => {
    const m = new Map();
    allItems.forEach((n) => {
      const b = getPageBlocks(n).find((x) => x.type === "itemStats");
      (b?.recipes || []).forEach((r) => { if (r.resultItemId) m.set(r.resultItemId, { item: n, recipe: r }); });
    });
    return m;
  }, [allItems]);
  const predecessor = selected ? predecessorMap.get(selected.id) || null : null;

  const weaponRoots = useMemo(() => {
    return allItems.filter((n) => {
      const b = getPageBlocks(n).find((x) => x.type === "itemStats");
      if (!b) return false;
      if (b.itemSlot !== "Mano Principal" && b.itemSlot !== "Mano Secundaria") return false;
      if (predecessorMap.has(n.id)) return false;
      if (treeTypeFilter && b.weaponType !== treeTypeFilter) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItems, predecessorMap, treeTypeFilter]);

  const upgradeGraph = useMemo(() => buildUpgradeGraph(weaponRoots, allItems), [weaponRoots, allItems]);
  const [treeSelectedId, setTreeSelectedId] = useState(null);
  useEffect(() => {
    if (!upgradeGraph.nodesById.has(treeSelectedId)) {
      setTreeSelectedId(weaponRoots[0]?.id || null);
    }
  }, [upgradeGraph, weaponRoots, treeSelectedId]);
  const treeSelectedNode = treeSelectedId ? upgradeGraph.nodesById.get(treeSelectedId) : null;

  function selectFromTree(id) {
    setSelectedId(id);
    setMode("detail");
    setPage("ficha");
  }

  function updateSelectedBlock(blockId, patch) {
    if (!selected) return;
    updateNode(selected.id, { blocks: getPageBlocks(selected).map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  }
  async function handleAddItem() {
    const name = await promptValue("Nombre del nuevo objeto:");
    if (!name) return;
    setSelectedId(addObjectItem(name));
  }

  // Crafteo de consumibles: mismo diseño que la Forja (recetas + predecesor +
  // resultado), pero con su propia selección y acotado a los objetos con slot
  // "Consumible", para no mezclar pociones con la cadena de mejora de armas.
  const consumables = useMemo(() => {
    return allItems.filter((n) => {
      const b = getPageBlocks(n).find((x) => x.type === "itemStats");
      return b?.itemSlot === "Consumible";
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItems]);

  const [craftSelectedId, setCraftSelectedId] = useState(null);
  useEffect(() => {
    if (!consumables.some((n) => n.id === craftSelectedId)) setCraftSelectedId(consumables[0]?.id || null);
  }, [consumables, craftSelectedId]);
  const craftSelected = allItems.find((n) => n.id === craftSelectedId) || null;
  const craftSelectedBlock = craftSelected ? getPageBlocks(craftSelected).find((b) => b.type === "itemStats") : null;
  const craftPredecessor = craftSelected ? predecessorMap.get(craftSelected.id) || null : null;

  function updateCraftBlock(blockId, patch) {
    if (!craftSelected) return;
    updateNode(craftSelected.id, { blocks: getPageBlocks(craftSelected).map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  }
  async function handleAddConsumable() {
    const name = await promptValue("Nombre del nuevo consumible:");
    if (!name) return;
    setCraftSelectedId(addConsumableItem(name));
  }

  const isWeaponSlot = slotFilter === "Mano Principal" || slotFilter === "Mano Secundaria";
  const isArmorSlot = slotFilter === "Cabeza" || slotFilter === "Pecho" || slotFilter === "Piernas";

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookFilterRow}>
        <button style={{ ...styles.bookFilterChip, ...(mode === "detail" ? styles.bookFilterChipActive : {}) }}
          onClick={() => setMode("detail")}><BookOpen size={13} /> Ficha y forja</button>
        <button style={{ ...styles.bookFilterChip, ...(mode === "tree" ? styles.bookFilterChipActive : {}) }}
          onClick={() => setMode("tree")}><GitBranch size={13} /> Árbol de mejoras</button>
        <button style={{ ...styles.bookFilterChip, ...(mode === "craft" ? styles.bookFilterChipActive : {}) }}
          onClick={() => setMode("craft")}><Beaker size={13} /> Crafteo de consumibles</button>
      </div>

      {mode === "detail" && page === "ficha" && (
        <>
          <div style={styles.bookFilterRow}>
            <button style={{ ...styles.bookFilterChip, ...(!slotFilter ? styles.bookFilterChipActive : {}) }}
              onClick={() => { setSlotFilter(null); setClassFilter(null); }}>Todos</button>
            {ITEM_SLOTS.map((s) => (
              <button key={s} style={{ ...styles.bookFilterChip, ...(slotFilter === s ? styles.bookFilterChipActive : {}) }}
                onClick={() => { setSlotFilter(s); setClassFilter(null); }}>{s}</button>
            ))}
          </div>
          {(isWeaponSlot || isArmorSlot) && (
            <div style={styles.bookFilterRow}>
              <button style={{ ...styles.bookFilterChip, ...(!classFilter ? styles.bookFilterChipActive : {}) }}
                onClick={() => setClassFilter(null)}>Todas las clasificaciones</button>
              {(isWeaponSlot ? activeWeaponTypes : activeArmorTypes).map((c) => (
                <button key={c.key}
                  style={{ ...styles.bookFilterChip, color: c.color, ...(classFilter === c.key ? { background: c.color, borderColor: c.color, color: "var(--bg)" } : {}) }}
                  onClick={() => setClassFilter(c.key)}>{c.label}</button>
              ))}
            </div>
          )}
        </>
      )}
      {mode === "tree" && (
        <div style={styles.bookFilterRow}>
          <button style={{ ...styles.bookFilterChip, ...(!treeTypeFilter ? styles.bookFilterChipActive : {}) }}
            onClick={() => setTreeTypeFilter(null)}>Todos los tipos</button>
          {activeWeaponTypes.map((c) => (
            <button key={c.key}
              style={{ ...styles.bookFilterChip, color: c.color, ...(treeTypeFilter === c.key ? { background: c.color, borderColor: c.color, color: "var(--bg)" } : {}) }}
              onClick={() => setTreeTypeFilter(c.key)}>{c.label}</button>
          ))}
        </div>
      )}

      {mode === "tree" ? (
        <div style={styles.bookBody}>
          <div style={styles.bookFrame}>
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ ...styles.bookPage, overflow: "auto" }}>
                <h2 style={styles.bookPageTitle}>Árbol de mejoras</h2>
                {weaponRoots.length === 0 ? (
                  <span style={styles.bookBottomHint}>Ninguna arma base con este filtro. Las armas que ya son resultado de otra receta no aparecen como raíz.</span>
                ) : (
                  <UpgradeTreeGraph graph={upgradeGraph} selectedId={treeSelectedId} onSelect={setTreeSelectedId} />
                )}
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={{ ...styles.bookPage, width: 240, flex: "0 0 240px", overflowY: "auto" }}>
                {treeSelectedNode
                  ? <UpgradeNodeDetail node={treeSelectedNode} edges={upgradeGraph.edges} allItems={allItems} onOpenFull={() => selectFromTree(treeSelectedNode.id)} />
                  : <span style={styles.bookBottomHint}>Elegí un objeto del árbol para ver su detalle.</span>}
              </div>
            </div>
          </div>
        </div>
      ) : mode === "craft" ? (
        <div style={styles.bookBody}>
          <div style={styles.bookFrame}>
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                <h2 style={styles.bookPageTitle}>Consumibles</h2>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {consumables.length === 0 && <span style={styles.bookBottomHint}>Sin objetos con slot "Consumible" todavía.</span>}
                  {consumables.map((n) => {
                    const b = getPageBlocks(n).find((x) => x.type === "itemStats");
                    return (
                      <div key={n.id}
                        style={{ ...styles.bookSkillRow, ...(n.id === craftSelectedId ? { background: "color-mix(in srgb, var(--accent) 16%, transparent)" } : {}) }}
                        onClick={() => setCraftSelectedId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                        <Beaker size={14} />
                        <span style={{ flex: 1 }}>{n.name}</span>
                        <span style={{ ...styles.bookSkillRowType, color: rarityColor(b?.rarity ?? 1) }}>★{b?.rarity ?? 1}</span>
                      </div>
                    );
                  })}
                </div>
                <button style={{ ...styles.bookAddClassBtn, alignSelf: "flex-start", marginTop: 10 }} onClick={handleAddConsumable}>
                  <Plus size={14} /> Nuevo consumible
                </button>
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                {craftSelected && craftSelectedBlock ? (
                  <>
                    <h2 style={styles.bookPageTitle}>{craftSelected.name}</h2>
                    {craftPredecessor && (
                      <div style={{ ...styles.generalBookTile, marginBottom: 10, background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
                        onClick={() => setCraftSelectedId(craftPredecessor.item.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                        <ChevronLeft size={16} color="var(--muted)" />
                        <div style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>
                          Se craftea desde <b>{craftPredecessor.item.name}</b> ({recipeCostLabel(craftPredecessor.recipe, nodes)})
                        </div>
                      </div>
                    )}
                    <div style={{ overflowY: "auto", flex: 1 }}>
                      <ForgeRecipesBlock block={craftSelectedBlock} nodes={nodes} excludeId={craftSelected.id} updateBlock={updateCraftBlock} addObjectItem={addObjectItem} />
                    </div>
                  </>
                ) : (
                  <div style={{ color: "var(--muted)", fontStyle: "italic", margin: "auto" }}>Elige un consumible de la lista.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
      <div style={styles.bookBody}>
        <div style={styles.bookFrame}>
          {page === "ficha" ? (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                <h2 style={styles.bookPageTitle}>Objetos</h2>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {filtered.length === 0 && <span style={styles.bookBottomHint}>Sin objetos con este filtro.</span>}
                  {filtered.map((n) => {
                    const b = getPageBlocks(n).find((x) => x.type === "itemStats");
                    const Icon = itemSlotIcon(b?.itemSlot);
                    return (
                      <div key={n.id}
                        style={{ ...styles.bookSkillRow, ...(n.id === selectedId ? { background: "color-mix(in srgb, var(--accent) 16%, transparent)" } : {}) }}
                        onClick={() => setSelectedId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                        <Icon size={14} />
                        <span style={{ flex: 1 }}>{n.name}</span>
                        <span style={{ ...styles.bookSkillRowType, color: rarityColor(b?.rarity ?? 1) }}>★{b?.rarity ?? 1}</span>
                        <span style={styles.bookSkillRowType}>{b?.itemSlot || "—"}</span>
                      </div>
                    );
                  })}
                </div>
                <button style={{ ...styles.bookAddClassBtn, alignSelf: "flex-start", marginTop: 10 }} onClick={handleAddItem}>
                  <Plus size={14} /> Nuevo objeto
                </button>
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                {selected && selectedBlock ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <h2 style={{ ...styles.bookPageTitle, margin: 0 }}>{selected.name}</h2>
                      <X size={14} style={{ cursor: "pointer", color: "#b04848", flexShrink: 0 }} onClick={() => deleteNode(selected.id)} />
                    </div>
                    <span style={{ ...styles.catalogLink, display: "inline-block", marginBottom: 10 }} onClick={() => navigateToId(selected.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                      Abrir página completa →
                    </span>
                    <div style={{ overflowY: "auto", flex: 1 }}>
                      <ItemStatsBlock block={selectedBlock} nodes={nodes} updateBlock={updateSelectedBlock} addSkillItem={addSkillItem} nodeId={selected.id} />
                    </div>
                  </>
                ) : (
                  <div style={{ color: "var(--muted)", fontStyle: "italic", margin: "auto" }}>Elige un objeto de la lista.</div>
                )}
              </div>
              {selected && (
                <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => setPage("forja")} title="Ver forja" role="button" tabIndex={0} onKeyDown={keyActivate}>
                  <ChevronRight size={18} />
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                {selected && selectedBlock ? (
                  <>
                    <h2 style={styles.bookPageTitle}>{selected.name}</h2>
                    {predecessor && (
                      <div style={{ ...styles.generalBookTile, marginBottom: 10, background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
                        onClick={() => setSelectedId(predecessor.item.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                        <ChevronLeft size={16} color="var(--muted)" />
                        <div style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>
                          Se forja desde <b>{predecessor.item.name}</b>
                          {(predecessor.recipe.materials || []).length > 0 && (
                            <> + {predecessor.recipe.materials.map((m) => {
                              const it = nodes.find((n) => n.id === m.itemId);
                              return `${it?.name || "?"} ×${m.qty}`;
                            }).join(", ")}</>
                          )}
                          {predecessor.recipe.gold ? ` + ${predecessor.recipe.gold} oro` : ""}
                        </div>
                      </div>
                    )}
                    <div style={{ overflowY: "auto", flex: 1 }}>
                      <ForgeRecipesBlock block={selectedBlock} nodes={nodes} excludeId={selected.id} updateBlock={updateSelectedBlock} addObjectItem={addObjectItem} />
                    </div>
                  </>
                ) : (
                  <div style={{ color: "var(--muted)", fontStyle: "italic", margin: "auto" }}>Elige un objeto de la lista.</div>
                )}
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                <div style={styles.bookSectionTitle}>Camino de mejora</div>
                {(!selectedBlock || (selectedBlock.recipes || []).length === 0) ? (
                  <span style={styles.bookBottomHint}>Sin recetas de mejora todavía.</span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedBlock.recipes.map((r) => {
                      const result = nodes.find((n) => n.id === r.resultItemId);
                      return (
                        <div key={r.id} style={styles.generalBookTile} onClick={() => result && setSelectedId(result.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                          <Gem size={16} color="var(--accent)" />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>
                              {(r.materials || []).map((m) => {
                                const it = nodes.find((n) => n.id === m.itemId);
                                return `${it?.name || "?"} ×${m.qty}`;
                              }).join(" + ") || "—"}
                              {r.gold ? ` + ${r.gold} oro` : ""}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text)" }}>
                              → {result ? result.name : "(sin resultado definido)"}
                            </div>
                          </div>
                          {result && <ChevronRight size={16} color="var(--muted)" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => setPage("ficha")} title="Volver" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronLeft size={18} />
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
