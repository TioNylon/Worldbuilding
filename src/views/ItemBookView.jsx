import { useState, useEffect, useMemo } from "react";
import { Gem, Plus, ChevronRight, ChevronLeft, X, BookOpen, GitBranch, Beaker, Layers, Wand2 } from "lucide-react";
import { ITEM_SLOTS } from "../data/statFields.js";
import { getPageBlocks } from "../utils/blocks.js";
import { buildUpgradeGraph } from "../utils/graph.js";
import { itemSlotIcon, keyActivate, uid } from "../utils/misc.js";
import { rarityColor, recipeCostLabel } from "../utils/stats.js";
import { styles } from "../styles.js";
import { activeArmorTypes, activeWeaponTypes } from "../state/globals.js";
import { useModals } from "../components/Modals.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { ForgeRecipesBlock } from "../blocks/ForgeRecipesBlock.jsx";
import { ItemStatsBlock } from "../blocks/ItemStatsBlock.jsx";
import { UpgradeNodeDetail, UpgradeTreeGraph } from "./UpgradeTreeGraph.jsx";

const GEAR_SLOTS = ["Mano Principal", "Mano Secundaria", "Cabeza", "Pecho", "Piernas"];

// "Clonar stats de…": en vez de tipear los mismos 15 campos que ya tiene otro
// objeto de la misma familia (Rifle, Rifle +1, Rifle +2…), buscás el objeto
// base y sus stats se copian de una — la receta que los conecta queda armada
// sola. Es una acción de un solo golpe, no guarda selección propia.
function CloneFromPicker({ options, onPick }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <Wand2 size={12} /> Clonar stats de…
      </div>
      <SearchSelect options={options} value={null} onChange={(id) => id && onPick(id)} placeholder="Buscar objeto base…" />
    </div>
  );
}

// Libro de objetos: a diferencia del de Clases/Bestiario (pocas entradas, una
// pestaña por cada una), acá puede haber muchísimos objetos — así que en vez de
// pestañas se filtra por posición y, si aplica, por su clasificación (tipo de
// arma/armadura), y se navega desde un listado con ícono (hoja izquierda) hacia
// el detalle con sus estadísticas completas (hoja derecha, reutilizando
// ItemStatsBlock tal cual, igual que el Bestiario reutiliza sus bloques).
export function ItemBookView({ nodes, navigateToId, updateNode, addObjectItem, addConsumableItem, addSkillItem, cloneItemStats, addObjectItemFrom, deleteNode, isMobile }) {
  const { promptValue } = useModals();
  const [slotFilter, setSlotFilter] = useState(null);
  const [classFilter, setClassFilter] = useState(null);
  const [mode, setMode] = useState("detail");
  const [treeTypeFilter, setTreeTypeFilter] = useState(null);
  const [familyFilter, setFamilyFilter] = useState(null);
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
  const selectedIsGear = selectedBlock && GEAR_SLOTS.includes(selectedBlock.itemSlot);
  const cloneOptions = useMemo(
    () => allItems.filter((n) => n.id !== selected?.id).map((n) => ({ id: n.id, label: n.name })),
    [allItems, selected]
  );

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
  function rootNameOf(id) {
    let cur = id, guard = 0;
    while (predecessorMap.has(cur) && guard++ < 50) cur = predecessorMap.get(cur).item.id;
    return allItems.find((n) => n.id === cur)?.name || "?";
  }

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

  // Familias: mismo grafo que el Árbol de mejoras, pero pensado para ver TODAS
  // las ramas de un mismo tag juntas (ej. "Guitarra acústica" y "Guitarra
  // eléctrica" comparten weaponType="Guitarra" pero son raíces distintas) —
  // buildUpgradeGraph ya soporta varias raíces y las funde si comparten un
  // resultado, así que acá solo hace falta no restringir a una sola raíz.
  const familyRoots = useMemo(() => {
    if (!familyFilter) return [];
    return allItems.filter((n) => {
      const b = getPageBlocks(n).find((x) => x.type === "itemStats");
      if (!b) return false;
      if (b.itemSlot !== "Mano Principal" && b.itemSlot !== "Mano Secundaria") return false;
      if (predecessorMap.has(n.id)) return false;
      return b.weaponType === familyFilter;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allItems, predecessorMap, familyFilter]);
  const familyGraph = useMemo(() => buildUpgradeGraph(familyRoots, allItems), [familyRoots, allItems]);
  const familyItems = useMemo(() => {
    return Array.from(familyGraph.nodesById.values())
      .map((n) => ({ ...n, rootName: rootNameOf(n.id) }))
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  }, [familyGraph]);
  const [familySelectedId, setFamilySelectedId] = useState(null);
  useEffect(() => {
    if (!familyGraph.nodesById.has(familySelectedId)) {
      setFamilySelectedId(familyRoots[0]?.id || null);
    }
  }, [familyGraph, familyRoots, familySelectedId]);
  const familySelectedNode = familySelectedId ? familyGraph.nodesById.get(familySelectedId) : null;

  function selectFromTree(id) {
    setSelectedId(id);
    setMode("detail");
  }

  // Crea la siguiente mejora directamente desde el "+" del Árbol/Familias, sin
  // cruzar a "Ficha y forja": crea el objeto (clonando stats si se pidió) y
  // en el mismo persist le agrega al origen la receta que apunta a él.
  function handleAddBranch(sourceId, name, copyStats) {
    const src = allItems.find((n) => n.id === sourceId);
    const srcBlock = src && getPageBlocks(src).find((b) => b.type === "itemStats");
    if (!srcBlock) return;
    const newId = addObjectItemFrom(name, copyStats ? sourceId : null, {
      nodeId: sourceId, blockId: srcBlock.id,
      apply: (b, newNodeId) => ({ ...b, recipes: [...(b.recipes || []), { id: uid(), resultItemId: newNodeId, materials: [], gold: 0, notes: "" }] }),
    });
    setTreeSelectedId(newId);
    setFamilySelectedId(newId);
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
  const familyTag = activeWeaponTypes.find((t) => t.key === familyFilter);

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookFilterRow}>
        <button style={{ ...styles.bookFilterChip, ...(mode === "detail" ? styles.bookFilterChipActive : {}) }}
          onClick={() => setMode("detail")}><BookOpen size={13} /> Ficha y forja</button>
        <button style={{ ...styles.bookFilterChip, ...(mode === "tree" ? styles.bookFilterChipActive : {}) }}
          onClick={() => setMode("tree")}><GitBranch size={13} /> Árbol de mejoras</button>
        <button style={{ ...styles.bookFilterChip, ...(mode === "family" ? styles.bookFilterChipActive : {}) }}
          onClick={() => setMode("family")}><Layers size={13} /> Familias</button>
        <button style={{ ...styles.bookFilterChip, ...(mode === "craft" ? styles.bookFilterChipActive : {}) }}
          onClick={() => setMode("craft")}><Beaker size={13} /> Crafteo de consumibles</button>
      </div>

      {mode === "detail" && (
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
      {mode === "family" && (
        <div style={styles.bookFilterRow}>
          {activeWeaponTypes.length === 0 && (
            <span style={styles.bookBottomHint}>Todavía no hay ningún "Tipo de arma" configurado — agregá uno desde la Ficha de un arma (ej. "Guitarra") para poder agrupar sus ramas acá.</span>
          )}
          {activeWeaponTypes.map((c) => (
            <button key={c.key}
              style={{ ...styles.bookFilterChip, color: c.color, ...(familyFilter === c.key ? { background: c.color, borderColor: c.color, color: "var(--bg)" } : {}) }}
              onClick={() => setFamilyFilter(c.key)}>{c.label}</button>
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
                  <UpgradeTreeGraph graph={upgradeGraph} selectedId={treeSelectedId} onSelect={setTreeSelectedId} onAddBranch={handleAddBranch} />
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
      ) : mode === "family" ? (
        <div style={styles.bookBody}>
          <div style={styles.bookFrame}>
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ ...styles.bookPage, overflow: "auto" }}>
                <h2 style={styles.bookPageTitle}>{familyTag ? familyTag.label : "Familias"}</h2>
                {!familyFilter ? (
                  <span style={styles.bookBottomHint}>Elegí una familia arriba (ej. "Guitarra") para ver todas sus ramas juntas, aunque vengan de raíces distintas.</span>
                ) : familyRoots.length === 0 ? (
                  <span style={styles.bookBottomHint}>Ningún objeto base con esta familia todavía.</span>
                ) : (
                  <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {familyItems.map((n) => (
                        <div key={n.id} onClick={() => setFamilySelectedId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}
                          style={{ ...styles.bookFilterChip, cursor: "pointer", display: "flex", gap: 5, ...(familySelectedId === n.id ? styles.bookFilterChipActive : {}) }}>
                          {n.item.name}
                          <span style={{ opacity: 0.65, fontSize: 10 }}>· {n.rootName}</span>
                        </div>
                      ))}
                    </div>
                    <UpgradeTreeGraph graph={familyGraph} selectedId={familySelectedId} onSelect={setFamilySelectedId} onAddBranch={handleAddBranch} />
                  </>
                )}
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={{ ...styles.bookPage, width: 240, flex: "0 0 240px", overflowY: "auto" }}>
                {familySelectedNode
                  ? <UpgradeNodeDetail node={familySelectedNode} edges={familyGraph.edges} allItems={allItems} onOpenFull={() => selectFromTree(familySelectedNode.id)} />
                  : <span style={styles.bookBottomHint}>Elegí un objeto para ver su detalle.</span>}
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
              <div style={{ ...styles.bookPage, overflowY: "auto" }}>
                {selected && selectedBlock ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <h2 style={{ ...styles.bookPageTitle, margin: 0 }}>{selected.name}</h2>
                      <X size={14} style={{ cursor: "pointer", color: "#b04848", flexShrink: 0 }} onClick={() => deleteNode(selected.id)} />
                    </div>
                    <span style={{ ...styles.catalogLink, display: "inline-block", marginBottom: 10 }} onClick={() => navigateToId(selected.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                      Abrir página completa →
                    </span>

                    {selectedIsGear && cloneItemStats && (
                      <CloneFromPicker options={cloneOptions} onPick={(sourceId) => cloneItemStats(selected.id, sourceId)} />
                    )}

                    <ItemStatsBlock block={selectedBlock} nodes={nodes} updateBlock={updateSelectedBlock} addSkillItem={addSkillItem} nodeId={selected.id} />

                    <div style={{ marginTop: 18 }} />
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
                    <ForgeRecipesBlock block={selectedBlock} nodes={nodes} excludeId={selected.id} updateBlock={updateSelectedBlock} addObjectItem={addObjectItem} />

                    {(selectedBlock.recipes || []).length > 0 && (
                      <>
                        <div style={{ ...styles.bookSectionTitle, marginTop: 16 }}>Camino de mejora</div>
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
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ color: "var(--muted)", fontStyle: "italic", margin: "auto" }}>Elige un objeto de la lista.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
