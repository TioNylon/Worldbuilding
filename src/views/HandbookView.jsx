import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { HANDBOOK_SECTIONS } from "../data/pageSections.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { BrainView } from "./BrainView.jsx";
import { CatalogsContent, LooseEndsContent } from "./HandbookCatalogs.jsx";

export function HandbookView({ nodes, navigateToId, addCatalogEntry, brainKey, relBrainKey, isMobile, initialSection }) {
  const [section, setSection] = useState(initialSection || null);
  useEffect(() => { if (initialSection) setSection(initialSection); }, [initialSection]);

  if (section) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={styles.generalBookBackRow}>
          <button style={styles.generalBookBackBtn} onClick={() => setSection(null)}>
            <ChevronLeft size={13} /> Índice de la Bitácora
          </button>
        </div>
        {section === "catalogs" && <CatalogsContent nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry} />}
        {section === "brain" && <BrainView key="handbook-brain" nodes={nodes} navigateToId={navigateToId} isMobile={isMobile} brainKey={brainKey} />}
        {section === "looseEnds" && <LooseEndsContent nodes={nodes} navigateToId={navigateToId} />}
        {section === "relations" && <BrainView key="handbook-relations" nodes={nodes} navigateToId={navigateToId} isMobile={isMobile} brainKey={relBrainKey} onlyRelations />}
      </div>
    );
  }

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookFrame}>
        <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
          <div style={styles.bookPage}>
            <h2 style={styles.bookPageTitle}>Bitácora</h2>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, color: "var(--muted)", lineHeight: 1.7 }}>
              Herramientas para revisar y conectar todo lo que ya construiste: balance de contenido,
              mapa de vínculos y qué quedó pendiente.
            </p>
          </div>
          {!isMobile && <div style={styles.bookSpine} />}
          <div style={styles.bookPage}>
            <div style={styles.bookSectionTitle}>Índice</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {HANDBOOK_SECTIONS.map((s) => (
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
