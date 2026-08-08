import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { GENERAL_BOOK_SECTIONS } from "../data/pageSections.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";
import { BestiaryView } from "./BestiaryView.jsx";
import { CharacterBookView } from "./CharacterBookView.jsx";
import { ClassBookView } from "./ClassBookView.jsx";
import { ItemBookView } from "./ItemBookView.jsx";
import { ItemSetBookView } from "./ItemSetBookView.jsx";
import { StatusEffectBookView } from "./StatusEffectBookView.jsx";

// Gran Libro: reúne el Libro de personajes, de clases, de objetos y el
// Bestiario en un solo lugar de entrada, con una portada/índice desde la que
// se elige cuál abrir. Los cuatro libros son los mismos componentes de
// siempre, sin cambios — el Gran Libro sólo decide cuál mostrar y agrega un
// botón para volver al índice. Así el menú lateral pasa de 4 entradas a 1.
export function GeneralBookView(props) {
  const { nodes, navigateToId, updateNode, deleteNode, addClass, addSubclass, addSkillForClass, addMonster, addObjectItem, addConsumableItem, addSkillItem, addCharacter, addSkillForCharacter, addStatusEffect, addItemSet, navigateByName, isMobile } = props;
  const [section, setSection] = useState(null);

  if (section) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div style={styles.generalBookBackRow}>
          <button style={styles.generalBookBackBtn} onClick={() => setSection(null)}>
            <ChevronLeft size={13} /> Índice del Gran Libro
          </button>
        </div>
        {section === "characters" && (
          <CharacterBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addCharacter={addCharacter} addSkillForCharacter={addSkillForCharacter} deleteNode={deleteNode}
            navigateByName={navigateByName} isMobile={isMobile} />
        )}
        {section === "classes" && (
          <ClassBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addClass={addClass} addSubclass={addSubclass} addSkillForClass={addSkillForClass} deleteNode={deleteNode} isMobile={isMobile} />
        )}
        {section === "items" && (
          <ItemBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addObjectItem={addObjectItem} addConsumableItem={addConsumableItem} addSkillItem={addSkillItem} deleteNode={deleteNode} isMobile={isMobile} />
        )}
        {section === "bestiary" && (
          <BestiaryView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addMonster={addMonster} deleteNode={deleteNode} isMobile={isMobile} />
        )}
        {section === "statusEffects" && (
          <StatusEffectBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addStatusEffect={addStatusEffect} deleteNode={deleteNode} isMobile={isMobile} />
        )}
        {section === "itemSets" && (
          <ItemSetBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addItemSet={addItemSet} deleteNode={deleteNode} isMobile={isMobile} />
        )}
      </div>
    );
  }

  return (
    <div style={styles.bookOuter}>
      <div style={styles.bookFrame}>
        <div style={{ ...styles.bookSpread, flexDirection: isMobile ? "column" : "row" }}>
          <div style={styles.bookPage}>
            <h2 style={styles.bookPageTitle}>Gran Libro</h2>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, color: "var(--muted)", lineHeight: 1.7 }}>
              Todo lo necesario para desarrollar el juego, en un solo lugar: quiénes son tus personajes,
              qué clases pueden tomar, con qué se equipan y qué enfrentan.
            </p>
          </div>
          {!isMobile && <div style={styles.bookSpine} />}
          <div style={styles.bookPage}>
            <div style={styles.bookSectionTitle}>Índice</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GENERAL_BOOK_SECTIONS.map((s) => (
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
