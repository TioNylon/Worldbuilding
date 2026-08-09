import { useMemo } from "react";
import { styles } from "../styles.js";
import { LinkableTextarea } from "../components/LinkableTextarea.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { CharacterMultiPicker, FlagListEditor } from "./CharacterPickers.jsx";

/* ---------- BLOCK: INFORMACIÓN DE BEAT ---------- */
export function BeatInfoBlock({ block, nodes, navigateByName, updateBlock }) {
  const chapters = useMemo(() => nodes.filter((n) => n.category === "chapter").sort((a, b) => a.name.localeCompare(b.name)), [nodes]);
  const places = useMemo(() => nodes.filter((n) => n.category === "place").sort((a, b) => a.name.localeCompare(b.name)), [nodes]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ ...styles.statsField, flex: 1, minWidth: 160 }}>
          <span style={styles.statsLabel}>Capítulo</span>
          <SearchSelect options={chapters.map((c) => ({ id: c.id, label: c.name }))}
            value={block.chapterId || null} onChange={(v) => updateBlock(block.id, { chapterId: v })}
            placeholder="Buscar capítulo…" clearLabel="— sin capítulo —" />
        </div>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>Orden</span>
          <input type="number" min={1} value={block.order ?? 1}
            onChange={(e) => updateBlock(block.id, { order: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            style={{ ...styles.statsMiniInput, width: 60 }} />
        </label>
      </div>
      <div style={{ ...styles.statsField, marginTop: 8 }}>
        <span style={styles.statsLabel}>Ubicación</span>
        <SearchSelect options={places.map((p) => ({ id: p.id, label: p.name }))}
          value={block.placeId || null} onChange={(v) => updateBlock(block.id, { placeId: v })}
          placeholder="Buscar lugar…" clearLabel="— ninguna —" />
      </div>
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Descripción breve</div>
      <LinkableTextarea value={block.description} nodes={nodes} navigateByName={navigateByName}
        onCommit={(v) => updateBlock(block.id, { description: v })}
        placeholder="¿Qué pasa en este beat? Escribe [[ para enlazar una página…" minHeight={70} keyId={block.id} />
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Personajes presentes</div>
      <CharacterMultiPicker characterIds={block.characterIds} nodes={nodes} onChange={(v) => updateBlock(block.id, { characterIds: v })} />
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 10 }}>Qué desbloquea o cambia</div>
      <FlagListEditor items={block.flags} onChange={(v) => updateBlock(block.id, { flags: v })}
        addLabel="Agregar flag" placeholder="Ej. flag_puerta_abierta = true" />
    </div>
  );
}
