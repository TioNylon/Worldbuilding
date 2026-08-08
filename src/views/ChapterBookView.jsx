import { useState, useEffect, useMemo } from "react";
import { Plus, ChevronRight, ChevronLeft, X, ScrollText, Landmark, CalendarDays, Target, UserRound, Compass, MessageSquare } from "lucide-react";
import { ENTRY_TYPES } from "../data/entryTypes.js";
import { CHAPTER_BOOK_PAGES } from "../data/pageSections.js";
import { BOOK_TAB_COLORS } from "../data/theme.js";
import { getPageBlocks } from "../utils/blocks.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { useModals } from "../components/Modals.jsx";
import { BeatInfoBlock } from "../blocks/BeatInfoBlock.jsx";

// Una sección de listado dentro de una página del Libro de historia: entradas
// de una categoría (Lugar/Acontecimiento/Misión/NPC) ya asignadas a este
// capítulo (clic = ir a su página completa, con su Causa y efecto/relaciones/
// lo que tenga), más un selector para asignar una existente y un botón para
// crear una nueva ya asignada. Quitar del capítulo (X) sólo desasigna —
// nunca borra la página, a diferencia de los otros libros.
export function ChapterEntryList({ nodes, chapterId, category, icon: Icon, addEntry, updateNode, navigateToId }) {
  const { promptValue } = useModals();
  const label = ENTRY_TYPES[category]?.label || category;
  const newLabel = category === "mission" ? `Nueva ${label}` : `Nuevo ${label}`;
  const pluralLabel = { place: "Lugares", event: "Acontecimientos", mission: "Misiones", npc: "NPC" }[category] || `${label}s`;
  const assigned = useMemo(
    () => nodes.filter((n) => n.category === category && n.chapterId === chapterId).sort((a, b) => a.name.localeCompare(b.name)),
    [nodes, category, chapterId]
  );
  const unassigned = useMemo(
    () => nodes.filter((n) => n.category === category && n.chapterId !== chapterId).sort((a, b) => a.name.localeCompare(b.name)),
    [nodes, category, chapterId]
  );
  const [pickId, setPickId] = useState("");

  function handleAssign() {
    if (!pickId) return;
    updateNode(pickId, { chapterId });
    setPickId("");
  }
  async function handleAddNew() {
    const name = await promptValue(`Nombre: ${newLabel}`);
    if (!name) return;
    addEntry(category, chapterId, name);
  }

  return (
    <>
      <div style={styles.bookSectionTitle}>{pluralLabel}</div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, minHeight: 60 }}>
        {assigned.length === 0 && <span style={styles.bookBottomHint}>Nada asignado todavía.</span>}
        {assigned.map((n) => (
          <div key={n.id} style={styles.bookSkillRow} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
            <Icon size={14} />
            <span style={{ flex: 1 }}>{n.name}</span>
            <X size={12} style={{ opacity: 0.55, flexShrink: 0 }} title="Quitar del capítulo"
              onClick={(e) => { e.stopPropagation(); updateNode(n.id, { chapterId: null }); }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <select value={pickId} onChange={(e) => setPickId(e.target.value)} style={{ ...styles.statsInput, flex: 1 }}>
          <option value="">— agregar existente —</option>
          {unassigned.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <button style={styles.pillBtn} onClick={handleAssign}>Agregar</button>
      </div>
      <button style={{ ...styles.bookAddClassBtn, marginTop: 6, alignSelf: "flex-start" }} onClick={handleAddNew}>
        <Plus size={12} /> {newLabel}
      </button>
    </>
  );
}

export function ChapterBookView({ nodes, navigateToId, updateNode, addChapter, addChapterEntry, addBeat, addScene, navigateByName, deleteNode, isMobile }) {
  const { promptValue } = useModals();
  const chapters = useMemo(
    () => nodes.filter((n) => n.category === "chapter").sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
    [nodes]
  );
  const [activeId, setActiveId] = useState(chapters[0]?.id || null);
  useEffect(() => {
    if (!chapters.some((c) => c.id === activeId)) setActiveId(chapters[0]?.id || null);
  }, [chapters, activeId]);
  const active = chapters.find((c) => c.id === activeId) || null;

  const [page, setPage] = useState("lugares");
  useEffect(() => { setPage("lugares"); }, [activeId]);
  function turnPage(dir) {
    const idx = CHAPTER_BOOK_PAGES.indexOf(page);
    setPage(CHAPTER_BOOK_PAGES[(idx + dir + CHAPTER_BOOK_PAGES.length) % CHAPTER_BOOK_PAGES.length]);
  }

  const beatsInChapter = useMemo(() => {
    if (!active) return [];
    return nodes.filter((n) => n.category === "beat" && getPageBlocks(n).some((b) => b.type === "beatInfo" && b.chapterId === active.id))
      .sort((a, b) => {
        const ba = getPageBlocks(a).find((x) => x.type === "beatInfo");
        const bb = getPageBlocks(b).find((x) => x.type === "beatInfo");
        return (ba?.order ?? 0) - (bb?.order ?? 0) || a.name.localeCompare(b.name);
      });
  }, [nodes, active]);
  const [activeBeatId, setActiveBeatId] = useState(null);
  useEffect(() => { setActiveBeatId(null); }, [activeId]);
  useEffect(() => {
    if (!beatsInChapter.some((b) => b.id === activeBeatId)) setActiveBeatId(beatsInChapter[0]?.id || null);
  }, [beatsInChapter, activeBeatId]);
  const activeBeat = beatsInChapter.find((b) => b.id === activeBeatId) || null;
  const activeBeatBlock = activeBeat ? getPageBlocks(activeBeat).find((b) => b.type === "beatInfo") : null;
  const scenesInBeat = useMemo(() => {
    if (!activeBeat) return [];
    return nodes.filter((n) => n.category === "scene" && getPageBlocks(n).some((b) => b.type === "sceneInfo" && b.beatId === activeBeat.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes, activeBeat]);

  function updateActiveBeatBlock(blockId, patch) {
    if (!activeBeat) return;
    updateNode(activeBeat.id, { blocks: getPageBlocks(activeBeat).map((b) => (b.id === blockId ? { ...b, ...patch } : b)) });
  }
  async function handleAddChapter() {
    const name = await promptValue("Nombre del nuevo capítulo:");
    if (!name) return;
    setActiveId(addChapter(name));
  }
  async function handleAddBeat() {
    if (!active) return;
    const name = await promptValue("Nombre del nuevo beat:");
    if (!name) return;
    setActiveBeatId(addBeat(active.id, name));
  }
  async function handleAddScene() {
    if (!activeBeat) return;
    const name = await promptValue("Nombre de la nueva escena:");
    if (!name) return;
    navigateToId(addScene(activeBeat.id, name));
  }

  if (!active) {
    return (
      <div style={styles.bookOuter}>
        <div style={styles.bookEmptyState}>
          <Compass size={40} color="var(--accent)" />
          <p>Todavía no hay capítulos. Creá el primero para empezar la historia.</p>
          <button style={styles.bookAddClassBtn} onClick={handleAddChapter}><Plus size={14} /> Nuevo capítulo</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookTopTabs}>
        {chapters.map((c, i) => (
          <div key={c.id}
            style={{ ...styles.bookTab, background: BOOK_TAB_COLORS[i % BOOK_TAB_COLORS.length], ...(c.id === active.id ? styles.bookTabActive : {}) }}
            onClick={() => setActiveId(c.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
            <span>{c.name}</span>
            <X size={11} style={styles.bookTabRemove} onClick={(e) => { e.stopPropagation(); deleteNode(c.id); }} />
          </div>
        ))}
        <button style={styles.bookAddTab} onClick={handleAddChapter} title="Agregar capítulo"><Plus size={13} /></button>
      </div>

      <div style={styles.bookBody}>
        <div style={styles.bookFrame}>
          {page === "lugares" ? (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                <h2 style={styles.bookPageTitle}>{active.name}</h2>
                <ChapterEntryList nodes={nodes} chapterId={active.id} category="place" icon={Landmark}
                  addEntry={addChapterEntry} updateNode={updateNode} navigateToId={navigateToId} />
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                <ChapterEntryList nodes={nodes} chapterId={active.id} category="event" icon={CalendarDays}
                  addEntry={addChapterEntry} updateNode={updateNode} navigateToId={navigateToId} />
              </div>
              <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => turnPage(1)} title="Ver misiones y NPC" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronRight size={18} />
              </div>
            </div>
          ) : page === "misiones" ? (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                <ChapterEntryList nodes={nodes} chapterId={active.id} category="mission" icon={Target}
                  addEntry={addChapterEntry} updateNode={updateNode} navigateToId={navigateToId} />
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                <ChapterEntryList nodes={nodes} chapterId={active.id} category="npc" icon={UserRound}
                  addEntry={addChapterEntry} updateNode={updateNode} navigateToId={navigateToId} />
              </div>
              <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => turnPage(-1)} title="Volver" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronLeft size={18} />
              </div>
              <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => turnPage(1)} title="Ver guion" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronRight size={18} />
              </div>
            </div>
          ) : (
            <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
              <div style={styles.bookPage}>
                <h2 style={styles.bookPageTitle}>Guion</h2>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {beatsInChapter.length === 0 && <span style={styles.bookBottomHint}>Sin beats todavía en este capítulo.</span>}
                  {beatsInChapter.map((b) => (
                    <div key={b.id}
                      style={{ ...styles.bookSkillRow, ...(b.id === activeBeatId ? { background: "color-mix(in srgb, var(--accent) 16%, transparent)" } : {}) }}
                      onClick={() => setActiveBeatId(b.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                      <ScrollText size={14} />
                      <span style={{ flex: 1 }}>{b.name}</span>
                    </div>
                  ))}
                </div>
                <button style={{ ...styles.bookAddClassBtn, alignSelf: "flex-start", marginTop: 10 }} onClick={handleAddBeat}>
                  <Plus size={14} /> Nuevo beat
                </button>
              </div>
              {!isMobile && <div style={styles.bookSpine} />}
              <div style={styles.bookPage}>
                {activeBeat && activeBeatBlock ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <h2 style={{ ...styles.bookPageTitle, margin: 0 }}>{activeBeat.name}</h2>
                      <X size={14} style={{ cursor: "pointer", color: "#b04848", flexShrink: 0 }} onClick={() => deleteNode(activeBeat.id)} />
                    </div>
                    <div style={{ overflowY: "auto", flex: 1 }}>
                      <BeatInfoBlock block={activeBeatBlock} nodes={nodes} navigateByName={navigateByName} updateBlock={updateActiveBeatBlock} />
                      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Escenas</div>
                      {scenesInBeat.length === 0 && <span style={styles.bookBottomHint}>Sin escenas todavía.</span>}
                      {scenesInBeat.map((s) => (
                        <div key={s.id} style={styles.bookSkillRow} onClick={() => navigateToId(s.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                          <MessageSquare size={14} />
                          <span style={{ flex: 1 }}>{s.name}</span>
                        </div>
                      ))}
                      <button style={{ ...styles.pillBtn, alignSelf: "flex-start", marginTop: 8 }} onClick={handleAddScene}>
                        <Plus size={12} /> Nueva escena
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ color: "var(--muted)", fontStyle: "italic", margin: "auto" }}>Elige un beat de la lista.</div>
                )}
              </div>
              <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => turnPage(-1)} title="Volver" role="button" tabIndex={0} onKeyDown={keyActivate}>
                <ChevronLeft size={18} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
