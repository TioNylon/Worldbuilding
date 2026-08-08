import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, ScrollText, LayoutDashboard } from "lucide-react";
import { ENTRY_TYPES } from "../data/entryTypes.js";
import { bottomOf, getPageBlocks, isSingleImageBlockType, makeBlock } from "../utils/blocks.js";
import { keyActivate, scanTextOf, snapPx } from "../utils/misc.js";
import { deleteImage } from "../storage.js";
import { styles } from "../styles.js";
import { BlockPalette } from "../components/BlockPalette.jsx";
import { CoverImage } from "../components/CoverImage.jsx";
import { EntryTypePicker } from "../components/EntryTypePicker.jsx";
import { LinkPicker } from "../components/LinkPicker.jsx";
import { ScenePaletteEditor } from "../components/ScenePaletteEditor.jsx";
import { TagEditor } from "../components/TagEditor.jsx";
import { CanvasItem } from "../blocks/CanvasItem.jsx";
import { CharacterClassPicker, CharacterSymbiontPicker } from "../blocks/ClassSummaryBlock.jsx";
import { BoardEditor } from "./BoardEditor.jsx";
import { FolderView } from "./FolderView.jsx";
import { MapEditor } from "./MapEditor.jsx";
import { TimelineEditor } from "./TimelineEditor.jsx";

/* ---------- VISTA DE UNA ENTRADA (según su tipo) ---------- */
// Centraliza el switch por tipo de nodo para poder reutilizarlo tanto en la
// vista principal como en cada mitad del panel de Comparar páginas.
export function EntryView({ node, nodes, updateNode, updateNodeWithLinks, renameNode, navigateByName, navigateToId, isMobile, typeTemplates, addNode, skin, setSearch }) {
  if (!node) {
    return (
      <div style={styles.emptyState}>
        <ScrollText size={48} color="var(--muted)" />
        <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, color: "var(--muted)", textAlign: "center", padding: "0 20px" }}>
          Selecciona o crea una entrada para comenzar.
        </p>
      </div>
    );
  }
  if (node.type === "page") return <PageEditor node={node} nodes={nodes} updateNode={updateNode} updateNodeWithLinks={updateNodeWithLinks} renameNode={renameNode} navigateByName={navigateByName} isMobile={isMobile} typeTemplates={typeTemplates} setSearch={setSearch} />;
  if (node.type === "map") return <MapEditor node={node} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} isMobile={isMobile} />;
  if (node.type === "folder") return <FolderView node={node} nodes={nodes} addNode={addNode} setSelectedId={navigateToId} updateNode={updateNode} updateNodeWithLinks={updateNodeWithLinks} navigateByName={navigateByName} isMobile={isMobile} skin={skin} />;
  if (node.type === "timeline") return <TimelineEditor node={node} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} isMobile={isMobile} />;
  if (node.type === "board") return <BoardEditor node={node} nodes={nodes} updateNode={updateNode} setSelectedId={navigateToId} isMobile={isMobile} />;
  return null;
}

/* ---------- COMPARAR PÁGINAS (2 entradas lado a lado) ---------- */
export function ComparePanel({ nodes, ids, setIds, updateNode, updateNodeWithLinks, renameNode, addNode, isMobile, typeTemplates, skin, setSearch }) {
  function renderSlot(idx) {
    const id = ids[idx];
    const node = nodes.find((n) => n.id === id) || null;
    function setThisId(newId) {
      setIds((prev) => prev.map((v, i) => (i === idx ? newId : v)));
    }
    function slotNavigateByName(name) {
      const target = nodes.find((n) => n.name.toLowerCase() === name.trim().toLowerCase());
      if (target) setThisId(target.id);
    }
    return (
      <div style={styles.compareSlot}>
        <div style={styles.compareSlotHeader}>
          <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{idx === 0 ? "Página A" : "Página B"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <LinkPicker nodes={nodes} value={id} onChange={setThisId} />
          </div>
        </div>
        <div style={styles.compareSlotBody}>
          <EntryView node={node} nodes={nodes} updateNode={updateNode} updateNodeWithLinks={updateNodeWithLinks}
            renameNode={renameNode}
            navigateByName={slotNavigateByName} navigateToId={setThisId} isMobile={isMobile}
            typeTemplates={typeTemplates} addNode={addNode} skin={skin} setSearch={setSearch} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...styles.compareWrap, flexDirection: isMobile ? "column" : "row" }}>
      {renderSlot(0)}
      <div style={isMobile ? styles.compareDividerH : styles.compareDivider} />
      {renderSlot(1)}
    </div>
  );
}

export function CanvasEditor({ items, mode, nodes, navigateByName, onUpdate, onDelete, onAdd, onMove, isMobile, emptyHint, nodeId }) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [dropActive, setDropActive] = useState(false);

  useEffect(() => {
    function move(e) {
      const d = dragRef.current;
      if (!d || !containerRef.current) return;
      const point = e.touches ? e.touches[0] : e;
      const rect = containerRef.current.getBoundingClientRect();
      const dxPx = point.clientX - d.startX;
      const dyPx = point.clientY - d.startY;
      if (d.mode === "move") {
        const xPx = snapPx((d.orig.x / 100) * rect.width + dxPx);
        const y = snapPx(d.orig.y + dyPx);
        onUpdate(d.id, {
          x: Math.max(0, Math.min(100 - d.orig.w, (xPx / rect.width) * 100)),
          y: Math.max(0, y),
        });
      } else {
        const wPx = snapPx((d.orig.w / 100) * rect.width + dxPx);
        const h = snapPx(d.orig.h + dyPx);
        onUpdate(d.id, {
          w: Math.max(12, Math.min(100 - d.orig.x, (wPx / rect.width) * 100)),
          h: Math.max(60, h),
        });
      }
      if (e.cancelable) e.preventDefault();
    }
    function up() { dragRef.current = null; }
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [onUpdate]);

  function startDrag(itemId, m, e) {
    const it = items.find((x) => x.id === itemId);
    if (!it) return;
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = { id: itemId, mode: m, startX: p.clientX, startY: p.clientY, orig: { x: it.x, y: it.y, w: it.w, h: it.h } };
  }
  function onCanvasDragOver(e) {
    if (!e.dataTransfer.types.includes("text/wb-newblock")) return;
    e.preventDefault(); setDropActive(true);
  }
  function onCanvasDrop(e) {
    setDropActive(false);
    const type = e.dataTransfer.getData("text/wb-newblock");
    if (!type || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const xPx = snapPx(e.clientX - rect.left);
    const x = Math.max(0, Math.min(88, (xPx / rect.width) * 100));
    const y = Math.max(0, snapPx(e.clientY - rect.top));
    onAdd(type, { x, y });
  }

  // El contenido de una entrada (mode="entry") siempre se edita en modo
  // libro, una sección por página — el lienzo libre de acá abajo queda solo
  // para el diseñador de plantillas por tipo (mode="template"), que sigue
  // necesitando posicionar recuadros a mano.
  if (mode === "entry") {
    return (
      <BookPageEditor key={nodeId} items={items} nodes={nodes} navigateByName={navigateByName}
        onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} onMove={onMove}
        emptyHint={emptyHint} nodeId={nodeId} isMobile={isMobile} />
    );
  }

  // En móvil tampoco hay lienzo libre para plantillas: apilar por 'y' y editar en línea.
  if (isMobile) {
    const ordered = [...items].sort((a, b) => (a.y || 0) - (b.y || 0));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ordered.length === 0 && <div style={styles.canvasEmpty}>{emptyHint || "Vacío."}</div>}
        {ordered.map((it) => (
          <CanvasItem key={it.id} item={it} mode={mode} nodes={nodes} navigateByName={navigateByName}
            selected={false} onSelect={() => {}} startDrag={() => {}} onUpdate={onUpdate} onDelete={onDelete} nodeId={nodeId} flowLayout />
        ))}
      </div>
    );
  }

  const canvasHeight = Math.max(220, bottomOf(items) + 60);
  return (
    <div ref={containerRef}
      style={{ ...styles.canvas, height: canvasHeight, ...(dropActive ? { outline: "2px dashed var(--accent)" } : {}) }}
      onMouseDown={() => setSelected(null)}
      onDragOver={onCanvasDragOver} onDragLeave={() => setDropActive(false)} onDrop={onCanvasDrop}>
      {items.length === 0 && <div style={styles.canvasEmpty}>{emptyHint || "Vacío. Usa la paleta para añadir recuadros."}</div>}
      {items.map((it) => (
        <CanvasItem key={it.id} item={it} mode={mode} nodes={nodes} navigateByName={navigateByName}
          selected={selected === it.id} onSelect={() => setSelected(it.id)}
          startDrag={(m, e) => startDrag(it.id, m, e)}
          onUpdate={onUpdate} onDelete={onDelete} nodeId={nodeId} />
      ))}
    </div>
  );
}

/* ---------- MODO LIBRO (contenido de una entrada, una sección por página) ---------- */
// Reemplaza el lienzo libre para mode="entry": cada bloque es una página que
// se pasa con flechas, en vez de un recuadro que hay que arrastrar y
// redimensionar a mano. Al agregar un bloque nuevo (siempre al final de los
// bloques libres, después de los slots de la plantilla si hay) salta
// automáticamente a esa página para que se note que se agregó.
export function BookPageEditor({ items, nodes, navigateByName, onUpdate, onDelete, onAdd, onMove, emptyHint, nodeId, isMobile }) {
  // Arranca en la primera página, como abrir un libro — solo salta sola
  // cuando se agrega un bloque nuevo durante la sesión (para mostrar dónde
  // quedó), no al entrar por primera vez a una página ya existente.
  const [pageIndex, setPageIndex] = useState(0);
  const prevLength = useRef(items.length);
  useEffect(() => {
    if (items.length > prevLength.current) setPageIndex(items.length - 1);
    else if (pageIndex >= items.length) setPageIndex(Math.max(0, items.length - 1));
    prevLength.current = items.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  if (items.length === 0) {
    return <div style={{ ...styles.canvasEmpty, position: "relative", minHeight: 160 }}>{emptyHint || "Vacío."}</div>;
  }
  const clampedIndex = Math.min(pageIndex, items.length - 1);
  const item = items[clampedIndex];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ ...styles.bookFrame, width: "100%" }}>
        <div style={styles.bookSpread}>
          <div style={{ ...styles.bookPage, overflowY: "auto" }}>
            <CanvasItem key={item.id} item={item} mode="entry" nodes={nodes} navigateByName={navigateByName}
              selected={false} onSelect={() => {}} startDrag={() => {}}
              onUpdate={onUpdate} onDelete={onDelete} onMove={onMove} nodeId={nodeId} flowLayout />
          </div>
        </div>
        {clampedIndex > 0 && (
          <div style={{ ...styles.bookPageTurn, left: 10 }} onClick={() => setPageIndex(clampedIndex - 1)} title="Página anterior" role="button" tabIndex={0} onKeyDown={keyActivate}>
            <ChevronLeft size={18} />
          </div>
        )}
        {clampedIndex < items.length - 1 && (
          <div style={{ ...styles.bookPageTurn, right: 10 }} onClick={() => setPageIndex(clampedIndex + 1)} title="Página siguiente" role="button" tabIndex={0} onKeyDown={keyActivate}>
            <ChevronRight size={18} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Página {clampedIndex + 1} de {items.length}</div>
    </div>
  );
}

/* ---------- LIENZO LIBRE (carpetas y páginas sin plantilla) ---------- */
export function FreeBlockCanvas({ node, nodes, updateNodeWithLinks, navigateByName, isMobile }) {
  const blocksRef = useRef(getPageBlocks(node));
  useEffect(() => { blocksRef.current = getPageBlocks(node); }, [node]);
  function commit(next) {
    blocksRef.current = next;
    updateNodeWithLinks(node.id, { blocks: next }, scanTextOf(next, null));
  }
  const items = getPageBlocks(node);
  function addBlock(type, pos) {
    const nb = makeBlock(type);
    nb.x = pos?.x ?? 2;
    nb.y = pos?.y ?? bottomOf(items) + 12;
    commit([...blocksRef.current, nb]);
  }
  function onUpdate(id, patch) { commit(blocksRef.current.map((b) => (b.id === id ? { ...b, ...patch } : b))); }
  function onDelete(id) {
    const b = blocksRef.current.find((x) => x.id === id);
    if (b && isSingleImageBlockType(b.type) && b.imageKey) deleteImage(b.imageKey);
    commit(blocksRef.current.filter((x) => x.id !== id));
  }
  function onMove(id, dir) {
    const cur = blocksRef.current;
    const idx = cur.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= cur.length) return;
    const next = [...cur];
    [next[idx], next[target]] = [next[target], next[idx]];
    commit(next);
  }
  return (
    <div>
      <BlockPalette onAdd={(t) => addBlock(t)} horizontal />
      <div style={{ paddingTop: 10 }}>
        <CanvasEditor items={items} mode="entry" nodes={nodes} navigateByName={navigateByName}
          onUpdate={onUpdate} onDelete={onDelete} onAdd={addBlock} onMove={onMove} isMobile={isMobile} nodeId={node.id}
          emptyHint="Vacío. Arrastra una herramienta a la página o haz clic para añadir un recuadro." />
      </div>
    </div>
  );
}

export function PageEditor({ node, nodes, updateNode, updateNodeWithLinks, renameNode, navigateByName, isMobile, typeTemplates, setSearch }) {
  const [title, setTitle] = useState(node.name);
  useEffect(() => { setTitle(node.name); }, [node.id]);

  const template = node.category && typeTemplates ? typeTemplates[node.category] : null;
  const hasTemplate = !!(template && Array.isArray(template.slots) && template.slots.length);

  // refs para que varias mutaciones seguidas se compongan sin pisarse.
  const blocksRef = useRef(getPageBlocks(node));
  const slotDataRef = useRef(node.slotData || {});
  useEffect(() => { blocksRef.current = getPageBlocks(node); slotDataRef.current = node.slotData || {}; }, [node]);

  function commit(patch) {
    if (patch.blocks) blocksRef.current = patch.blocks;
    if (patch.slotData) slotDataRef.current = patch.slotData;
    updateNodeWithLinks(node.id, patch, scanTextOf(blocksRef.current, slotDataRef.current));
  }

  // Items del lienzo: slots de la plantilla (con overrides de esta entrada) + bloques extra libres.
  const slotItems = hasTemplate ? template.slots.map((s) => {
    const ov = (node.slotData && node.slotData[s.slotId]) || {};
    return { ...s, ...ov, id: `slot:${node.id}:${s.slotId}`, slotId: s.slotId, isSlot: true };
  }) : [];
  const extraItems = getPageBlocks(node).map((b) => ({ ...b, isSlot: false }));
  const items = [...slotItems, ...extraItems];

  function addBlock(type, pos) {
    const nb = makeBlock(type);
    nb.x = pos?.x ?? 2;
    nb.y = pos?.y ?? bottomOf(items) + 12;
    commit({ blocks: [...blocksRef.current, nb] });
  }
  function onUpdate(itemId, patch) {
    if (itemId.startsWith("slot:")) {
      const slotId = itemId.split(":")[2];
      const cur = slotDataRef.current;
      commit({ slotData: { ...cur, [slotId]: { ...(cur[slotId] || {}), ...patch } } });
    } else {
      commit({ blocks: blocksRef.current.map((b) => (b.id === itemId ? { ...b, ...patch } : b)) });
    }
  }
  function onDelete(itemId) {
    if (itemId.startsWith("slot:")) return; // los slots se gestionan en la plantilla del tipo
    const b = blocksRef.current.find((x) => x.id === itemId);
    if (b && isSingleImageBlockType(b.type) && b.imageKey) deleteImage(b.imageKey);
    commit({ blocks: blocksRef.current.filter((x) => x.id !== itemId) });
  }
  function onMove(itemId, dir) {
    if (itemId.startsWith("slot:")) return; // el orden de los slots lo fija la plantilla del tipo
    const cur = blocksRef.current;
    const idx = cur.findIndex((b) => b.id === itemId);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= cur.length) return;
    const next = [...cur];
    [next[idx], next[target]] = [next[target], next[idx]];
    commit({ blocks: next });
  }

  const emptyHint = hasTemplate
    ? "Añade contenido a los recuadros del formato, o usa la paleta para bloques extra."
    : "Página vacía. Arrastra una herramienta a la página o haz clic para añadir un recuadro.";

  const canvas = (
    <div style={styles.pageWrap}>
      <CoverImage node={node} updateNode={updateNode} margin="0 0 18px" />
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        onBlur={() => renameNode(node.id, title.trim() || node.name)}
        style={styles.pageTitleInput} />
      <EntryTypePicker node={node} updateNode={updateNode} />
      <TagEditor tags={node.tags || []} onChange={(tags) => updateNode(node.id, { tags })} onTagClick={setSearch} />
      {node.category === "character" && (
        <>
          <CharacterClassPicker nodes={nodes} classIds={node.classIds} onChange={(classIds) => updateNode(node.id, { classIds })} />
          <CharacterSymbiontPicker nodes={nodes} symbiontIds={node.symbiontIds} onChange={(symbiontIds) => updateNode(node.id, { symbiontIds })} />
        </>
      )}
      {node.category === "place" && (
        <ScenePaletteEditor colors={node.scenePalette || []} onChange={(scenePalette) => updateNode(node.id, { scenePalette })} />
      )}
      {node.category === "mission" && (
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text)", cursor: "pointer", margin: "2px 0 14px" }}>
          <input type="checkbox" checked={!!node.missionResolved} onChange={(e) => updateNode(node.id, { missionResolved: e.target.checked })} />
          Misión resuelta (no aparece en Cabos sueltos)
        </label>
      )}
      {hasTemplate && (
        <div style={styles.templateBadge}>
          <LayoutDashboard size={12} /> Formato de {ENTRY_TYPES[node.category]?.label}
        </div>
      )}
      <CanvasEditor items={items} mode="entry" nodes={nodes} navigateByName={navigateByName}
        onUpdate={onUpdate} onDelete={onDelete} onAdd={addBlock} onMove={onMove} isMobile={isMobile} emptyHint={emptyHint} nodeId={node.id} />
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <BlockPalette onAdd={(t) => addBlock(t)} horizontal category={node.category} />
        {canvas}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      {canvas}
      <BlockPalette onAdd={(t) => addBlock(t)} category={node.category} />
    </div>
  );
}
