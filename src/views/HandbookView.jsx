import { useState, useEffect } from "react";
import { HANDBOOK_SECTIONS } from "../data/pageSections.js";
import { styles } from "../styles.js";
import { Breadcrumb } from "../components/Breadcrumb.jsx";
import { SectionCardGrid } from "../components/SectionCardGrid.jsx";
import { BrainView } from "./BrainView.jsx";
import { CatalogsContent, LooseEndsContent } from "./HandbookCatalogs.jsx";

export function HandbookView({ nodes, navigateToId, addCatalogEntry, brainKey, relBrainKey, isMobile, initialSection }) {
  const [section, setSection] = useState(initialSection || null);
  useEffect(() => { if (initialSection) setSection(initialSection); }, [initialSection]);

  if (section) {
    const sectionLabel = HANDBOOK_SECTIONS.find((s) => s.key === section)?.label || section;
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Breadcrumb items={[{ label: "Bitácora", onClick: () => setSection(null) }, { label: sectionLabel }]} />
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
            <SectionCardGrid sections={HANDBOOK_SECTIONS} onSelect={setSection} />
          </div>
        </div>
      </div>
    </div>
  );
}
