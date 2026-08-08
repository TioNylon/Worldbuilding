import { useState, useEffect, useMemo } from "react";
import { Plus, X, BookOpen, Shield } from "lucide-react";
import { ATTR_FIELDS, COMBAT_STAT_FIELDS } from "../data/statFields.js";
import { BOOK_TAB_COLORS } from "../data/theme.js";
import { getPageBlocks } from "../utils/blocks.js";
import { buildTalentGraph } from "../utils/graph.js";
import { keyActivate, skillTypeIcon } from "../utils/misc.js";
import { targetSummary } from "../utils/stats.js";
import { styles } from "../styles.js";
import { activeRoles, setActiveRoles } from "../state/globals.js";
import { Accordion } from "../components/Accordion.jsx";
import { ConfigListPicker } from "../components/ConfigListPicker.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { QuickCreateButton } from "../components/QuickCreateButton.jsx";
import { useModals } from "../components/Modals.jsx";
import { TalentNodeDetail, TalentTreeGraph } from "./TalentTreeGraph.jsx";

// Fila de habilidad en la página de "Habilidades": ícono según tipo + nombre +
// tipo, en vez de la pestaña inferior que había antes (ahora la lista vive en
// su propia página del libro). Exportada: la reusa CharacterBookView.
export function SkillListRow({ skill, block, onOpen }) {
  const Icon = skillTypeIcon(block?.skillType);
  return (
    <div style={styles.bookSkillRow} onClick={onOpen} role="button" tabIndex={0} onKeyDown={keyActivate}>
      <Icon size={14} />
      <span style={{ flex: 1 }}>{skill.name}</span>
      <span style={styles.bookSkillRowType}>{targetSummary(block)}</span>
      <span style={styles.bookSkillRowType}>{block?.skillType || "—"}</span>
    </div>
  );
}

// Pestaña lateral de subclase (izquierda del libro) o el pseudo-tab "Base" que
// vuelve a la clase madre. Cada subclase muestra el ícono del arma que la
// despierta, si tiene una asignada, para verlo sin entrar.
function SubclassRail({ subclasses, activeSubclassId, onSelectBase, onSelectSubclass, onAdd, onDelete, isMobile, baseName }) {
  return (
    <div style={isMobile ? styles.bookLeftRailMobile : styles.bookLeftRail}>
      <div
        style={{ ...(isMobile ? styles.bookLeftTabMobile : styles.bookLeftTab), background: "#cda254", ...(!activeSubclassId ? styles.bookLeftTabActive : {}) }}
        onClick={onSelectBase} title={baseName} role="button" tabIndex={0} onKeyDown={keyActivate}>
        <BookOpen size={11} /> <span>Base</span>
      </div>
      {subclasses.map((s, i) => (
        <div key={s.id}
          style={{ ...(isMobile ? styles.bookLeftTabMobile : styles.bookLeftTab), background: BOOK_TAB_COLORS[i % BOOK_TAB_COLORS.length], ...(s.id === activeSubclassId ? styles.bookLeftTabActive : {}) }}
          onClick={() => onSelectSubclass(s.id)} title={s.awakenWeaponId ? "Tiene arma que la despierta" : undefined} role="button" tabIndex={0} onKeyDown={keyActivate}>
          <span>{s.name}</span>
          {s.awakenWeaponId && <span style={{ fontSize: 11 }}>🗡️</span>}
          <X size={10} style={styles.bookTabRemove} onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} />
        </div>
      ))}
      <button style={isMobile ? styles.bookAddLeftTabMobile : styles.bookAddLeftTab} onClick={onAdd} title="Agregar subclase">
        <Plus size={12} />
      </button>
    </div>
  );
}

export function ClassBookView({ nodes, navigateToId, updateNode, addClass, addSubclass, addSkillForClass, cloneClassStats, addObjectItem, deleteNode, isMobile }) {
  const { promptValue } = useModals();
  const allClasses = useMemo(() => nodes.filter((n) => n.category === "class"), [nodes]);
  const classes = useMemo(
    () => allClasses.filter((c) => !c.parentClassId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
    [allClasses]
  );
  const [activeId, setActiveId] = useState(classes[0]?.id || null);
  useEffect(() => {
    if (!classes.some((c) => c.id === activeId)) setActiveId(classes[0]?.id || null);
  }, [classes, activeId]);

  const active = classes.find((c) => c.id === activeId) || null;

  // activeSubclassId recuerda qué subclase se está mirando sin salir del
  // libro de la clase madre — ya no hay "page" (info/skills), es una sola
  // ficha con el árbol de talentos adentro.
  const [activeSubclassId, setActiveSubclassId] = useState(null);
  useEffect(() => { setActiveSubclassId(null); }, [activeId]);

  const subclasses = useMemo(
    () => (active ? allClasses.filter((c) => c.parentClassId === active.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)) : []),
    [allClasses, active]
  );
  useEffect(() => {
    if (activeSubclassId && !subclasses.some((s) => s.id === activeSubclassId)) setActiveSubclassId(null);
  }, [subclasses, activeSubclassId]);

  const shown = (activeSubclassId && subclasses.find((s) => s.id === activeSubclassId)) || active;

  const [descDraft, setDescDraft] = useState(shown?.classDescription || "");
  const [restrDraft, setRestrDraft] = useState(shown?.classRestrictions || "");
  useEffect(() => {
    setDescDraft(shown?.classDescription || "");
    setRestrDraft(shown?.classRestrictions || "");
  }, [shown?.id]);

  // Árbol de talentos de shown (clase base o subclase activa) — cada una
  // tiene el suyo separado, no hereda ni mezcla con la clase madre.
  const skills = useMemo(() => {
    if (!shown) return [];
    return nodes.filter((n) => n.category === "skill" && getPageBlocks(n).some((b) => b.type === "skillInfo" && b.usableBy === shown.id));
  }, [nodes, shown]);
  const skillIds = useMemo(() => new Set(skills.map((s) => s.id)), [skills]);
  const talentRoots = useMemo(() => {
    return skills.filter((s) => {
      const b = getPageBlocks(s).find((x) => x.type === "skillInfo");
      return !b?.prereqSkillId || !skillIds.has(b.prereqSkillId);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [skills, skillIds]);
  const talentGraph = useMemo(() => buildTalentGraph(talentRoots, skills), [talentRoots, skills]);
  const [talentSelectedId, setTalentSelectedId] = useState(null);
  useEffect(() => {
    if (!talentGraph.nodesById.has(talentSelectedId)) setTalentSelectedId(talentRoots[0]?.id || null);
  }, [talentGraph, talentRoots, talentSelectedId]);
  const talentSelectedNode = talentSelectedId ? talentGraph.nodesById.get(talentSelectedId) : null;

  const weaponOptions = useMemo(
    () => nodes.filter((n) => n.category === "object").map((n) => ({ id: n.id, label: n.name })),
    [nodes]
  );
  const cloneOptions = useMemo(
    () => classes.filter((c) => c.id !== shown?.id).map((c) => ({ id: c.id, label: c.name })),
    [classes, shown]
  );
  const [cloneNote, setCloneNote] = useState(null);
  function handleClone(sourceId) {
    if (!shown || !cloneClassStats) return;
    cloneClassStats(shown.id, sourceId);
    setCloneNote(nodes.find((n) => n.id === sourceId)?.name || null);
  }

  function selectClass(id) {
    setActiveId(id);
    setActiveSubclassId(null);
  }
  async function handleAddClass() {
    const name = await promptValue("Nombre de la nueva clase:");
    if (!name) return;
    selectClass(addClass(name));
  }
  async function handleAddSubclass() {
    if (!active) return;
    const name = await promptValue("Nombre de la nueva subclase:");
    if (!name) return;
    setActiveSubclassId(addSubclass(active.id, name));
  }
  async function handleAddSkill() {
    if (!shown) return;
    const name = await promptValue("Nombre de la nueva habilidad:");
    if (!name) return;
    navigateToId(addSkillForClass(shown.id, name));
  }
  function handleAddTalentChild(parentId, name) {
    if (!shown) return;
    const newId = addSkillForClass(shown.id, name, parentId);
    setTalentSelectedId(newId);
  }
  function setBonus(key, value) {
    if (!shown) return;
    const n = value === "" || value === "-" ? 0 : parseInt(value, 10);
    updateNode(shown.id, { classBonuses: { ...(shown.classBonuses || {}), [key]: Number.isNaN(n) ? 0 : n } });
  }

  if (!active) {
    return (
      <div style={styles.bookOuter}>
        <div style={styles.bookEmptyState}>
          <BookOpen size={40} color="var(--accent)" />
          <p>Todavía no hay clases. Creá la primera para empezar el libro.</p>
          <button style={styles.bookAddClassBtn} onClick={handleAddClass}><Plus size={14} /> Nueva clase</button>
        </div>
      </div>
    );
  }

  const bonuses = shown.classBonuses || {};
  const activeBonusFields = [...ATTR_FIELDS, ...COMBAT_STAT_FIELDS].filter(([k]) => (bonuses[k] || 0) !== 0);

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookTopTabs}>
        {classes.map((c, i) => (
          <div key={c.id}
            style={{ ...styles.bookTab, background: BOOK_TAB_COLORS[i % BOOK_TAB_COLORS.length], ...(c.id === active.id ? styles.bookTabActive : {}) }}
            onClick={() => selectClass(c.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
            <span>{c.name}</span>
            <X size={11} style={styles.bookTabRemove} onClick={(e) => { e.stopPropagation(); deleteNode(c.id); }} />
          </div>
        ))}
        <button style={styles.bookAddTab} onClick={handleAddClass} title="Agregar clase"><Plus size={13} /></button>
      </div>

      {isMobile && (
        <SubclassRail subclasses={subclasses} activeSubclassId={activeSubclassId} baseName={active.name}
          onSelectBase={() => setActiveSubclassId(null)} onSelectSubclass={(id) => setActiveSubclassId(id)}
          onAdd={handleAddSubclass} onDelete={deleteNode} isMobile />
      )}

      <div style={styles.bookBody}>
        {!isMobile && (
          <SubclassRail subclasses={subclasses} activeSubclassId={activeSubclassId} baseName={active.name}
            onSelectBase={() => setActiveSubclassId(null)} onSelectSubclass={(id) => setActiveSubclassId(id)}
            onAdd={handleAddSubclass} onDelete={deleteNode} isMobile={false} />
        )}

        <div style={styles.bookFrame}>
          <div style={{ ...styles.bookSpread, flexDirection: "column" }}>
            <div style={{ ...styles.bookPage, overflowY: "auto" }}>
              <div style={{ display: "flex", gap: 22, flexDirection: isMobile ? "column" : "row" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ ...styles.bookPageTitle, textAlign: "left", margin: "0 0 4px" }}>{shown.name}</h2>
                  {shown.id !== active.id && <div style={{ ...styles.bookSubclassHint, textAlign: "left", marginTop: 0 }}>Subclase de {active.name}</div>}
                  <div style={{ display: "flex", marginTop: 8 }}>
                    <ConfigListPicker list={activeRoles} setList={setActiveRoles} multi
                      value={shown.classRoles || []} onChange={(v) => updateNode(shown.id, { classRoles: v })}
                      icon={Shield} placeholder="+ rol…" />
                  </div>
                  <textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)}
                    onBlur={() => updateNode(shown.id, { classDescription: descDraft })}
                    placeholder="Describe esta clase: filosofía, historia, cómo pelea…"
                    style={{ ...styles.bookTextarea, minHeight: 80, flex: "none", marginTop: 10 }} />
                </div>
                {cloneClassStats && (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...styles.statsIncidenceTitle2, marginTop: 0 }}>Clonar de…</div>
                    <SearchSelect options={cloneOptions} value={null} onChange={(id) => id && handleClone(id)} placeholder="Buscar clase base…" />
                    {cloneNote && (
                      <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 6 }}>
                        ✓ Clon de <b>{cloneNote}</b> — roles y bonificaciones copiados.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {shown.id !== active.id && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ ...styles.statsIncidenceTitle2, marginTop: 0 }}>Arma que despierta esta subclase</div>
                  {shown.awakenWeaponId ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                      🗡️ <b>{nodes.find((n) => n.id === shown.awakenWeaponId)?.name || "?"}</b>
                      <X size={12} style={{ cursor: "pointer", opacity: 0.6 }} onClick={() => updateNode(shown.id, { awakenWeaponId: null })} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, maxWidth: 280 }}>
                      <div style={{ flex: 1 }}>
                        <SearchSelect options={weaponOptions} value={null} onChange={(id) => id && updateNode(shown.id, { awakenWeaponId: id })} placeholder="Sin arma — elegí una…" />
                      </div>
                      {addObjectItem && (
                        <QuickCreateButton title="Crear arma nueva y asignarla"
                          onCreate={(name) => addObjectItem(name, { nodeId: shown.id, apply: (n, newId) => ({ ...n, awakenWeaponId: newId }) })} />
                      )}
                    </div>
                  )}
                </div>
              )}

              <Accordion title="Bonificaciones" defaultOpen={false}
                summary={
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    {activeBonusFields.length === 0 && <span style={styles.bookBottomHint}>Sin bonificaciones configuradas.</span>}
                    {activeBonusFields.map(([k, label]) => (
                      <span key={k} style={{ ...styles.pillBtn, cursor: "default" }}>
                        {label} <b style={{ color: "var(--accent)" }}>{bonuses[k] > 0 ? `+${bonuses[k]}` : bonuses[k]}</b>
                      </span>
                    ))}
                  </div>
                }>
                <div style={styles.bookBonusGrid}>
                  {ATTR_FIELDS.map(([k, label]) => (
                    <label key={k} style={styles.bookBonusField}>
                      <span>{label}</span>
                      <input type="number" value={bonuses[k] ?? 0} onChange={(e) => setBonus(k, e.target.value)} style={styles.bookBonusInput} />
                    </label>
                  ))}
                  {COMBAT_STAT_FIELDS.map(([k, label]) => (
                    <label key={k} style={styles.bookBonusField}>
                      <span>{label}</span>
                      <input type="number" value={bonuses[k] ?? 0} onChange={(e) => setBonus(k, e.target.value)} style={styles.bookBonusInput} />
                    </label>
                  ))}
                </div>
                <div style={{ ...styles.statsIncidenceTitle2, marginTop: 14 }}>Restricciones</div>
                <textarea value={restrDraft} onChange={(e) => setRestrDraft(e.target.value)}
                  onBlur={() => updateNode(shown.id, { classRestrictions: restrDraft })}
                  placeholder="Ej. solo armas ligeras, sin armaduras pesadas…"
                  style={{ ...styles.bookTextarea, minHeight: 60, flex: "none" }} />
              </Accordion>

              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ ...styles.bookSectionTitle, margin: 0 }}>Árbol de talentos</div>
                  <span style={{ fontSize: 10.5, color: "var(--muted2, var(--muted))" }}>Pasá el mouse sobre un nodo para agregar el siguiente</span>
                </div>
                {skills.length === 0 ? (
                  <span style={styles.bookBottomHint}>Sin habilidades todavía.</span>
                ) : (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
                    <div style={{ overflowX: "auto", flex: "1 1 400px" }}>
                      <TalentTreeGraph graph={talentGraph} selectedId={talentSelectedId} onSelect={setTalentSelectedId} onAddChild={handleAddTalentChild} />
                    </div>
                    <div style={{ width: 220, flexShrink: 0 }}>
                      {talentSelectedNode
                        ? <TalentNodeDetail node={talentSelectedNode} edges={talentGraph.edges} allSkills={skills} onOpenFull={() => navigateToId(talentSelectedNode.id)} />
                        : <span style={styles.bookBottomHint}>Elegí una habilidad del árbol.</span>}
                    </div>
                  </div>
                )}
                <button style={{ ...styles.bookAddClassBtn, marginTop: 12, alignSelf: "flex-start" }} onClick={handleAddSkill}>
                  <Plus size={14} /> Nueva habilidad {skills.length === 0 ? "" : "(raíz nueva)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
