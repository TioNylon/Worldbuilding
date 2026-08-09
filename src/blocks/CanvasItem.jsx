import { useState } from "react";
import { Trash2, ImageIcon, Square, AlignLeft, AlignCenter, GripVertical, ArrowUp, ArrowDown, CheckCircle2 } from "lucide-react";
import { typeIcon, typeLabel } from "../utils/misc.js";
import { styles } from "../styles.js";
import { SpriteListEditor } from "../components/SpriteUploader.jsx";
import { AppearancesBlock } from "./AppearancesBlock.jsx";
import { BeatInfoBlock } from "./BeatInfoBlock.jsx";
import { CharStatsBlock } from "./CharStatsBlock.jsx";
import { ClassSummaryBlock } from "./ClassSummaryBlock.jsx";
import { DialogueBlock } from "./DialogueBlock.jsx";
import { EncounterBlock, ShopInventoryBlock } from "./EncounterBlock.jsx";
import { ImageBlock } from "./ImageBlock.jsx";
import { ItemStatsBlock } from "./ItemStatsBlock.jsx";
import { LootTableBlock } from "./LootTableBlock.jsx";
import { MembersBlock } from "./MembersBlock.jsx";
import { RoutineBlock, RumorBlock, StatusEffectInfoBlock, ThreatLevelBlock } from "./NpcBlocks.jsx";
import { RelationsBlock } from "./RelationsBlock.jsx";
import { ResistancesBlock } from "./ResistancesBlock.jsx";
import { MissionBranchesBlock, SceneBeatsBlock } from "./SceneBeatsBlock.jsx";
import { SceneInfoBlock } from "./SceneScriptBlock.jsx";
import { SetInfoBlock } from "./SetInfoBlock.jsx";
import { SkillInfoBlock } from "./SkillInfoBlock.jsx";
import { CauseEffectBlock, StoryStateBlock } from "./StoryStateBlock.jsx";
import { SymbiontInfoBlock } from "./SymbiontInfoBlock.jsx";
import { HeadingBlock, TextBlock } from "./TextBlock.jsx";

export function CanvasItem({ item, mode, nodes, navigateByName, selected, onSelect, startDrag, onUpdate, onDelete, onMove, nodeId, flowLayout, addObjectItem, addCharacter }) {
  const updateBlock = (_id, patch) => onUpdate(item.id, patch);
  const Icon = typeIcon(item.type);
  const canDelete = mode === "template" || !item.isSlot;
  const canMove = mode === "entry" && !item.isSlot && !!onMove;
  const stop = (e) => e.stopPropagation();
  const [editingText, setEditingText] = useState(false);

  // En flujo normal (modo libro, o el apilado que usaba móvil antes) el alto
  // sigue al contenido en vez del alto fijo pensado para el lienzo libre de
  // plantillas — si se queda en "absolute" con ese alto fijo, el contenido
  // se recorta y los bloques siguientes quedan superpuestos encima en vez de
  // empujarse hacia abajo.
  const rootStyle = flowLayout
    ? { ...styles.canvasItem, position: "relative", left: 0, top: 0, width: "100%", height: "auto", overflow: "visible" }
    : { ...styles.canvasItem, left: `${item.x}%`, top: item.y, width: `${item.w}%`, height: item.h };

  return (
    <div style={{ ...rootStyle,
        ...(selected ? { borderColor: "var(--accent)", zIndex: 6 } : {}),
        ...(editingText ? { height: "auto", minHeight: item.h, zIndex: 40, overflow: "visible", borderColor: "var(--accent)", boxShadow: "0 12px 30px rgba(0,0,0,0.45)" } : {}) }}
      onMouseDown={(e) => { e.stopPropagation(); onSelect(); }}>
      <div style={{ ...styles.canvasItemHeader, ...(flowLayout ? { cursor: "default" } : {}) }}
        onMouseDown={flowLayout ? undefined : (e) => { e.stopPropagation(); onSelect(); startDrag("move", e); }}
        onTouchStart={flowLayout ? undefined : (e) => startDrag("move", e)}
        title={flowLayout ? undefined : "Arrastra para mover"}>
        {!flowLayout && <GripVertical size={12} color="var(--muted)" />}
        <Icon size={12} color="var(--muted)" style={{ flexShrink: 0 }} />
        <input value={item.label || ""} onChange={(e) => onUpdate(item.id, { label: e.target.value })}
          onMouseDown={stop} placeholder={typeLabel(item.type)} style={styles.slotLabelInput} />
        {mode === "entry" && item.type === "text" && (
          <>
            <button style={{ ...styles.blockBtn, ...(item.align === "center" ? styles.blockBtnOn : {}) }} title="Alinear"
              onMouseDown={stop} onClick={() => onUpdate(item.id, { align: item.align === "center" ? "left" : "center" })}>
              {item.align === "center" ? <AlignCenter size={12} /> : <AlignLeft size={12} />}
            </button>
            <button style={{ ...styles.blockBtn, ...(item.boxed ? styles.blockBtnOn : {}) }} title="Recuadro destacado"
              onMouseDown={stop} onClick={() => onUpdate(item.id, { boxed: !item.boxed })}><Square size={12} /></button>
            <button style={{ ...styles.blockBtn, ...(item.dialogueReady ? styles.blockBtnOn : {}) }} title="Marcar como listo para diálogo"
              onMouseDown={stop} onClick={() => onUpdate(item.id, { dialogueReady: !item.dialogueReady })}><CheckCircle2 size={12} /></button>
          </>
        )}
        {mode === "entry" && item.type === "image" && (
          <button style={{ ...styles.blockBtn, ...(item.fit === "contain" ? styles.blockBtnOn : {}) }} title="Ajuste de imagen"
            onMouseDown={stop} onClick={() => onUpdate(item.id, { fit: item.fit === "contain" ? "cover" : "contain" })}><ImageIcon size={12} /></button>
        )}
        {canMove && (
          <>
            <button style={{ ...styles.blockBtn, marginLeft: "auto" }} title="Mover antes"
              onMouseDown={stop} onClick={() => onMove(item.id, -1)}><ArrowUp size={12} /></button>
            <button style={styles.blockBtn} title="Mover después"
              onMouseDown={stop} onClick={() => onMove(item.id, 1)}><ArrowDown size={12} /></button>
          </>
        )}
        {canDelete && (
          <button style={{ ...styles.blockBtn, color: "#c45c5c", ...(canMove ? {} : { marginLeft: "auto" }) }} title="Eliminar"
            onMouseDown={stop} onClick={() => onDelete(item.id)}><Trash2 size={12} /></button>
        )}
      </div>
      <div style={{ ...styles.canvasItemBody, ...(editingText ? { overflow: "visible" } : {}) }}>
        {mode === "template" ? (
          <div style={styles.slotPreview}><Icon size={16} /> {typeLabel(item.type)}</div>
        ) : item.type === "heading" ? <HeadingBlock block={item} updateBlock={updateBlock} />
          : item.type === "text" ? <TextBlock block={item} nodes={nodes} nodeId={nodeId} navigateByName={navigateByName} updateBlock={updateBlock} onEditingChange={setEditingText} />
          : item.type === "image" ? <ImageBlock block={item} updateBlock={updateBlock} />
          : item.type === "itemStats" ? <ItemStatsBlock block={item} nodes={nodes} updateBlock={updateBlock} />
          : item.type === "skillInfo" ? <SkillInfoBlock block={item} nodes={nodes} nodeId={nodeId} updateBlock={updateBlock} />
          : item.type === "charStats" ? <CharStatsBlock block={item} updateBlock={updateBlock} />
          : item.type === "members" ? <MembersBlock block={item} nodes={nodes} updateBlock={updateBlock} addCharacter={addCharacter} nodeId={nodeId} />
          : item.type === "relations" ? <RelationsBlock block={item} nodes={nodes} nodeId={nodeId} updateBlock={updateBlock} />
          : item.type === "lootTable" ? <LootTableBlock block={item} nodes={nodes} updateBlock={updateBlock} addObjectItem={addObjectItem} nodeId={nodeId} />
          : item.type === "routine" ? <RoutineBlock block={item} updateBlock={updateBlock} />
          : item.type === "rumor" ? <RumorBlock block={item} updateBlock={updateBlock} />
          : item.type === "threatLevel" ? <ThreatLevelBlock block={item} updateBlock={updateBlock} />
          : item.type === "sceneBeats" ? <SceneBeatsBlock block={item} updateBlock={updateBlock} />
          : item.type === "missionBranches" ? <MissionBranchesBlock block={item} updateBlock={updateBlock} />
          : item.type === "storyState" ? <StoryStateBlock block={item} updateBlock={updateBlock} />
          : item.type === "causeEffect" ? <CauseEffectBlock block={item} nodes={nodes} nodeId={nodeId} updateBlock={updateBlock} />
          : item.type === "classSummary" ? <ClassSummaryBlock nodes={nodes} nodeId={nodeId} />
          : item.type === "symbiontInfo" ? <SymbiontInfoBlock block={item} nodes={nodes} updateBlock={updateBlock} />
          : item.type === "resistances" ? <ResistancesBlock block={item} updateBlock={updateBlock} />
          : item.type === "dialogue" ? <DialogueBlock block={item} nodes={nodes} updateBlock={updateBlock} />
          : item.type === "encounter" ? <EncounterBlock block={item} nodes={nodes} updateBlock={updateBlock} />
          : item.type === "shopInventory" ? <ShopInventoryBlock block={item} nodes={nodes} updateBlock={updateBlock} addObjectItem={addObjectItem} nodeId={nodeId} />
          : item.type === "statusEffectInfo" ? <StatusEffectInfoBlock block={item} updateBlock={updateBlock} />
          : item.type === "setInfo" ? <SetInfoBlock block={item} nodes={nodes} updateBlock={updateBlock} />
          : item.type === "beatInfo" ? <BeatInfoBlock block={item} nodes={nodes} navigateByName={navigateByName} updateBlock={updateBlock} />
          : item.type === "sceneInfo" ? <SceneInfoBlock block={item} nodes={nodes} navigateByName={navigateByName} updateBlock={updateBlock} />
          : item.type === "appearances" ? <AppearancesBlock nodes={nodes} nodeId={nodeId} />
          : item.type === "expressionSprites" ? <SpriteListEditor block={item} keyPrefix="expr" title="Expresiones (diálogo)"
              placeholder="Ej. Normal, Enojada, Sorprendida…" addLabel="Agregar expresión" updateBlock={updateBlock} />
          : item.type === "explorationSprites" ? <SpriteListEditor block={item} keyPrefix="explore" title="Sprites de exploración"
              placeholder="Ej. Caminar arriba, Idle…" addLabel="Agregar sprite" updateBlock={updateBlock} />
          : item.type === "combatSprites" ? <SpriteListEditor block={item} keyPrefix="combat" title="Sprites de combate"
              placeholder="Ej. Idle, Ataque, Herido…" addLabel="Agregar sprite" updateBlock={updateBlock} />
          : (item.type === "menuPortrait" || item.type === "skillIcon" || item.type === "itemIcon")
            ? <ImageBlock block={item} updateBlock={updateBlock} />
          : null}
      </div>
      {!flowLayout && (
        <div style={styles.resizeHandle} title="Arrastra para redimensionar"
          onMouseDown={(e) => { e.stopPropagation(); startDrag("resize", e); }}
          onTouchStart={(e) => { e.stopPropagation(); startDrag("resize", e); }} />
      )}
    </div>
  );
}
