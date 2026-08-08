import { useState, useEffect, useMemo } from "react";
import { Plus, ChevronRight, ChevronLeft, X, BookOpen, Shield } from "lucide-react";
import { ATTR_FIELDS, COMBAT_STAT_FIELDS } from "../data/statFields.js";
import { BOOK_TAB_COLORS } from "../data/theme.js";
import { getPageBlocks } from "../utils/blocks.js";
import { keyActivate, skillTypeIcon } from "../utils/misc.js";
import { targetSummary } from "../utils/stats.js";
import { styles } from "../styles.js";
import { activeRoles, setActiveRoles } from "../state/globals.js";
import { ConfigListPicker } from "../components/ConfigListPicker.jsx";
import { useModals } from "../components/Modals.jsx";

// Fila de habilidad en la página de "Habilidades": ícono según tipo + nombre +
// tipo, en vez de la pestaña inferior que había antes (ahora la lista vive en
// su propia página del libro).
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

// Nodo recursivo del árbol de talentos de una Clase/Subclase: la habilidad y,
// debajo e indentadas, las que la tienen como prerrequisito. Guardia de
// ciclos por si alguien arma un prerrequisito circular por error.
export function TalentTreeNode({ skill, skillsForTree, onOpen, ancestors }) {
  const block = getPageBlocks(skill).find((b) => b.type === "skillInfo");
  const Icon = skillTypeIcon(block?.skillType);
  const cost = block?.pointCost ?? 1;
  const children = skillsForTree.filter((s) => {
    const b = getPageBlocks(s).find((x) => x.type === "skillInfo");
    return b?.prereqSkillId === skill.id && !ancestors.has(s.id);
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ ...styles.bookSkillRow, width: "fit-content" }} onClick={onOpen ? () => onOpen(skill.id) : undefined} role="button" tabIndex={0} onKeyDown={keyActivate}>
        <Icon size={14} />
        <span>{skill.name}</span>
        <span style={styles.bookSkillRowType}>{cost} pt{cost === 1 ? "" : "s"}</span>
      </div>
      {children.length > 0 && (
        <div style={{ marginLeft: 20, paddingLeft: 14, borderLeft: "2px solid color-mix(in srgb, var(--accent) 30%, transparent)", display: "flex", flexDirection: "column", gap: 10 }}>
          {children.map((c) => (
            <TalentTreeNode key={c.id} skill={c} skillsForTree={skillsForTree} onOpen={onOpen}
              ancestors={new Set([...ancestors, skill.id])} />
          ))}
        </div>
      )}
    </div>
  );
}

// Pestaña lateral de subclase (izquierda del libro) o el pseudo-tab "Base" que
// vuelve a la clase madre. Mismo lenguaje visual que las pestañas superiores de
// clase, pero orientadas hacia el lado (o en fila arriba del libro en móvil).
export function SubclassRail({ subclasses, activeSubclassId, onSelectBase, onSelectSubclass, onAdd, onDelete, isMobile, baseName }) {
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
          onClick={() => onSelectSubclass(s.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
          <span>{s.name}</span>
          <X size={10} style={styles.bookTabRemove} onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} />
        </div>
      ))}
      <button style={isMobile ? styles.bookAddLeftTabMobile : styles.bookAddLeftTab} onClick={onAdd} title="Agregar subclase">
        <Plus size={12} />
      </button>
    </div>
  );
}

export function ClassBookView({ nodes, navigateToId, updateNode, addClass, addSubclass, addSkillForClass, deleteNode, isMobile }) {
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

  // "page" es la página abierta del libro (info de la clase/subclase, o el
  // listado de habilidades); activeSubclassId recuerda qué subclase se está
  // mirando sin salir del libro de la clase madre.
  const [page, setPage] = useState("info");
  const [activeSubclassId, setActiveSubclassId] = useState(null);
  useEffect(() => { setPage("info"); setActiveSubclassId(null); }, [activeId]);

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

  // Filtra por shown (clase base o subclase activa), no por active: cada
  // subclase tiene su propio árbol de talentos, separado del de la clase
  // madre, en vez de heredar o mezclar sus habilidades.
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

  function selectClass(id) {
    setActiveId(id);
    setActiveSubclassId(null);
    setPage("info");
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
    setPage("info");
  }
  async function handleAddSkill() {
    if (!shown) return;
    const name = await promptValue("Nombre de la nueva habilidad:");
    if (!name) return;
    navigateToId(addSkillForClass(shown.id, name));
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
          onSelectBase={() => { setActiveSubclassId(null); setPage("info"); }}
          onSelectSubclass={(id) => { setActiveSubclassId(id); setPage("info"); }}
          onAdd={handleAddSubclass} onDelete={deleteNode} isMobile />
      )}

      <div style={styles.bookBody}>
        {!isMobile && (
          <SubclassRail subclasses={subclasses} activeSubclassId={activeSubclassId} baseName={active.name}
            onSelectBase={() => { setActiveSubclassId(null); setPage("info"); }}
            onSelectSubclass={(id) => { setActiveSubclassId(id); setPage("info"); }}
            onAdd={handleAddSubclass} onDelete={deleteNode} isMobile={false} />
        )}

        <div style={styles.bookFrame}>
          {page === "info" ? (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                <h2 style={styles.bookPageTitle}>{shown.name}</h2>
                {shown.id !== active.id && (
                  <div style={styles.bookSubclassHint}>Subclase de {active.name}</div>
                )}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <ConfigListPicker list={activeRoles} setList={setActiveRoles} multi
                    value={shown.classRoles || []} onChange={(v) => updateNode(shown.id, { classRoles: v })}
                    icon={Shield} placeholder="+ rol…" />
                </div>
                <textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={() => updateNode(shown.id, { classDescription: descDraft })}
                  placeholder="Describe esta clase: filosofía, historia, cómo pelea…"
                  style={styles.bookTextarea} />
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                <div style={styles.bookSectionTitle}>Bonificaciones</div>
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
                <div style={{ ...styles.bookSectionTitle, marginTop: 14 }}>Restricciones</div>
                <textarea value={restrDraft} onChange={(e) => setRestrDraft(e.target.value)}
                  onBlur={() => updateNode(shown.id, { classRestrictions: restrDraft })}
                  placeholder="Ej. solo armas ligeras, sin armaduras pesadas…"
                  style={{ ...styles.bookTextarea, minHeight: 70, flex: "none" }} />
              </div>
              <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => setPage("skills")} title="Ver habilidades" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronRight size={18} />
              </div>
            </div>
          ) : (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ ...styles.bookPage, overflowY: "auto" }}>
                <h2 style={styles.bookPageTitle}>Árbol de talentos</h2>
                {skills.length === 0 ? (
                  <span style={styles.bookBottomHint}>Sin habilidades todavía.</span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {talentRoots.map((s) => (
                      <TalentTreeNode key={s.id} skill={s} skillsForTree={skills} onOpen={navigateToId} ancestors={new Set()} />
                    ))}
                  </div>
                )}
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                <div style={styles.bookSectionTitle}>Habilidades de {shown.name}</div>
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
                  Cada habilidad puede requerir otra como prerrequisito y tener su propio costo en
                  puntos — eso arma el árbol de la izquierda. Toca una para abrir su página, o
                  agregá una nueva ya restringida a {shown.id === active.id ? "esta clase" : "esta subclase"}.
                </p>
                <button style={{ ...styles.bookAddClassBtn, alignSelf: "flex-start" }} onClick={handleAddSkill}>
                  <Plus size={14} /> Nueva habilidad
                </button>
              </div>
              <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => setPage("info")} title="Volver" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronLeft size={18} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
