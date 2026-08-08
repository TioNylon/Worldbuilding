import { useMemo } from "react";
import { getPageBlocks } from "../utils/blocks.js";
import { styles } from "../styles.js";

/* ---------- BLOCK: APARICIONES EN EL GUION (Personaje/Lugar, solo lectura) ---------- */
// Mismo patrón que ClassSummaryBlock: no guarda nada en el bloque, calcula
// al vuelo escaneando Beats y Escenas que referencian este nodo — así no hay
// que mantener una lista de apariciones sincronizada a mano.
export function AppearancesBlock({ nodes, nodeId }) {
  const beats = useMemo(() => nodes.filter((n) => {
    if (n.category !== "beat") return false;
    const b = getPageBlocks(n).find((x) => x.type === "beatInfo");
    return b?.placeId === nodeId || (b?.characterIds || []).includes(nodeId);
  }), [nodes, nodeId]);
  const scenes = useMemo(() => nodes.filter((n) => {
    if (n.category !== "scene") return false;
    const b = getPageBlocks(n).find((x) => x.type === "sceneInfo");
    return b?.placeId === nodeId || (b?.characterIds || []).includes(nodeId);
  }), [nodes, nodeId]);

  return (
    <div>
      <div style={styles.statsIncidenceTitle2}>Beats</div>
      {beats.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>Ninguno todavía.</div>
      ) : beats.map((n) => (
        <div key={n.id} style={{ fontSize: 12, color: "var(--text)", padding: "3px 0" }}>{n.name}</div>
      ))}
      <div style={{ ...styles.statsIncidenceTitle2, marginTop: 14 }}>Escenas</div>
      {scenes.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Ninguna todavía.</div>
      ) : scenes.map((n) => (
        <div key={n.id} style={{ fontSize: 12, color: "var(--text)", padding: "3px 0" }}>{n.name}</div>
      ))}
    </div>
  );
}
