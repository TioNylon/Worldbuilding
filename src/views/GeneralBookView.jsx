import { useMemo, useState } from "react";
import { GENERAL_BOOK_SECTIONS } from "../data/pageSections.js";
import { styles } from "../styles.js";
import { Breadcrumb } from "../components/Breadcrumb.jsx";
import { SectionCardGrid } from "../components/SectionCardGrid.jsx";
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
  const { nodes, navigateToId, updateNode, deleteNode, addClass, addSubclass, addSkillForClass, cloneClassStats, addMonster, addObjectItem, addConsumableItem, addSkillItem, cloneItemStats, addObjectItemFrom, addCharacter, addSkillForCharacter, cloneCharacterStats, addStatusEffect, cloneStatusEffectInfo, addItemSet, cloneSetInfo, navigateByName, isMobile } = props;
  const [section, setSection] = useState(null);
  const counts = useMemo(() => ({
    characters: nodes.filter((n) => n.category === "character").length,
    classes: nodes.filter((n) => n.category === "class").length,
    items: nodes.filter((n) => n.category === "object").length,
    bestiary: nodes.filter((n) => n.category === "enemy" || n.category === "boss").length,
    statusEffects: nodes.filter((n) => n.category === "statusEffect").length,
    itemSets: nodes.filter((n) => n.category === "itemSet").length,
  }), [nodes]);

  if (section) {
    const sectionLabel = GENERAL_BOOK_SECTIONS.find((s) => s.key === section)?.label || section;
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <Breadcrumb items={[{ label: "Gran Libro", onClick: () => setSection(null) }, { label: sectionLabel }]} />
        {section === "characters" && (
          <CharacterBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addCharacter={addCharacter} addSkillForCharacter={addSkillForCharacter} cloneCharacterStats={cloneCharacterStats}
            addClass={addClass} addSubclass={addSubclass} addObjectItem={addObjectItem}
            deleteNode={deleteNode} navigateByName={navigateByName} isMobile={isMobile} />
        )}
        {section === "classes" && (
          <ClassBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addClass={addClass} addSubclass={addSubclass} addSkillForClass={addSkillForClass} cloneClassStats={cloneClassStats}
            deleteNode={deleteNode} isMobile={isMobile} />
        )}
        {section === "items" && (
          <ItemBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addObjectItem={addObjectItem} addConsumableItem={addConsumableItem} addSkillItem={addSkillItem}
            cloneItemStats={cloneItemStats} addObjectItemFrom={addObjectItemFrom} deleteNode={deleteNode} isMobile={isMobile} />
        )}
        {section === "bestiary" && (
          <BestiaryView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addMonster={addMonster} deleteNode={deleteNode} isMobile={isMobile}
            addObjectItem={addObjectItem} cloneCharacterStats={cloneCharacterStats} />
        )}
        {section === "statusEffects" && (
          <StatusEffectBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addStatusEffect={addStatusEffect} cloneStatusEffectInfo={cloneStatusEffectInfo} deleteNode={deleteNode} isMobile={isMobile} />
        )}
        {section === "itemSets" && (
          <ItemSetBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addItemSet={addItemSet} cloneSetInfo={cloneSetInfo} deleteNode={deleteNode} isMobile={isMobile} />
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
            <SectionCardGrid sections={GENERAL_BOOK_SECTIONS} onSelect={setSection} counts={counts} />
          </div>
        </div>
      </div>
    </div>
  );
}
