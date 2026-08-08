import { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft, LayoutDashboard, Download, History, FileDown } from "lucide-react";
import { ENTRY_TYPES, ENTRY_TYPE_KEYS } from "../data/entryTypes.js";
import { TOOLS_SECTIONS } from "../data/pageSections.js";
import { bottomOf, makeSlot } from "../utils/blocks.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { BlockPalette } from "../components/BlockPalette.jsx";
import { CanvasEditor, ComparePanel } from "./PageEditor.jsx";

export function ToolsView({ typeTemplates, saveTypeTemplates, nodes, compareIds, setCompareIds, updateNode, updateNodeWithLinks, renameNode, addNode, skin, setSearch, isMobile, onExportJSON, onExportMarkdown, onRestoreLastVersion }) {
  const [section, setSection] = useState(null);

  if (section) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={styles.generalBookBackRow}>
          <button style={styles.generalBookBackBtn} onClick={() => setSection(null)}>
            <ChevronLeft size={13} /> Índice de Herramientas
          </button>
        </div>
        {section === "templates" && (
          <TypeTemplatesContent typeTemplates={typeTemplates} saveTypeTemplates={saveTypeTemplates} isMobile={isMobile} />
        )}
        {section === "compare" && (
          <ComparePanel nodes={nodes} ids={compareIds} setIds={setCompareIds}
            updateNode={updateNode} updateNodeWithLinks={updateNodeWithLinks} renameNode={renameNode} addNode={addNode}
            isMobile={isMobile} typeTemplates={typeTemplates} skin={skin} setSearch={setSearch} />
        )}
        {section === "backup" && (
          <BackupToolsContent onExportJSON={onExportJSON} onExportMarkdown={onExportMarkdown} onRestoreLastVersion={onRestoreLastVersion} />
        )}
      </div>
    );
  }

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookFrame}>
        <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
          <div style={styles.bookPage}>
            <h2 style={styles.bookPageTitle}>Herramientas</h2>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, color: "var(--muted)", lineHeight: 1.7 }}>
              Utilidades de edición: cómo se arman las fichas de cada tipo de entrada, una forma de
              poner dos páginas una al lado de la otra, y cómo respaldar o exportar el mundo.
            </p>
          </div>
          {!isMobile && <div style={styles.bookSpine} />}
          <div style={styles.bookPage}>
            <div style={styles.bookSectionTitle}>Índice</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TOOLS_SECTIONS.map((s) => (
                <div key={s.key} style={styles.generalBookTile} onClick={() => setSection(s.key)} role="button" tabIndex={0} onKeyDown={keyActivate}>
                  <s.icon size={18} color={s.color} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--text)" }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{s.desc}</div>
                  </div>
                  <ChevronRight size={16} color="var(--muted)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sección "Respaldo y exportación": backup real del mundo (JSON con
// fidelidad completa + imágenes, y un Markdown legible como formato
// secundario) y "Restaurar última versión guardada" (un solo nivel de
// respaldo, ver treeVersionKeyFor/persist en App).
export function BackupToolsContent({ onExportJSON, onExportMarkdown, onRestoreLastVersion }) {
  const [busy, setBusy] = useState(null); // "json" | "md" | "restore" | null
  const [status, setStatus] = useState(null); // { kind: "ok"|"error"|"info", text }

  async function runExportJSON() {
    setBusy("json"); setStatus(null);
    try {
      await onExportJSON();
      setStatus({ kind: "ok", text: "Respaldo JSON descargado." });
    } catch (e) {
      console.error(e);
      setStatus({ kind: "error", text: "No se pudo generar el respaldo. Probá de nuevo." });
    } finally { setBusy(null); }
  }
  async function runExportMarkdown() {
    setBusy("md"); setStatus(null);
    try {
      onExportMarkdown();
      setStatus({ kind: "ok", text: "Markdown descargado." });
    } catch (e) {
      console.error(e);
      setStatus({ kind: "error", text: "No se pudo generar el Markdown. Probá de nuevo." });
    } finally { setBusy(null); }
  }
  async function runRestore() {
    setBusy("restore"); setStatus(null);
    try {
      const res = await onRestoreLastVersion();
      if (res.ok) setStatus({ kind: "ok", text: "Se restauró la última versión guardada." });
      else if (res.reason === "none") setStatus({ kind: "info", text: "Todavía no hay una versión anterior guardada para este mundo." });
      else if (res.reason === "cancelled") setStatus(null);
      else setStatus({ kind: "error", text: "No se pudo restaurar. Probá de nuevo." });
    } catch (e) {
      console.error(e);
      setStatus({ kind: "error", text: "No se pudo restaurar. Probá de nuevo." });
    } finally { setBusy(null); }
  }

  return (
    <div style={{ padding: "0 4px", maxWidth: 560 }}>
      <div style={styles.bookSectionTitle}>Respaldo</div>
      <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
        Descargá una copia completa del mundo activo, o volvé a como estaba antes del último guardado.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        <button style={styles.pillBtn} disabled={busy === "json"} onClick={runExportJSON}>
          <FileDown size={14} /> {busy === "json" ? "Generando respaldo…" : "Descargar respaldo (JSON)"}
        </button>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: 2 }}>
          Fidelidad completa: todo el árbol de páginas, formatos, listas configurables e imágenes del proyecto activo.
        </div>
        <button style={styles.pillBtn} disabled={busy === "md"} onClick={runExportMarkdown}>
          <Download size={14} /> {busy === "md" ? "Generando…" : "Descargar como Markdown"}
        </button>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: 2 }}>
          Formato secundario, legible fuera de la app (no incluye imágenes).
        </div>
      </div>

      <div style={styles.bookSectionTitle}>Restaurar</div>
      <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>
        Cada vez que se guarda un cambio, se conserva la versión inmediatamente anterior. No es un historial completo
        — solo un nivel de respaldo — pero alcanza para deshacer un guardado accidental.
      </p>
      <button style={{ ...styles.pillBtn, color: "#c45c5c" }} disabled={busy === "restore"} onClick={runRestore}>
        <History size={14} /> {busy === "restore" ? "Restaurando…" : "Restaurar última versión guardada"}
      </button>

      {status && (
        <div style={{
          marginTop: 14, fontSize: 12.5, padding: "8px 10px", borderRadius: "var(--radius-md, 8px)",
          background: status.kind === "error" ? "color-mix(in srgb, #c45c5c 15%, transparent)" : "var(--panel2)",
          color: status.kind === "error" ? "#c45c5c" : "var(--text)",
        }}>
          {status.text}
        </div>
      )}
    </div>
  );
}

/* ---------- FORMATOS POR TIPO (diseñador de plantillas) ---------- */
// Contenido de Formatos por tipo como sección de Herramientas (antes era un
// modal aparte); mismo contenido, sin el envoltorio de overlay/panel flotante.
export function TypeTemplatesContent({ typeTemplates, saveTypeTemplates, isMobile }) {
  const [activeType, setActiveType] = useState(ENTRY_TYPE_KEYS[0]);
  const slots = (typeTemplates[activeType] && typeTemplates[activeType].slots) || [];
  const slotsRef = useRef(slots);
  useEffect(() => {
    slotsRef.current = (typeTemplates[activeType] && typeTemplates[activeType].slots) || [];
  }, [typeTemplates, activeType]);

  function commitSlots(next) {
    slotsRef.current = next;
    saveTypeTemplates({ ...typeTemplates, [activeType]: { slots: next } });
  }
  function addSlot(type, pos) {
    const s = makeSlot(type);
    s.x = pos?.x ?? 2;
    s.y = pos?.y ?? bottomOf(slotsRef.current) + 12;
    commitSlots([...slotsRef.current, s]);
  }
  function updateSlot(slotId, patch) { commitSlots(slotsRef.current.map((s) => (s.slotId === slotId ? { ...s, ...patch } : s))); }
  function deleteSlot(slotId) { commitSlots(slotsRef.current.filter((s) => s.slotId !== slotId)); }

  const items = slots.map((s) => ({ ...s, id: s.slotId }));

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, padding: 16, gap: 8, background: "var(--app-bg, var(--bg))" }}>
      <h2 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: 18, color: "var(--text)" }}>
        <LayoutDashboard size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Formatos por tipo de entrada
      </h2>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
        Diseña la maqueta de cada tipo arrastrando y redimensionando los recuadros. Se aplica a las
        entradas de ese tipo (existentes y nuevas); cada entrada podrá reacomodarla luego.
      </div>
      <div style={styles.templatesTypeRow}>
        {ENTRY_TYPE_KEYS.map((k) => {
          const t = ENTRY_TYPES[k]; const Icon = t.icon; const active = k === activeType;
          const count = ((typeTemplates[k] && typeTemplates[k].slots) || []).length;
          return (
            <button key={k} onClick={() => setActiveType(k)}
              style={{ ...styles.pillBtn, ...(active ? { background: t.color, borderColor: t.color, color: "var(--bg)" } : { color: t.color }) }}>
              <Icon size={13} /> {t.label}{count ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 10 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 4 }}>
          <CanvasEditor items={items} mode="template" nodes={[]} navigateByName={() => {}}
            onUpdate={updateSlot} onDelete={deleteSlot} onAdd={addSlot} isMobile={isMobile}
            emptyHint="Añade recuadros desde la paleta y colócalos para formar la ficha de este tipo." />
        </div>
        {!isMobile && <BlockPalette onAdd={(t) => addSlot(t)} category={activeType} />}
      </div>
      {isMobile && <BlockPalette onAdd={(t) => addSlot(t)} horizontal category={activeType} />}
    </div>
  );
}
