import { Folder, FolderOpen, FileText, Map as MapIcon, Clock, Share2 } from "lucide-react";
import { ENTRY_TYPES } from "../data/entryTypes.js";
import { ICONS } from "../data/icons.js";

export function findNode(nodes, id) { return nodes.find((n) => n.id === id); }

export function childrenOf(nodes, parentId) {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
}

export function pathTo(nodes, id) {
  const path = [];
  let cur = findNode(nodes, id);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? findNode(nodes, cur.parentId) : null;
  }
  return path;
}

export function descendantIds(nodes, id) {
  const out = [id];
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    nodes.filter((n) => n.parentId === cur).forEach((c) => { out.push(c.id); stack.push(c.id); });
  }
  return out;
}

// Integridad referencial al borrar: cuando se elimina uno o más nodos, otras
// partes de los datos pueden quedar apuntando a un id que ya no existe (una
// receta, una relación entre personajes, la clase de un personaje, etc.).
// Esto NO cascadea el borrado — solo limpia el campo roto, dejando intacto
// el resto de la fila/bloque/nodo. `removedIds` es el Set de ids que se
// acaban de quitar de `nodes` (deleteNode ya incluye ahí toda la cascada de
// hijos, así que también se limpian referencias hacia esos hijos).
//
// Nota: inflictsStatusId/curesStatusId/linkedStatusKey NO se tocan acá a
// propósito — no son ids de `nodes`, son claves de la lista de configuración
// `activeStatusEffects` (mismo patrón que activeElements/activeWeaponTypes),
// así que borrar un nodo nunca las invalida.
export function sanitizeReferences(nodes, removedIds) {
  if (!removedIds || removedIds.size === 0) return nodes;

  const clean = (id) => (id && removedIds.has(id) ? null : id);
  const cleanUsableBy = (v) => (v && v !== "any" && removedIds.has(v) ? "any" : v);
  const cleanArr = (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.some((id) => removedIds.has(id)) ? arr.filter((id) => !removedIds.has(id)) : arr;
  };

  function sanitizeBlock(b) {
    switch (b.type) {
      case "itemStats": {
        const teachesSkillId = clean(b.teachesSkillId);
        const usableBy = cleanUsableBy(b.usableBy);
        const setId = clean(b.setId);
        // consumableEffect.curesStatusId es clave de config (activeStatusEffects),
        // no id de nodo — no se toca, no hace falta copiar el objeto.
        const recipes = Array.isArray(b.recipes)
          ? b.recipes.map((r) => {
              const resultItemId = clean(r.resultItemId);
              const materials = Array.isArray(r.materials)
                ? r.materials.map((m) => (removedIds.has(m.itemId) ? { ...m, itemId: null } : m))
                : r.materials;
              return resultItemId === r.resultItemId && materials === r.materials ? r : { ...r, resultItemId, materials };
            })
          : b.recipes;
        if (teachesSkillId === b.teachesSkillId && usableBy === b.usableBy && setId === b.setId && recipes === b.recipes) return b;
        return { ...b, teachesSkillId, usableBy, setId, recipes };
      }
      case "skillInfo": {
        const usableBy = cleanUsableBy(b.usableBy);
        const calcAttackerId = clean(b.calcAttackerId);
        const calcTargetId = clean(b.calcTargetId);
        const prereqSkillId = clean(b.prereqSkillId);
        if (usableBy === b.usableBy && calcAttackerId === b.calcAttackerId && calcTargetId === b.calcTargetId && prereqSkillId === b.prereqSkillId) return b;
        return { ...b, usableBy, calcAttackerId, calcTargetId, prereqSkillId };
      }
      case "members": {
        if (!Array.isArray(b.entries) || !b.entries.some((e) => removedIds.has(e.characterId))) return b;
        return { ...b, entries: b.entries.map((e) => (removedIds.has(e.characterId) ? { ...e, characterId: null } : e)) };
      }
      case "relations": {
        if (!Array.isArray(b.entries) || !b.entries.some((e) => removedIds.has(e.targetId))) return b;
        return { ...b, entries: b.entries.map((e) => (removedIds.has(e.targetId) ? { ...e, targetId: null } : e)) };
      }
      case "lootTable":
      case "shopInventory": {
        if (!Array.isArray(b.entries) || !b.entries.some((e) => removedIds.has(e.itemId))) return b;
        return { ...b, entries: b.entries.map((e) => (removedIds.has(e.itemId) ? { ...e, itemId: null } : e)) };
      }
      case "causeEffect": {
        const causedById = clean(b.causedById);
        return causedById === b.causedById ? b : { ...b, causedById };
      }
      case "symbiontInfo": {
        const passiveSkillId = clean(b.passiveSkillId);
        const activeSkillId = clean(b.activeSkillId);
        const fa = b.finalAttack;
        const finalAttack = fa && (removedIds.has(fa.calcAttackerId) || removedIds.has(fa.calcTargetId))
          ? { ...fa, calcAttackerId: clean(fa.calcAttackerId), calcTargetId: clean(fa.calcTargetId) }
          : fa;
        if (passiveSkillId === b.passiveSkillId && activeSkillId === b.activeSkillId && finalAttack === b.finalAttack) return b;
        return { ...b, passiveSkillId, activeSkillId, finalAttack };
      }
      case "beatInfo": {
        const chapterId = clean(b.chapterId);
        const placeId = clean(b.placeId);
        const characterIds = cleanArr(b.characterIds);
        if (chapterId === b.chapterId && placeId === b.placeId && characterIds === b.characterIds) return b;
        return { ...b, chapterId, placeId, characterIds };
      }
      case "sceneInfo": {
        const beatId = clean(b.beatId);
        const placeId = clean(b.placeId);
        const characterIds = cleanArr(b.characterIds);
        const lines = Array.isArray(b.lines) && b.lines.some((l) => removedIds.has(l.speakerId))
          ? b.lines.map((l) => (removedIds.has(l.speakerId) ? { ...l, speakerId: null } : l))
          : b.lines;
        if (beatId === b.beatId && placeId === b.placeId && characterIds === b.characterIds && lines === b.lines) return b;
        return { ...b, beatId, placeId, characterIds, lines };
      }
      case "dialogue": {
        if (!Array.isArray(b.lines) || !b.lines.some((l) => removedIds.has(l.speakerId))) return b;
        return { ...b, lines: b.lines.map((l) => (removedIds.has(l.speakerId) ? { ...l, speakerId: null } : l)) };
      }
      case "encounter": {
        if (!Array.isArray(b.enemies) || !b.enemies.some((e) => removedIds.has(e.enemyId))) return b;
        return { ...b, enemies: b.enemies.map((e) => (removedIds.has(e.enemyId) ? { ...e, enemyId: null } : e)) };
      }
      default:
        return b;
    }
  }

  return nodes.map((n) => {
    const chapterId = clean(n.chapterId);
    const classIds = cleanArr(n.classIds);
    const symbiontIds = cleanArr(n.symbiontIds);
    const blocks = Array.isArray(n.blocks) ? n.blocks.map(sanitizeBlock) : n.blocks;
    const blocksChanged = Array.isArray(blocks) && blocks.some((b, i) => b !== n.blocks[i]);
    // Hitos de Línea de tiempo: mismo criterio que beatInfo (Lugar +
    // Personajes relevantes son referencias directas del hito, no de un
    // bloque). El "pins" del Mapa queda con el mismo hueco preexistente que
    // ya tenía linkedPageId antes de esto — no se toca acá.
    const events = Array.isArray(n.events) ? n.events.map((e) => {
      const linkedPageId = clean(e.linkedPageId);
      const placeId = clean(e.placeId);
      const characterIds = cleanArr(e.characterIds);
      if (linkedPageId === e.linkedPageId && placeId === e.placeId && characterIds === e.characterIds) return e;
      return { ...e, linkedPageId, placeId, characterIds };
    }) : n.events;
    const eventsChanged = Array.isArray(events) && events.some((e, i) => e !== n.events[i]);
    if (chapterId === n.chapterId && classIds === n.classIds && symbiontIds === n.symbiontIds && !blocksChanged && !eventsChanged) return n;
    return { ...n, chapterId, classIds, symbiontIds, blocks, events };
  });
}

export function iconForType(type, isOpen) {
  if (type === "folder") return isOpen ? FolderOpen : Folder;
  if (type === "map") return MapIcon;
  if (type === "timeline") return Clock;
  if (type === "board") return Share2;
  return FileText;
}

export function iconForNode(node, isOpen) {
  if (node.type === "folder" && node.folderIcon && ICONS[node.folderIcon]) return ICONS[node.folderIcon];
  if (node.type === "page" && ENTRY_TYPES[node.category]) return ENTRY_TYPES[node.category].icon;
  return iconForType(node.type, isOpen);
}

export function colorForNode(node) {
  if (node.type === "folder" && node.folderColor) return node.folderColor;
  if (node.type === "page" && ENTRY_TYPES[node.category]) return ENTRY_TYPES[node.category].color;
  return "var(--accent)";
}

export function nextOrder(nodes, parentId) {
  const kids = nodes.filter((n) => n.parentId === parentId);
  return kids.length ? Math.max(...kids.map((k) => k.order ?? 0)) + 1 : 0;
}
