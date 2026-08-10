import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Crown, Plus, Folder, FileText, Map as MapIcon, ChevronRight, ChevronDown, Search, X, Trash2, Save, ScrollText, PanelLeftClose, PanelLeftOpen, Clock, Share2, Settings, Pencil, LayoutDashboard, CircleAlert, Compass, BookOpen, Wrench, LogOut, Network, NotebookText } from "lucide-react";
import { PROJECTS_KEY, THEME_KEY, TREE_KEY, armorTypesKeyFor, brainKeyFor, dashBgKeyFor, dashKeyFor, elementsKeyFor, relBrainKeyFor, rolesKeyFor, skinKeyFor, statusEffectsKeyFor, templatesKeyFor, treeKeyFor, treeVersionKeyFor, weaponTypesKeyFor } from "./data/storageKeys.js";
import { DEFAULT_SKIN, DEFAULT_THEME, PIXEL_BUTTONS } from "./data/theme.js";
import { DEFAULT_ARMOR_TYPES, DEFAULT_ELEMENTS, DEFAULT_ROLES, DEFAULT_STATUS_EFFECTS, DEFAULT_WEAPON_TYPES, UNASSIGNED_FOLDER, seedNodes } from "./data/worldDefaults.js";
import { getPageBlocks, makeBlock } from "./utils/blocks.js";
import { keyActivate, uid, useIsMobile } from "./utils/misc.js";
import { findSnippetAround, nodeAllText, stripMarkup } from "./utils/text.js";
import { childrenOf, descendantIds, findNode, nextOrder, pathTo, sanitizeReferences } from "./utils/tree.js";
import { extractWikiNames, renameLinksEverywhere } from "./utils/wikiLinks.js";
import { getAccessKey, setAccessKey, setSaveErrorHandler, storageGetJSON, storageSetJSON } from "./storage.js";
import { fontImports, styles } from "./styles.js";
import { syncActiveGlobals } from "./state/globals.js";
import { EntryIcon } from "./components/EntryIcon.jsx";
import { FlatResult } from "./components/FlatResult.jsx";
import { ModalContext, useAppModals, useModals } from "./components/Modals.jsx";
import { TreeItem } from "./components/TreeItem.jsx";
import { ChapterBookView } from "./views/ChapterBookView.jsx";
import { DashboardView } from "./views/DashboardView.jsx";
import { GeneralBookView } from "./views/GeneralBookView.jsx";
import { HandbookView } from "./views/HandbookView.jsx";
import { EntryView } from "./views/PageEditor.jsx";
import { ThemePanel } from "./views/ThemePanel.jsx";
import { ToolsView } from "./views/ToolsView.jsx";
import { buildWorldBackup, buildWorldMarkdown, downloadTextFile, slugify } from "./backup.js";

/* ---------- MAIN APP ---------- */
export default function WorldBuilder({ onLogout }) {
  const { confirmAction, promptValue, modalElement } = useAppModals();
  const [projects, setProjects] = useState(null);
  const [nodes, setNodes] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("node");
  const [expanded, setExpanded] = useState({});
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [handbookInitialSection, setHandbookInitialSection] = useState(null);
  const [search, setSearch] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState(null);
  useEffect(() => { setSaveErrorHandler(setSaveError); return () => setSaveErrorHandler(null); }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [themeOpen, setThemeOpen] = useState(false);
  const [skin, setSkin] = useState(DEFAULT_SKIN);
  const [elements, setElementsState] = useState(DEFAULT_ELEMENTS);
  const [roles, setRolesState] = useState(DEFAULT_ROLES);
  const [weaponTypes, setWeaponTypesState] = useState(DEFAULT_WEAPON_TYPES);
  const [armorTypes, setArmorTypesState] = useState(DEFAULT_ARMOR_TYPES);
  const [statusEffects, setStatusEffectsState] = useState(DEFAULT_STATUS_EFFECTS);
  const [typeTemplates, setTypeTemplates] = useState({});
  const [compareIds, setCompareIds] = useState([null, null]);
  // Config del Panel del mundo (fondo + tarjetas fijadas) — vive acá y no en
  // DashboardView para que los accesos fijados se puedan mostrar en la
  // franja de la barra lateral desde cualquier pantalla, no solo el Panel.
  const [dashConfig, setDashConfig] = useState(null);
  const isMobile = useIsMobile();
  const saveTimer = useRef(null);
  const templatesSaveTimer = useRef(null);
  const dashConfigSaveTimer = useRef(null);
  // Último árbol confirmado como guardado en el servidor para el proyecto
  // activo: persist() lo escribe en la clave "...:prev" justo antes de
  // pisar el árbol real, así "Restaurar última versión guardada" tiene algo
  // a dónde volver. Se reinicializa cada vez que se carga/cambia de proyecto.
  const lastSavedTreeRef = useRef(null);

  useEffect(() => {
    (async () => {
      let pj = await storageGetJSON(PROJECTS_KEY);
      if (!pj || !pj.list || !pj.list.length) {
        pj = { list: [{ id: "default", name: "Atlas de Mundos" }], activeId: "default" };
        await storageSetJSON(PROJECTS_KEY, pj);
      }
      if (!pj.list.some((p) => p.id === pj.activeId)) pj.activeId = pj.list[0].id;
      setProjects(pj);
      const th = await storageGetJSON(THEME_KEY);
      if (th) setTheme({ ...DEFAULT_THEME, ...th });
    })();
  }, []);

  useEffect(() => {
    if (!projects) return;
    setNodes(null);
    (async () => {
      const stored = await storageGetJSON(treeKeyFor(projects.activeId));
      const initial = stored && stored.length ? stored : seedNodes();
      // Si había algo guardado, ese es el punto de partida válido para
      // "versión anterior" del próximo guardado. Si el proyecto es nuevo
      // (usa el seed), no hay nada que restaurar todavía.
      lastSavedTreeRef.current = stored && stored.length ? stored : null;
      setNodes(initial);
      setSelectedId(initial[0]?.id ?? null);
      setView("dashboard");
      setExpanded({ [initial[0]?.id]: true });
      const tpl = await storageGetJSON(templatesKeyFor(projects.activeId));
      setTypeTemplates(tpl && typeof tpl === "object" ? tpl : {});
      const sk = await storageGetJSON(skinKeyFor(projects.activeId));
      setSkin(sk && typeof sk === "object" ? { ...DEFAULT_SKIN, ...sk, iconOverrides: { ...(sk.iconOverrides || {}) } } : { ...DEFAULT_SKIN });
      const els = await storageGetJSON(elementsKeyFor(projects.activeId));
      setElementsState(Array.isArray(els) && els.length ? els : DEFAULT_ELEMENTS);
      const rls = await storageGetJSON(rolesKeyFor(projects.activeId));
      setRolesState(Array.isArray(rls) && rls.length ? rls : DEFAULT_ROLES);
      const wts = await storageGetJSON(weaponTypesKeyFor(projects.activeId));
      setWeaponTypesState(Array.isArray(wts) && wts.length ? wts : DEFAULT_WEAPON_TYPES);
      const ats = await storageGetJSON(armorTypesKeyFor(projects.activeId));
      setArmorTypesState(Array.isArray(ats) && ats.length ? ats : DEFAULT_ARMOR_TYPES);
      const ses = await storageGetJSON(statusEffectsKeyFor(projects.activeId));
      setStatusEffectsState(Array.isArray(ses) && ses.length ? ses : DEFAULT_STATUS_EFFECTS);
      const dc = await storageGetJSON(dashKeyFor(projects.activeId));
      setDashConfig({ bgImageKey: dc?.bgImageKey || null, bgPreset: dc?.bgPreset || null, cards: Array.isArray(dc?.cards) ? dc.cards : [] });
    })();
  }, [projects?.activeId]);

  useEffect(() => { if (isMobile) setSidebarCollapsed(true); }, [isMobile]);

  const persist = useCallback((next) => {
    setNodes(next);
    clearTimeout(saveTimer.current);
    const pid = projects.activeId;
    const key = treeKeyFor(pid);
    saveTimer.current = setTimeout(async () => {
      // Antes de pisar el árbol guardado, conservamos lo que había hasta
      // ahora como versión N-1 (un solo nivel de respaldo, no un historial).
      const before = lastSavedTreeRef.current;
      if (before) await storageSetJSON(treeVersionKeyFor(pid), before);
      const ok = await storageSetJSON(key, next);
      if (ok) lastSavedTreeRef.current = next;
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }, 400);
  }, [projects?.activeId]);

  // Vuelve al árbol guardado justo antes del último guardado (un solo nivel
  // de respaldo). Devuelve { ok, reason } para que la UI que lo llama
  // muestre el mensaje adecuado sin tener que duplicar la lógica acá.
  async function restoreLastVersion() {
    const pid = projects.activeId;
    const prev = await storageGetJSON(treeVersionKeyFor(pid));
    if (!prev || !prev.length) return { ok: false, reason: "none" };
    if (!window.confirm("¿Restaurar la última versión guardada? Vas a perder los cambios hechos desde el guardado anterior a este.")) {
      return { ok: false, reason: "cancelled" };
    }
    const ok = await storageSetJSON(treeKeyFor(pid), prev);
    if (!ok) return { ok: false, reason: "error" };
    lastSavedTreeRef.current = prev;
    setNodes(prev);
    setSelectedId(prev[0]?.id ?? null);
    return { ok: true };
  }

  // Descarga un respaldo JSON con fidelidad completa del proyecto activo
  // (árbol de nodos + listas configurables + panel/cerebro + imágenes en
  // base64), para que exista una forma real de hacer backup del mundo.
  async function exportWorldJSON() {
    const backup = await buildWorldBackup(projects.activeId, activeProject, nodes, {
      templates: typeTemplates, skin, elements, roles, weaponTypes, armorTypes, statusEffects,
    });
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`${slugify(activeProject?.name)}-respaldo-${date}.json`, JSON.stringify(backup, null, 2), "application/json");
  }

  // Formato secundario, legible: un único .md con todo el árbol volcado en
  // orden jerárquico. No tiene la fidelidad completa del JSON (no incluye
  // imágenes ni datos estructurados de cada bloque), es para leer el mundo
  // fuera de la app.
  function exportWorldMarkdown() {
    const md = buildWorldMarkdown(activeProject?.name || "Mundo", nodes);
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`${slugify(activeProject?.name)}-respaldo-${date}.md`, md, "text/markdown");
  }

  function updateTheme(patch) {
    const next = { ...theme, ...patch };
    setTheme(next);
    storageSetJSON(THEME_KEY, next);
  }

  function updateSkin(patch) {
    const next = { ...skin, ...patch };
    setSkin(next);
    storageSetJSON(skinKeyFor(projects.activeId), next);
  }

  const saveDashConfig = useCallback((next) => {
    setDashConfig(next);
    clearTimeout(dashConfigSaveTimer.current);
    const key = dashKeyFor(projects.activeId);
    dashConfigSaveTimer.current = setTimeout(() => storageSetJSON(key, next), 500);
  }, [projects?.activeId]);
  const pinnedCards = useMemo(() => {
    if (!dashConfig || !nodes) return [];
    return dashConfig.cards.map((c) => ({ card: c, node: findNode(nodes, c.nodeId) })).filter((x) => x.node);
  }, [dashConfig, nodes]);
  function unpinCard(cardId) {
    saveDashConfig({ ...dashConfig, cards: dashConfig.cards.filter((c) => c.id !== cardId) });
  }

  function updateElements(next) {
    setElementsState(next);
    storageSetJSON(elementsKeyFor(projects.activeId), next);
  }

  function updateRoles(next) {
    setRolesState(next);
    storageSetJSON(rolesKeyFor(projects.activeId), next);
  }

  function updateWeaponTypes(next) {
    setWeaponTypesState(next);
    storageSetJSON(weaponTypesKeyFor(projects.activeId), next);
  }

  function updateArmorTypes(next) {
    setArmorTypesState(next);
    storageSetJSON(armorTypesKeyFor(projects.activeId), next);
  }

  function updateStatusEffects(next) {
    setStatusEffectsState(next);
    storageSetJSON(statusEffectsKeyFor(projects.activeId), next);
  }

  const saveTypeTemplates = useCallback((next) => {
    setTypeTemplates(next);
    clearTimeout(templatesSaveTimer.current);
    const key = templatesKeyFor(projects.activeId);
    templatesSaveTimer.current = setTimeout(() => storageSetJSON(key, next), 400);
  }, [projects?.activeId]);

  function saveProjects(pj) { setProjects(pj); storageSetJSON(PROJECTS_KEY, pj); }
  function switchProject(id) { saveProjects({ ...projects, activeId: id }); }
  async function addProject() {
    const name = await promptValue("Nombre de la nueva campaña / proyecto:");
    if (!name) return;
    const p = { id: uid(), name };
    saveProjects({ list: [...projects.list, p], activeId: p.id });
  }
  function renameProject(name) {
    if (!name.trim()) return;
    saveProjects({
      ...projects,
      list: projects.list.map((p) => p.id === projects.activeId ? { ...p, name: name.trim() } : p),
    });
  }
  async function deleteProject() {
    if (projects.list.length <= 1) { window.alert("Debe existir al menos un proyecto."); return; }
    const cur = projects.list.find((p) => p.id === projects.activeId);
    if (!(await confirmAction(`¿Quitar el proyecto "${cur.name}" de la lista? Sus datos quedarán archivados pero dejarán de mostrarse.`, { danger: true, confirmLabel: "Quitar" }))) return;
    const list = projects.list.filter((p) => p.id !== projects.activeId);
    saveProjects({ list, activeId: list[0].id });
  }

  const activeProject = projects?.list.find((p) => p.id === projects.activeId);

  if (!projects || !nodes) {
    return (
      <div style={{ ...styles.loadingShell, background: DEFAULT_THEME.bg }}>
        <div style={{ ...styles.loadingSeal, borderColor: DEFAULT_THEME.accent }}><ScrollText size={28} color={DEFAULT_THEME.accent} /></div>
        <div style={{ color: DEFAULT_THEME.text, fontFamily: "'Manrope', sans-serif", fontSize: 18, marginTop: 12 }}>
          Desenrollando el mapa…
        </div>
      </div>
    );
  }

  const selected = findNode(nodes, selectedId);

  function addNode(type, parentId) {
    const names = { folder: "Nueva carpeta", map: "Nuevo mapa", timeline: "Nueva línea de tiempo", board: "Nueva pizarra", page: "Nueva página" };
    const node = { id: uid(), parentId: parentId ?? null, order: nextOrder(nodes, parentId ?? null), type, name: names[type] || "Nueva página", content: "", content2: "" };
    if (type === "map") { node.mapImageKey = null; node.pins = []; }
    if (type === "timeline") { node.events = []; }
    if (type === "board") { node.boardNodes = []; node.boardEdges = []; node.boardShapes = []; }
    persist([...nodes, node]);
    setSelectedId(node.id); setView("node");
    if (parentId) setExpanded((e) => ({ ...e, [parentId]: true }));
    if (isMobile) setSidebarCollapsed(true);
  }

  // Crea una entrada de catálogo (Objeto/Habilidad/Personaje) con su bloque
  // de estadísticas ya puesto, desde el botón "+ Nuevo..." de un catálogo.
  function addCatalogEntry(category, blockType, name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nueva entrada", content: "", content2: "",
      category, blocks: [makeBlock(blockType)],
    };
    persist([...nodes, node]);
    setSelectedId(node.id); setView("node");
    if (isMobile) setSidebarCollapsed(true);
  }

  // Crea una Clase nueva sin salir del Libro de clases (a diferencia de
  // addCatalogEntry, no navega — el libro elige su propia pestaña activa).
  // `linkTo` opcional para crear-y-asignar de una (ej. agregarla a las
  // classIds de un personaje al vuelo desde la Ficha).
  function addClass(name, linkTo) {
    return createLinkedNode({
      name: name || "Nueva clase", category: "class", blocks: [makeBlock("classSummary")],
      classDescription: "", classBonuses: {}, classRestrictions: "", classRoles: [],
    }, linkTo);
  }
  // Crea una Subclase (también categoría "class", pero con parentClassId) para la
  // pestaña lateral del libro. No aparece en las pestañas superiores de clases.
  function addSubclass(parentClassId, name, linkTo) {
    return createLinkedNode({
      name: name || "Nueva subclase", category: "class", blocks: [makeBlock("classSummary")],
      classDescription: "", classBonuses: {}, classRestrictions: "", classRoles: [],
      parentClassId, awakenWeaponId: null,
    }, linkTo);
  }
  // Crea una Habilidad ya restringida a la clase dada, para la pestaña "+" del libro.
  // `prereqSkillId` opcional: la crea ya encadenada como siguiente talento de
  // otra habilidad (el "+" del Árbol de talentos), sin tener que abrir la
  // habilidad nueva y elegir "Requiere" a mano. No hace falta createLinkedNode
  // acá porque prereqSkillId es un campo de la habilidad NUEVA, no de un nodo
  // existente al que haya que volver a guardar.
  function addSkillForClass(classId, name, prereqSkillId) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nueva habilidad", content: "", content2: "",
      category: "skill", blocks: [{ ...makeBlock("skillInfo"), usableBy: classId, prereqSkillId: prereqSkillId || null }],
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea un Enemigo o Jefe con sus 4 bloques del Bestiario ya listos
  // (amenaza, estadísticas, resistencias, botín), sin salir del libro.
  function addMonster(category, name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || (category === "boss" ? "Nuevo jefe" : "Nuevo enemigo"), content: "", content2: "",
      category,
      blocks: [makeBlock("threatLevel"), makeBlock("charStats"), makeBlock("resistances"), makeBlock("lootTable")],
      monsterDescription: "",
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea un nodo nuevo y, en el mismo guardado, parchea OTRO nodo para que
  // apunte a él (ej. la receta que lo tiene como resultado, la habilidad que
  // enseña un objeto, o una lista de ids como classIds/entries). Hace falta
  // este único-persist en vez de "crear" + "asignar" como dos llamadas
  // separadas: persist()/updateNode() no son updaters funcionales, así que si
  // dos altas ocurren en el mismo evento, la segunda parte del mismo `nodes`
  // viejo de este render y pisa silenciosamente lo que hizo la primera.
  // `linkTo.blockId` es opcional: si se pasa, `apply(block, newId)` recibe el
  // bloque a parchear (caso más común); si no, `apply(node, newId)` recibe el
  // nodo entero, para parchear un campo propio del nodo (ej. classIds).
  function createLinkedNode(fields, linkTo) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      content: "", content2: "", ...fields,
    };
    let nextNodes = [...nodes, node];
    if (linkTo) {
      nextNodes = nextNodes.map((n) => {
        if (n.id !== linkTo.nodeId) return n;
        if (linkTo.blockId) {
          return { ...n, blocks: getPageBlocks(n).map((b) => (b.id === linkTo.blockId ? linkTo.apply(b, node.id) : b)) };
        }
        return linkTo.apply(n, node.id);
      });
    }
    persist(nextNodes);
    return node.id;
  }
  // Crea un Objeto con su bloque de estadísticas ya puesto, sin salir del
  // Libro de objetos (a diferencia de addCatalogEntry, no navega). `linkTo`
  // opcional para crear-y-asignar de una (ver createLinkedNode).
  function addObjectItem(name, linkTo) {
    return createLinkedNode({ name: name || "Nuevo objeto", category: "object", blocks: [makeBlock("itemStats")] }, linkTo);
  }
  // Crea una Habilidad "suelta" (usableBy: "any", el valor por defecto de
  // skillInfo) sin salir de donde se la está asignando — para no obligar a
  // ir primero al Libro de clases/personajes solo para poder elegirla acá.
  function addSkillItem(name, linkTo) {
    return createLinkedNode({ name: name || "Nueva habilidad", category: "skill", blocks: [makeBlock("skillInfo")] }, linkTo);
  }
  // Copia los stats de itemStats (bonos, tipo de arma/armadura, elemento,
  // rareza, etc — no el nombre ni las recetas/habilidad que enseña propias)
  // de `sourceId` hacia `targetId`, y de paso agrega en el origen una receta
  // que apunta a `targetId` como resultado (si no existía ya) — todo en un
  // único persist() por la misma razón que createLinkedNode: son dos nodos
  // EXISTENTES a la vez, así que dos updateNode() separados en el mismo
  // evento pisarían uno al otro.
  function cloneItemStats(targetId, sourceId) {
    if (!sourceId || targetId === sourceId) return;
    const target = nodes.find((n) => n.id === targetId);
    const source = nodes.find((n) => n.id === sourceId);
    const targetBlock = target && getPageBlocks(target).find((b) => b.type === "itemStats");
    const sourceBlock = source && getPageBlocks(source).find((b) => b.type === "itemStats");
    if (!targetBlock || !sourceBlock) return;
    const { id: _id, recipes: _recipes, teachesSkillId: _t, apToMaster: _a, ...clonable } = sourceBlock;
    const alreadyLinked = (sourceBlock.recipes || []).some((r) => r.resultItemId === targetId);
    persist(nodes.map((n) => {
      if (n.id === targetId) {
        return { ...n, blocks: getPageBlocks(n).map((b) => (b.id === targetBlock.id ? { ...b, ...clonable } : b)) };
      }
      if (n.id === sourceId && !alreadyLinked) {
        return { ...n, blocks: getPageBlocks(n).map((b) => (b.id === sourceBlock.id
          ? { ...b, recipes: [...(b.recipes || []), { id: uid(), resultItemId: targetId, materials: [], gold: 0, notes: "" }] }
          : b)) };
      }
      return n;
    }));
  }
  // Igual que addObjectItem, pero además puede clonar los stats de un objeto
  // existente hacia el nodo recién creado (checkbox "copiar stats" del "+" en
  // el Árbol de mejoras) — sigue siendo un único createLinkedNode/persist.
  function addObjectItemFrom(name, sourceId, linkTo) {
    const source = sourceId ? nodes.find((n) => n.id === sourceId) : null;
    const sourceBlock = source ? getPageBlocks(source).find((b) => b.type === "itemStats") : null;
    const { id: _id, recipes: _recipes, teachesSkillId: _t, apToMaster: _a, ...clonable } = sourceBlock || {};
    return createLinkedNode({ name: name || "Nuevo objeto", category: "object", blocks: [{ ...makeBlock("itemStats"), ...clonable }] }, linkTo);
  }
  // Igual que addObjectItem, pero ya con el slot en "Consumible" puesto, para
  // el botón "+ Nuevo consumible" de la pestaña de Crafteo del Libro de objetos.
  function addConsumableItem(name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nuevo consumible", content: "", content2: "",
      category: "object", blocks: [{ ...makeBlock("itemStats"), itemSlot: "Consumible" }],
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea un Estado alterado nuevo (Buff/Debuff), sin salir de su sección del
  // Gran Libro. Es una entrada liviana a propósito: solo el punto de partida
  // para documentar cada estado más adelante (ver StatusEffectInfoBlock).
  function addStatusEffect(name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nuevo estado alterado", content: "", content2: "",
      category: "statusEffect", blocks: [makeBlock("statusEffectInfo")],
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea un Set de equipo nuevo (ver StatusEffect: misma idea de entrada
  // liviana). Los objetos se suman al set eligiéndolo desde su propia ficha
  // (setId en itemStats), no al revés, para no duplicar la lista de miembros.
  function addItemSet(name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nuevo set", content: "", content2: "",
      category: "itemSet", blocks: [makeBlock("setInfo")],
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea un Beat nuevo, ya vinculado al Capítulo desde el que se creó (el
  // Guion ahora vive dentro del Libro de historia). El orden por defecto es
  // el siguiente disponible DENTRO de ese capítulo, no el total global.
  function addBeat(chapterId, name) {
    const siblings = nodes.filter((n) => {
      if (n.category !== "beat") return false;
      if (!chapterId) return true;
      const b = getPageBlocks(n).find((x) => x.type === "beatInfo");
      return b?.chapterId === chapterId;
    });
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nuevo beat", content: "", content2: "",
      category: "beat", blocks: [{ ...makeBlock("beatInfo"), chapterId: chapterId || null, order: siblings.length + 1 }],
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea una Escena ya vinculada al Beat dado (a diferencia de addItemSet,
  // acá el vínculo se preestablece porque siempre nace desde dentro de un
  // Beat en el Libro de guion).
  function addScene(beatId, name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nueva escena", content: "", content2: "",
      category: "scene", blocks: [{ ...makeBlock("sceneInfo"), beatId: beatId || null }],
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea un Capítulo, sin salir del Libro de historia.
  function addChapter(name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nuevo capítulo", content: "", content2: "",
      category: "chapter", blocks: [],
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea un Lugar/Acontecimiento/Misión/NPC ya asignado a un capítulo, desde
  // el propio Libro de historia (a diferencia de addCatalogEntry, no navega).
  function addChapterEntry(category, chapterId, name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nueva entrada", content: "", content2: "",
      category, blocks: [], chapterId,
    };
    persist([...nodes, node]);
    return node.id;
  }
  // Crea un Personaje con sus 3 bloques del Libro de personajes ya listos
  // (estadísticas, resistencias, relaciones), sin salir del libro. `linkTo`
  // opcional para crear-y-asignar de una (ej. agregarlo como relación de otro
  // personaje al vuelo desde la Ficha).
  function addCharacter(name, linkTo) {
    return createLinkedNode({
      name: name || "Nuevo personaje", category: "character",
      blocks: [makeBlock("charStats"), makeBlock("resistances"), makeBlock("relations"), makeBlock("appearances")],
    }, linkTo);
  }
  // Copia clases, atributos y resistencias de `sourceId` hacia `targetId` (no
  // el nombre, retrato, historia, relaciones ni habilidades propias — la
  // "identidad" queda intacta, solo se clona el "build"). A diferencia de
  // cloneItemStats, no hace falta tocar el origen, así que es un único nodo
  // en el persist — no hay riesgo de la carrera de dos updateNode().
  function cloneCharacterStats(targetId, sourceId) {
    if (!sourceId || targetId === sourceId) return;
    const target = nodes.find((n) => n.id === targetId);
    const source = nodes.find((n) => n.id === sourceId);
    if (!target || !source) return;
    const targetStats = getPageBlocks(target).find((b) => b.type === "charStats");
    const sourceStats = getPageBlocks(source).find((b) => b.type === "charStats");
    const targetResist = getPageBlocks(target).find((b) => b.type === "resistances");
    const sourceResist = getPageBlocks(source).find((b) => b.type === "resistances");
    const { id: _s1, ...statsClonable } = sourceStats || {};
    const { id: _s2, ...resistClonable } = sourceResist || {};
    persist(nodes.map((n) => {
      if (n.id !== targetId) return n;
      return {
        ...n, classIds: source.classIds ? [...source.classIds] : n.classIds, symbiontIds: source.symbiontIds ? [...source.symbiontIds] : n.symbiontIds,
        blocks: getPageBlocks(n).map((b) => {
          if (targetStats && b.id === targetStats.id) return { ...b, ...statsClonable };
          if (targetResist && b.id === targetResist.id) return { ...b, ...resistClonable };
          return b;
        }),
      };
    }));
  }
  // Copia roles/bonificaciones/restricciones de `sourceId` hacia `targetId`
  // (no el nombre ni la descripción — la "identidad" queda intacta, se clona
  // el "build" mecánico). classRoles/classBonuses/classRestrictions viven
  // directo en el nodo de la clase (no en un bloque), así que es un patch de
  // un único nodo — sin riesgo de la carrera de dos updateNode().
  function cloneClassStats(targetId, sourceId) {
    if (!sourceId || targetId === sourceId) return;
    const source = nodes.find((n) => n.id === sourceId);
    if (!source) return;
    persist(nodes.map((n) => (n.id === targetId
      ? { ...n, classRoles: [...(source.classRoles || [])], classBonuses: { ...(source.classBonuses || {}) }, classRestrictions: source.classRestrictions || "" }
      : n)));
  }
  // Sets de equipo y Estados alterados son entradas de un solo bloque (sin
  // reverse-link ni campos propios del nodo como classIds) — clonar es
  // simplemente copiar todos los campos del bloque salvo el id, igual que
  // cloneItemStats pero sin la parte de recetas.
  function cloneSetInfo(targetId, sourceId) {
    if (!sourceId || targetId === sourceId) return;
    const target = nodes.find((n) => n.id === targetId);
    const source = nodes.find((n) => n.id === sourceId);
    const targetBlock = target && getPageBlocks(target).find((b) => b.type === "setInfo");
    const sourceBlock = source && getPageBlocks(source).find((b) => b.type === "setInfo");
    if (!targetBlock || !sourceBlock) return;
    const { id: _id, ...clonable } = sourceBlock;
    persist(nodes.map((n) => (n.id === targetId
      ? { ...n, blocks: getPageBlocks(n).map((b) => (b.id === targetBlock.id ? { ...b, ...clonable } : b)) }
      : n)));
  }
  function cloneStatusEffectInfo(targetId, sourceId) {
    if (!sourceId || targetId === sourceId) return;
    const target = nodes.find((n) => n.id === targetId);
    const source = nodes.find((n) => n.id === sourceId);
    const targetBlock = target && getPageBlocks(target).find((b) => b.type === "statusEffectInfo");
    const sourceBlock = source && getPageBlocks(source).find((b) => b.type === "statusEffectInfo");
    if (!targetBlock || !sourceBlock) return;
    const { id: _id, ...clonable } = sourceBlock;
    persist(nodes.map((n) => (n.id === targetId
      ? { ...n, blocks: getPageBlocks(n).map((b) => (b.id === targetBlock.id ? { ...b, ...clonable } : b)) }
      : n)));
  }
  // Crea una Habilidad ya restringida a ESTE personaje (a diferencia de
  // addSkillForClass, que la restringe a una clase), desde el Libro de
  // personajes. No navega.
  function addSkillForCharacter(characterId, name) {
    const node = {
      id: uid(), parentId: null, order: nextOrder(nodes, null), type: "page",
      name: name || "Nueva habilidad", content: "", content2: "",
      category: "skill", blocks: [{ ...makeBlock("skillInfo"), usableBy: characterId }],
    };
    persist([...nodes, node]);
    return node.id;
  }

  // Eliminar es irreversible (no hay undo) — siempre se confirma, y si el
  // nodo tiene hijos el mensaje lo dice explícitamente para que la cascada
  // nunca sea una sorpresa.
  async function deleteNode(id) {
    const target = nodes.find((n) => n.id === id);
    if (!target) return;
    const toRemove = new Set(descendantIds(nodes, id));
    const childCount = toRemove.size - 1;
    const message = childCount > 0
      ? `¿Eliminar "${target.name}" y ${childCount === 1 ? "la entrada que contiene" : `las ${childCount} entradas que contiene`}? Esta acción no se puede deshacer.`
      : `¿Eliminar "${target.name}"? Esta acción no se puede deshacer.`;
    if (!(await confirmAction(message, { danger: true, confirmLabel: "Eliminar" }))) return;
    // Al filtrar los nodos borrados, otras partes de los datos (recetas,
    // relaciones, clases/simbiontes asignados, etc.) pueden quedar apuntando
    // a un id que ya no existe — sanitizeReferences limpia esos campos rotos
    // sin cascadear el borrado (ver su comentario para el detalle completo).
    const next = sanitizeReferences(nodes.filter((n) => !toRemove.has(n.id)), toRemove);
    persist(next);
    if (toRemove.has(selectedId)) setSelectedId(next[0]?.id ?? null);
  }

  // Al renombrar, también reescribe cualquier [[nombre viejo]] ya escrito en
  // otras páginas — si no, el enlace queda apuntando a un nombre que ya no
  // existe (ver renameLinksEverywhere).
  function renameNode(id, name) {
    const target = nodes.find((n) => n.id === id);
    let next = nodes.map((n) => (n.id === id ? { ...n, name } : n));
    if (target) next = renameLinksEverywhere(next, target.name, name);
    persist(next);
  }
  function updateNode(id, patch) { persist(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n))); }

  function updateNodeWithLinks(id, patch, textToScan) {
    let next = nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
    const names = extractWikiNames(textToScan);
    const missing = names.filter(
      (nm) => nm && !next.some((n) => n.name.toLowerCase() === nm.toLowerCase())
    );
    if (missing.length) {
      let unassigned = next.find((n) => n.type === "folder" && n.parentId === null && n.name === UNASSIGNED_FOLDER);
      if (!unassigned) {
        unassigned = { id: uid(), parentId: null, order: nextOrder(next, null), type: "folder", name: UNASSIGNED_FOLDER, content: "", content2: "" };
        next = [...next, unassigned];
      }
      const seen = new Set();
      missing.forEach((nm) => {
        const lower = nm.toLowerCase();
        if (seen.has(lower)) return;
        seen.add(lower);
        next = [...next, { id: uid(), parentId: unassigned.id, order: nextOrder(next, unassigned.id), type: "page", name: nm, content: "", content2: "" }];
      });
    }
    persist(next);
  }

  function moveNode(dragId, targetId, mode) {
    if (dragId === targetId) return;
    const desc = new Set(descendantIds(nodes, dragId));
    if (desc.has(targetId)) return;
    const target = findNode(nodes, targetId);
    if (!target) return;
    let next;
    if (mode === "into") {
      next = nodes.map((n) => n.id === dragId ? { ...n, parentId: targetId, order: nextOrder(nodes, targetId) } : n);
      setExpanded((e) => ({ ...e, [targetId]: true }));
    } else {
      const parentId = target.parentId;
      const siblings = childrenOf(nodes, parentId).filter((s) => s.id !== dragId);
      const idx = siblings.findIndex((s) => s.id === targetId);
      const reordered = [...siblings.slice(0, idx + 1), findNode(nodes, dragId), ...siblings.slice(idx + 1)];
      const orderMap = {};
      reordered.forEach((s, i) => { orderMap[s.id] = i; });
      next = nodes.map((n) => {
        if (n.id === dragId) return { ...n, parentId, order: orderMap[dragId] };
        if (orderMap[n.id] !== undefined) return { ...n, order: orderMap[n.id] };
        return n;
      });
    }
    persist(next);
  }

  function moveToRoot(dragId) {
    persist(nodes.map((n) => n.id === dragId ? { ...n, parentId: null, order: nextOrder(nodes, null) } : n));
  }

  function navigateByName(name) {
    const target = nodes.find((n) => n.name.toLowerCase() === name.trim().toLowerCase());
    if (target) navigateToId(target.id);
  }
  function trackView(id) {
    setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 6));
  }
  function navigateToId(id) {
    setSelectedId(id); setView("node"); trackView(id);
    const p = pathTo(nodes, id);
    setExpanded((e) => { const ne = { ...e }; p.forEach((n) => (ne[n.id] = true)); return ne; });
    if (isMobile) setSidebarCollapsed(true);
  }
  function selectAndMaybeCollapse(id) {
    setSelectedId(id); setView("node"); trackView(id);
    if (isMobile) setSidebarCollapsed(true);
  }

  syncActiveGlobals({
    iconOverrides: skin.iconOverrides || {},
    elements, updateElements,
    roles, updateRoles,
    weaponTypes, updateWeaponTypes,
    armorTypes, updateArmorTypes,
    statusEffects, updateStatusEffects,
  });

  const r = typeof theme.radius === "number" ? theme.radius : 10;
  const themeVars = {
    "--bg": theme.bg, "--panel": theme.panel, "--panel2": theme.panel2,
    "--border": theme.border, "--accent": theme.accent, "--text": theme.text, "--muted": theme.muted,
    "--radius-sm": Math.round(r * 0.5) + "px",
    "--radius-md": r + "px",
    "--radius-lg": Math.round(r * 1.5) + "px",
    "--radius-pill": Math.round(r * 2) + "px",
    "--grid-line": "color-mix(in srgb, var(--accent) 7%, transparent)",
    "--app-bg": [
      "radial-gradient(120% 90% at 80% 0%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 55%)",
      "linear-gradient(180deg, color-mix(in srgb, var(--bg) 92%, black) 0%, var(--bg) 100%)",
      "repeating-linear-gradient(var(--grid-line), var(--grid-line) 1px, transparent 1px, transparent 26px)",
      "repeating-linear-gradient(90deg, var(--grid-line), var(--grid-line) 1px, transparent 1px, transparent 26px)",
    ].join(", "),
  };

  return (
    <ModalContext.Provider value={{ confirmAction, promptValue }}>
    <div style={{ ...styles.app, ...themeVars }}>
      <style>{fontImports}</style>

      {isMobile && !sidebarCollapsed && (
        <div style={styles.backdrop} onClick={() => setSidebarCollapsed(true)} />
      )}

      {!sidebarCollapsed && (
        <Sidebar
          nodes={nodes} selectedId={selectedId} setSelectedId={selectAndMaybeCollapse}
          navigateToId={navigateToId} recentlyViewed={recentlyViewed.map((id) => findNode(nodes, id)).filter(Boolean)}
          expanded={expanded} setExpanded={setExpanded} search={search} setSearch={setSearch}
          addNode={addNode} deleteNode={deleteNode} renameNode={renameNode}
          moveNode={moveNode} moveToRoot={moveToRoot} updateNode={updateNode}
          onCollapse={() => setSidebarCollapsed(true)} isMobile={isMobile} onLogout={onLogout}
          openDashboard={() => { setView("dashboard"); if (isMobile) setSidebarCollapsed(true); }}
          dashActive={view === "dashboard"}
          openBrain={() => { setHandbookInitialSection("brain"); setView("handbook"); if (isMobile) setSidebarCollapsed(true); }}
          brainActive={view === "handbook" && handbookInitialSection === "brain"}
          openGeneralBook={() => { setView("generalBook"); if (isMobile) setSidebarCollapsed(true); }}
          generalBookActive={view === "generalBook"}
          openStoryBook={() => { setView("storyBook"); if (isMobile) setSidebarCollapsed(true); }}
          storyBookActive={view === "storyBook"}
          openHandbook={() => { setHandbookInitialSection(null); setView("handbook"); if (isMobile) setSidebarCollapsed(true); }}
          handbookActive={view === "handbook"}
          openTools={() => { setView("tools"); if (isMobile) setSidebarCollapsed(true); }}
          toolsActive={view === "tools"}
          openTheme={() => setThemeOpen(true)}
          projects={projects} activeProject={activeProject}
          switchProject={switchProject} addProject={addProject}
          renameProject={renameProject} deleteProject={deleteProject}
          skin={skin} pinnedCards={pinnedCards} unpinCard={unpinCard}
        />
      )}
      {sidebarCollapsed && (
        <button style={styles.expandHandle} onClick={() => setSidebarCollapsed(false)} title="Mostrar panel">
          <PanelLeftOpen size={16} color="var(--text)" />
        </button>
      )}
      <main style={styles.main}>
        <div className="app-scan-sweep" />
        <TopBar selected={view === "node" ? selected : null} dashMode={view === "dashboard"} nodes={nodes} savedFlash={savedFlash} saveError={saveError} isMobile={isMobile} />
        {view === "dashboard" ? (
          <DashboardView key={projects.activeId} nodes={nodes} navigateToId={navigateToId} isMobile={isMobile}
            dashBgKey={dashBgKeyFor(projects.activeId)} skin={skin} config={dashConfig} saveConfig={saveDashConfig}
            openGeneralBook={() => { setView("generalBook"); if (isMobile) setSidebarCollapsed(true); }}
            openStoryBook={() => { setView("storyBook"); if (isMobile) setSidebarCollapsed(true); }}
            openHandbook={() => { setView("handbook"); if (isMobile) setSidebarCollapsed(true); }} />
        ) : view === "generalBook" ? (
          <GeneralBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode} deleteNode={deleteNode}
            addClass={addClass} addSubclass={addSubclass} addSkillForClass={addSkillForClass} cloneClassStats={cloneClassStats}
            addMonster={addMonster} addObjectItem={addObjectItem} addConsumableItem={addConsumableItem} addSkillItem={addSkillItem}
            cloneItemStats={cloneItemStats} addObjectItemFrom={addObjectItemFrom}
            addCharacter={addCharacter} addSkillForCharacter={addSkillForCharacter} cloneCharacterStats={cloneCharacterStats} addStatusEffect={addStatusEffect}
            cloneStatusEffectInfo={cloneStatusEffectInfo}
            addItemSet={addItemSet} cloneSetInfo={cloneSetInfo} navigateByName={navigateByName}
            isMobile={isMobile} />
        ) : view === "storyBook" ? (
          <ChapterBookView nodes={nodes} navigateToId={navigateToId} updateNode={updateNode}
            addChapter={addChapter} addChapterEntry={addChapterEntry} addBeat={addBeat} addScene={addScene}
            navigateByName={navigateByName} deleteNode={deleteNode} isMobile={isMobile} />
        ) : view === "handbook" ? (
          <HandbookView nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry}
            brainKey={brainKeyFor(projects.activeId)} relBrainKey={relBrainKeyFor(projects.activeId)} isMobile={isMobile}
            initialSection={handbookInitialSection} />
        ) : view === "tools" ? (
          <ToolsView typeTemplates={typeTemplates} saveTypeTemplates={saveTypeTemplates}
            nodes={nodes} compareIds={compareIds} setCompareIds={setCompareIds}
            updateNode={updateNode} updateNodeWithLinks={updateNodeWithLinks} renameNode={renameNode} addNode={addNode}
            skin={skin} setSearch={setSearch} isMobile={isMobile}
            onExportJSON={exportWorldJSON} onExportMarkdown={exportWorldMarkdown} onRestoreLastVersion={restoreLastVersion} />
        ) : (
          <EntryView node={selected} nodes={nodes} updateNode={updateNode} updateNodeWithLinks={updateNodeWithLinks}
            renameNode={renameNode}
            navigateByName={navigateByName} navigateToId={navigateToId} isMobile={isMobile}
            typeTemplates={typeTemplates} addNode={addNode} skin={skin} setSearch={setSearch}
            addObjectItem={addObjectItem} addCharacter={addCharacter} />
        )}
      </main>

      {themeOpen && (
        <ThemePanel theme={theme} updateTheme={updateTheme} skin={skin} updateSkin={updateSkin} onClose={() => setThemeOpen(false)} isMobile={isMobile} />
      )}
      {modalElement}
    </div>
    </ModalContext.Provider>
  );
}

/* ---------- TOP BAR ---------- */
export function TopBar({ selected, dashMode, nodes, savedFlash, saveError, isMobile }) {
  const crumbs = selected ? pathTo(nodes, selected.id) : [];
  return (
    <div style={styles.topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", whiteSpace: "nowrap", flex: 1, paddingLeft: isMobile ? 40 : 0 }}>
        {dashMode ? (
          <span style={{ color: "var(--text)", fontSize: isMobile ? 13 : 15, fontFamily: "'Orbitron', sans-serif" }}>
            <LayoutDashboard size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />Panel del mundo
          </span>
        ) : crumbs.map((c, i) => (
          <React.Fragment key={c.id}>
            {i > 0 && <ChevronRight size={14} color="var(--muted)" />}
            <span style={{ color: i === crumbs.length - 1 ? "var(--text)" : "var(--muted)", fontSize: isMobile ? 12.5 : 14, fontFamily: "'Manrope', sans-serif" }}>
              {c.name}
            </span>
          </React.Fragment>
        ))}
      </div>
      {saveError ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#c45c5c", fontSize: 11.5, flexShrink: 0 }}>
          <CircleAlert size={13} />
          {!isMobile && "No se pudo guardar"}
          <button onClick={saveError.retry} style={{ background: "none", border: "1px solid #c45c5c", color: "#c45c5c", borderRadius: "var(--radius-sm, 4px)", fontSize: 11, padding: "2px 8px", cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      ) : (
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: savedFlash ? "var(--accent)" : "var(--muted)", fontSize: 11.5, transition: "color .3s", flexShrink: 0, opacity: savedFlash ? 1 : 0.5 }}>
        <Save size={13} />
        {!isMobile && (savedFlash ? "Guardado" : "Autoguardado")}
      </div>
      )}
    </div>
  );
}

/* ---------- SIDEBAR ---------- */
export function Sidebar({ nodes, selectedId, setSelectedId, navigateToId, recentlyViewed, expanded, setExpanded, search, setSearch, addNode, deleteNode, renameNode, moveNode, updateNode, moveToRoot, onCollapse, isMobile, openGeneralBook, generalBookActive, openStoryBook, storyBookActive, openHandbook, handbookActive, openBrain, brainActive, openTools, toolsActive, openDashboard, dashActive, openTheme, projects, activeProject, switchProject, addProject, renameProject, deleteProject, skin, onLogout, pinnedCards, unpinCard }) {
  const { confirmAction } = useModals();
  const roots = childrenOf(nodes, null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(activeProject?.name || "");
  const [navExpanded, setNavExpanded] = useState(false);
  useEffect(() => { setTitleDraft(activeProject?.name || ""); setEditingTitle(false); }, [activeProject?.id, activeProject?.name]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return nodes
      .map((n) => {
        const nameMatch = n.name.toLowerCase().includes(q);
        if (nameMatch) return { node: n, snippet: null };
        const text = stripMarkup(nodeAllText(n));
        if (!text.toLowerCase().includes(q)) return null;
        return { node: n, snippet: findSnippetAround(text, search.trim()) };
      })
      .filter(Boolean);
  }, [search, nodes]);

  const isPixel = skin?.uiSkin === "pixel";
  const pixelBtn = PIXEL_BUTTONS[skin?.pixelButton] || PIXEL_BUTTONS.teal;
  const navActions = {
    dashboard: { onClick: openDashboard, active: dashActive, label: "Panel del mundo", icon: Compass },
    brain: { onClick: openBrain, active: brainActive, label: "Cerebro", icon: Network },
    generalBook: { onClick: openGeneralBook, active: generalBookActive, label: "Gran Libro", icon: BookOpen },
    storyBook: { onClick: openStoryBook, active: storyBookActive, label: "Libro de historia", icon: ScrollText },
    handbook: { onClick: openHandbook, active: handbookActive, label: "Bitácora", icon: NotebookText },
    tools: { onClick: openTools, active: toolsActive, label: "Herramientas", icon: Wrench },
  };
  const ALWAYS_VISIBLE_NAV = ["dashboard", "brain"];
  const navOrder = [...((skin?.navOrder && skin.navOrder.length) ? skin.navOrder : DEFAULT_SKIN.navOrder)];
  Object.keys(navActions).forEach((k) => { if (!navOrder.includes(k)) navOrder.push(k); });

  return (
    <aside style={isMobile ? styles.sidebarMobile : styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.brandSeal}><Crown size={16} color="var(--bg)" /></div>
        {editingTitle ? (
          <input autoFocus value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => { setEditingTitle(false); renameProject(titleDraft); }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            style={{ ...styles.renameInput, fontFamily: "'Orbitron', sans-serif", fontSize: 14 }} />
        ) : (
          <span onDoubleClick={() => setEditingTitle(true)} title="Doble clic para renombrar"
            style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, color: "var(--text)", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "text" }}>
            {activeProject?.name}
          </span>
        )}
        <button onClick={() => setEditingTitle(true)} style={{ ...styles.collapseBtn, marginLeft: "auto" }} title="Renombrar título">
          <Pencil size={13} color="var(--muted)" />
        </button>
        <button onClick={openTheme} style={styles.collapseBtn} title="Personalizar colores">
          <Settings size={15} color="var(--muted)" />
        </button>
        <button onClick={onCollapse} style={styles.collapseBtn} title="Contraer panel">
          <PanelLeftClose size={16} color="var(--muted)" />
        </button>
        <button onClick={async () => { if (await confirmAction("¿Cerrar sesión?")) onLogout(); }} style={styles.collapseBtn} title="Cerrar sesión">
          <LogOut size={15} color="var(--muted)" />
        </button>
      </div>

      <div style={styles.projectRow}>
        <select value={projects.activeId} onChange={(e) => switchProject(e.target.value)} style={{ ...styles.pinSelect, flex: 1 }}>
          {projects.list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button style={styles.miniBtn} onClick={addProject} title="Nueva campaña / proyecto"><Plus size={12} /></button>
        <button style={{ ...styles.miniBtn, color: "#c45c5c" }} onClick={deleteProject} title="Quitar proyecto actual"><Trash2 size={12} /></button>
      </div>

      <div style={styles.searchBox}>
        <Search size={14} color="var(--muted)" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o contenido…" style={styles.searchInput} />
        {search && <X size={14} color="var(--muted)" style={{ cursor: "pointer" }} onClick={() => setSearch("")} />}
      </div>

      {isPixel ? (
        <>
          {navOrder.map((key) => {
            const a = navActions[key];
            if (!a) return null;
            if (!ALWAYS_VISIBLE_NAV.includes(key) && !navExpanded) return null;
            const Icon = a.icon;
            const pixelStyle = {
              borderImage: `url(${pixelBtn.src}) 12 14 12 14 fill`, borderImageWidth: "12px 14px", borderStyle: "solid",
              background: "transparent", color: "var(--text)", filter: a.active ? "brightness(1.18) saturate(1.25)" : "none",
            };
            return (
              <button key={key} onClick={a.onClick} style={{ ...styles.brainBtn, ...pixelStyle }}>
                <Icon size={14} /> {a.label}
              </button>
            );
          })}
          {navOrder.some((key) => !ALWAYS_VISIBLE_NAV.includes(key) && navActions[key]) && (
            <button onClick={() => setNavExpanded((v) => !v)}
              style={{ ...styles.brainBtn, background: "transparent", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: 11.5 }}>
              {navExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              {navExpanded ? "Ocultar vistas" : "Más vistas"}
            </button>
          )}
        </>
      ) : (
        <>
          {/* Cinta de mando: todas las secciones caben como medallones, sin
              necesidad del acordeón "Más vistas" que usaba la lista de texto. */}
          <div style={styles.navRibbon}>
            {navOrder.map((key) => {
              const a = navActions[key];
              if (!a) return null;
              const Icon = a.icon;
              return (
                <button key={key} className="nav-medal" onClick={a.onClick} title={a.label} style={styles.navMedalBtn}>
                  <span style={{ ...styles.navMedal, ...(a.active ? styles.navMedalActive : {}) }}><Icon size={16} /></span>
                </button>
              );
            })}
          </div>
          <div style={styles.navActiveLabel}>{navActions[navOrder.find((k) => navActions[k]?.active)]?.label || ""}</div>
        </>
      )}

      {pinnedCards.length > 0 && (
        <div>
          <div style={styles.pinnedStripLabel}>Accesos fijados</div>
          <div style={styles.pinnedStripRow}>
            {pinnedCards.map(({ card, node }) => (
              <span key={card.id} style={styles.pinnedChip} onClick={() => navigateToId(node.id)} title={node.name}
                role="button" tabIndex={0} onKeyDown={keyActivate}>
                <EntryIcon node={node} size={12} />
                <span style={styles.pinnedChipLabel}>{node.name}</span>
                <X size={11} color="var(--muted)" onClick={(e) => { e.stopPropagation(); unpinCard(card.id); }} />
              </span>
            ))}
          </div>
        </div>
      )}

      {!search && recentlyViewed && recentlyViewed.length > 0 && (
        <div style={styles.recentBox}>
          <div style={styles.recentTitle}><Clock size={11} /> Recientes</div>
          {recentlyViewed.map((n) => (
            <div key={n.id} className="catalog-row" style={styles.recentRow} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>
              <EntryIcon node={n} size={12} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span>
            </div>
          ))}
        </div>
      )}

      <div style={styles.newRow}>
        <button style={styles.newBtn} onClick={() => addNode("folder", null)}><Folder size={13} /> Carpeta</button>
        <button style={styles.newBtn} onClick={() => addNode("page", null)}><FileText size={13} /> Página</button>
        <button style={styles.newBtn} onClick={() => addNode("map", null)}><MapIcon size={13} /> Mapa</button>
        <button style={styles.newBtn} onClick={() => addNode("timeline", null)}><Clock size={13} /> Línea de tiempo</button>
        <button style={styles.newBtn} onClick={() => addNode("board", null)}><Share2 size={13} /> Pizarra</button>
      </div>

      <div style={styles.tree}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const dragId = e.dataTransfer.getData("text/wb-node");
          if (dragId && e.target === e.currentTarget) moveToRoot(dragId);
        }}
      >
        {filtered
          ? filtered.map(({ node: n, snippet }) => (
              <FlatResult key={n.id} node={n} active={n.id === selectedId} onClick={() => setSelectedId(n.id)} snippet={snippet} />
            ))
          : roots.map((n) => (
              <TreeItem key={n.id} node={n} nodes={nodes} depth={0}
                selectedId={selectedId} setSelectedId={setSelectedId}
                expanded={expanded} setExpanded={setExpanded}
                addNode={addNode} deleteNode={deleteNode} renameNode={renameNode} moveNode={moveNode} updateNode={updateNode} />
            ))}
        {!filtered && roots.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 13, padding: "12px 8px", fontStyle: "italic" }}>
            Este proyecto está vacío. Crea tu primera entrada.
          </div>
        )}
        {filtered && filtered.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 13, padding: "12px 8px", fontStyle: "italic" }}>
            Sin resultados para "{search.trim()}".
          </div>
        )}
        <div style={{ minHeight: 40 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { const dragId = e.dataTransfer.getData("text/wb-node"); if (dragId) moveToRoot(dragId); }}
        />
      </div>
      <div style={{ fontSize: 10.5, color: "var(--muted)", padding: "6px 4px 0", fontStyle: "italic" }}>
        Arrastra entradas para reordenar, meterlas en carpetas o soltarlas en una pizarra.
      </div>
    </aside>
  );
}

/* ---------- ACCESO Y ARRANQUE ---------- */
// Red de seguridad para toda la app: si algo revienta durante el render, en
// vez de dejar la pantalla en blanco (lo que hoy pasa con cualquier error no
// atrapado de React) mostramos una pantalla de fallback con la misma
// identidad visual del login, y logueamos el error en consola para debug.
// Tiene que ser una clase: no existe un hook equivalente a componentDidCatch.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Error no atrapado en la app:", error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        ...styles.loadingShell, gap: 14,
        background: [
          `radial-gradient(120% 90% at 80% 0%, color-mix(in srgb, ${DEFAULT_THEME.accent} 12%, transparent) 0%, transparent 55%)`,
          `linear-gradient(180deg, color-mix(in srgb, ${DEFAULT_THEME.bg} 92%, black) 0%, ${DEFAULT_THEME.bg} 100%)`,
        ].join(", "),
      }}>
        <style>{fontImports}</style>
        <div style={{ ...styles.loadingSeal, borderColor: "#c45c5c", boxShadow: "0 0 18px rgba(196,92,92,0.4)" }}>
          <CircleAlert size={28} color="#c45c5c" />
        </div>
        <div style={{ color: DEFAULT_THEME.text, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>
          Algo salió mal
        </div>
        <div style={{ color: DEFAULT_THEME.muted, fontFamily: "'Manrope', sans-serif", fontSize: 13, maxWidth: 320, textAlign: "center" }}>
          Ocurrió un error inesperado. Podés intentar recargar la página; si el problema sigue, avisá para revisar el detalle en la consola.
        </div>
        <button onClick={() => window.location.reload()}
          style={{
            background: DEFAULT_THEME.accent, border: "none", color: DEFAULT_THEME.bg, borderRadius: "var(--radius-md, 8px)",
            padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.4,
          }}>
          Recargar página
        </button>
      </div>
    );
  }
}

export function Root() {
  const [key, setKey] = useState(getAccessKey());
  const [userDraft, setUserDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function tryKey(e) {
    e.preventDefault();
    setChecking(true); setError("");
    const token = `${userDraft.trim()}:${draft}`;
    try {
      const res = await fetch(`/api/storage/${TREE_KEY}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setError("Usuario o contraseña incorrectos."); setChecking(false); return; }
      if (res.status === 503) { setError("El servidor no tiene ACCESS_KEY configurada. Créala en Settings del Worker."); setChecking(false); return; }
      setAccessKey(token);
      setKey(token);
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    }
    setChecking(false);
  }

  function logout() {
    setAccessKey("");
    setUserDraft(""); setDraft(""); setError("");
    setKey("");
  }

  if (!key) {
    return (
      <div style={{
        ...styles.loadingShell, gap: 14,
        background: [
          `radial-gradient(120% 90% at 80% 0%, color-mix(in srgb, ${DEFAULT_THEME.accent} 12%, transparent) 0%, transparent 55%)`,
          `linear-gradient(180deg, color-mix(in srgb, ${DEFAULT_THEME.bg} 92%, black) 0%, ${DEFAULT_THEME.bg} 100%)`,
          `repeating-linear-gradient(color-mix(in srgb, ${DEFAULT_THEME.accent} 7%, transparent), color-mix(in srgb, ${DEFAULT_THEME.accent} 7%, transparent) 1px, transparent 1px, transparent 26px)`,
          `repeating-linear-gradient(90deg, color-mix(in srgb, ${DEFAULT_THEME.accent} 7%, transparent), color-mix(in srgb, ${DEFAULT_THEME.accent} 7%, transparent) 1px, transparent 1px, transparent 26px)`,
        ].join(", "),
      }}>
        <style>{fontImports + `.login-input:focus-visible { outline-color: ${DEFAULT_THEME.accent} !important; }`}</style>
        <div style={{ ...styles.loadingSeal, borderColor: DEFAULT_THEME.accent, boxShadow: `0 0 18px color-mix(in srgb, ${DEFAULT_THEME.accent} 40%, transparent)` }}>
          <ScrollText size={28} color={DEFAULT_THEME.accent} />
        </div>
        <div style={{ color: DEFAULT_THEME.text, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: 0.5 }}>Mi Worldbuilder</div>
        <form onSubmit={tryKey} style={{ display: "flex", flexDirection: "column", gap: 10, width: 260 }}>
          <input
            type="text" value={userDraft} onChange={(ev) => setUserDraft(ev.target.value)}
            placeholder="Usuario" autoFocus autoCapitalize="off" autoCorrect="off" className="login-input"
            style={{ background: DEFAULT_THEME.panel, border: `1px solid ${DEFAULT_THEME.border}`, color: DEFAULT_THEME.text, borderRadius: "var(--radius-md, 8px)", padding: "10px 12px", fontSize: 14, fontFamily: "'Manrope', sans-serif" }}
          />
          <input
            type="password" value={draft} onChange={(ev) => setDraft(ev.target.value)}
            placeholder="Contraseña" className="login-input"
            style={{ background: DEFAULT_THEME.panel, border: `1px solid ${DEFAULT_THEME.border}`, color: DEFAULT_THEME.text, borderRadius: "var(--radius-md, 8px)", padding: "10px 12px", fontSize: 14, fontFamily: "'Manrope', sans-serif" }}
          />
          <button type="submit" disabled={checking}
            style={{ background: DEFAULT_THEME.accent, border: "none", color: DEFAULT_THEME.bg, borderRadius: "var(--radius-md, 8px)", padding: "10px 12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Rajdhani', sans-serif", letterSpacing: 0.4 }}>
            {checking ? "Comprobando…" : "Entrar"}
          </button>
          {error && <div style={{ color: "#c45c5c", fontSize: 12.5, textAlign: "center" }}>{error}</div>}
        </form>
      </div>
    );
  }
  return <WorldBuilder onLogout={logout} />;
}
