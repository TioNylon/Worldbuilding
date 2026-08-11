import { useState, useMemo } from "react";
import { Plus, Trash2, ArrowLeftRight, ArrowUpDown, Columns } from "lucide-react";
import { normalizeEvents, uid } from "../utils/misc.js";
import { findNode } from "../utils/tree.js";
import { styles } from "../styles.js";
import { LinkPicker } from "../components/LinkPicker.jsx";
import { SearchSelect } from "../components/SearchSelect.jsx";
import { CharacterMultiPicker } from "../blocks/CharacterPickers.jsx";

export function TimelineEditor({ node, nodes, updateNode, setSelectedId, isMobile }) {
  const events = useMemo(() => normalizeEvents(node.events || []), [node.events]);
  const orientation = node.orientation || "vertical";
  // Filtro "Ver solo": dos dimensiones (personaje / lugar) en vez de una sola
  // basada en el enlace genérico — un hito puede tener varios personajes, así
  // que el filtro por personaje chequea inclusión en characterIds, no igualdad.
  const [filterKind, setFilterKind] = useState(null);
  const [filterId, setFilterId] = useState(null);

  const placeOptions = useMemo(
    () => nodes.filter((n) => n.category === "place" || n.type === "map")
      .map((n) => ({ id: n.id, label: n.name, sublabel: n.type === "map" ? "Mapa" : undefined }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [nodes]
  );
  const filterCharacterOptions = useMemo(() => {
    const ids = new Set();
    events.forEach((e) => (e.characterIds || []).forEach((id) => ids.add(id)));
    return nodes.filter((n) => ids.has(n.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [events, nodes]);
  const filterPlaceOptions = useMemo(() => {
    const ids = new Set(events.map((e) => e.placeId).filter(Boolean));
    return nodes.filter((n) => ids.has(n.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [events, nodes]);
  function setFilter(value) {
    if (!value) { setFilterKind(null); setFilterId(null); return; }
    const idx = value.indexOf(":");
    setFilterKind(value.slice(0, idx));
    setFilterId(value.slice(idx + 1));
  }
  const visibleEvents = !filterId ? events : events.filter((e) => (
    filterKind === "character" ? (e.characterIds || []).includes(filterId) : e.placeId === filterId
  ));
  const maxSlot = visibleEvents.length ? Math.max(...visibleEvents.map((e) => e.slot)) : -1;

  const groups = useMemo(() => {
    const g = [];
    for (let s = 0; s <= maxSlot; s++) g.push(visibleEvents.filter((e) => e.slot === s));
    return g.filter((arr) => arr.length);
  }, [visibleEvents, maxSlot]);

  function commit(evts) { updateNode(node.id, { events: normalizeEvents(evts) }); }
  function addEvent() {
    commit([...events, { id: uid(), date: "", title: "Nuevo acontecimiento", description: "", linkedPageId: null, characterIds: [], placeId: null, slot: maxSlot + 1 }]);
  }
  function addParallel(slot) {
    commit([...events, { id: uid(), date: "", title: "Evento paralelo", description: "", linkedPageId: null, characterIds: [], placeId: null, slot }]);
  }
  function updateEvent(id, patch) { commit(events.map((e) => (e.id === id ? { ...e, ...patch } : e))); }
  function deleteEvent(id) { commit(events.filter((e) => e.id !== id)); }
  function moveEvent(id, dir) {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    const target = ev.slot + dir;
    if (target < 0) return;
    commit(events.map((e) => (e.id === id ? { ...e, slot: target + (dir > 0 ? 0.5 : -0.5) } : e)));
  }

  const EventCard = ({ ev }) => {
    const mapNode = ev.placeId ? findNode(nodes, ev.placeId) : null;
    const mapPins = mapNode?.type === "map" ? (mapNode.pins || []) : [];
    const pinnedEnemies = [];
    const pinnedObjects = [];
    mapPins.forEach((p) => {
      const linked = p.linkedPageId ? nodes.find((n) => n.id === p.linkedPageId) : null;
      if (!linked) return;
      if (linked.category === "enemy" || linked.category === "boss") pinnedEnemies.push(linked);
      else if (linked.category === "object") pinnedObjects.push(linked);
    });

    return (
      <div style={{ ...styles.timelineCard, minWidth: orientation === "horizontal" ? 240 : undefined }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <input value={ev.date} onChange={(e) => updateEvent(ev.id, { date: e.target.value })} placeholder="Fecha / Era" style={styles.timelineDateInput} />
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            <button style={styles.miniBtn} onClick={() => moveEvent(ev.id, -1)} title={orientation === "horizontal" ? "Mover a la izquierda" : "Mover antes"}>
              {orientation === "horizontal" ? "←" : "↑"}
            </button>
            <button style={styles.miniBtn} onClick={() => moveEvent(ev.id, 1)} title={orientation === "horizontal" ? "Mover a la derecha" : "Mover después"}>
              {orientation === "horizontal" ? "→" : "↓"}
            </button>
            <button style={{ ...styles.miniBtn, color: "#c45c5c" }} onClick={() => deleteEvent(ev.id)}><Trash2 size={12} /></button>
          </div>
        </div>
        <input value={ev.title} onChange={(e) => updateEvent(ev.id, { title: e.target.value })} placeholder="Título del acontecimiento" style={styles.timelineTitleInput} />
        <textarea value={ev.description} onChange={(e) => updateEvent(ev.id, { description: e.target.value })} placeholder="Describe qué ocurrió…" style={styles.timelineDescInput} />

        <div style={styles.statsIncidenceTitle2}>Personajes relevantes</div>
        <CharacterMultiPicker characterIds={ev.characterIds} nodes={nodes} onChange={(v) => updateEvent(ev.id, { characterIds: v })} />

        <div style={styles.statsIncidenceTitle2}>Lugar</div>
        <SearchSelect options={placeOptions} value={ev.placeId || null} onChange={(v) => updateEvent(ev.id, { placeId: v })}
          placeholder="Buscar lugar o mapa…" clearLabel="— ninguno —" />

        {mapNode && (pinnedEnemies.length > 0 || pinnedObjects.length > 0) && (
          <div style={styles.timelineMapPreview}>
            <div style={styles.timelineMapPreviewLabel}>Ya marcado en {mapNode.name}</div>
            {pinnedEnemies.length > 0 && (
              <div style={styles.timelineMapPreviewRow}>
                <span style={styles.timelineMapPreviewRowLabel}>Enemigos</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {pinnedEnemies.map((n) => (
                    <span key={n.id} style={{ ...styles.pillBtn, fontSize: 11.5, padding: "3px 9px", cursor: "pointer" }} onClick={() => setSelectedId(n.id)}>{n.name}</span>
                  ))}
                </div>
              </div>
            )}
            {pinnedObjects.length > 0 && (
              <div style={styles.timelineMapPreviewRow}>
                <span style={styles.timelineMapPreviewRowLabel}>Objetos</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {pinnedObjects.map((n) => (
                    <span key={n.id} style={{ ...styles.pillBtn, fontSize: 11.5, padding: "3px 9px", cursor: "pointer" }} onClick={() => setSelectedId(n.id)}>{n.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={styles.statsIncidenceTitle2}>Enlace (opcional)</div>
        <LinkPicker nodes={nodes} excludeId={node.id}
          value={ev.linkedPageId}
          onChange={(v) => updateEvent(ev.id, { linkedPageId: v })} />
        {ev.linkedPageId && (
          <button style={{ ...styles.pillBtn, marginTop: 6, alignSelf: "flex-start" }} onClick={() => setSelectedId(ev.linkedPageId)}>Ir a la página enlazada</button>
        )}
      </div>
    );
  };

  return (
    <div style={styles.timelineWrap}>
      <h1 style={styles.pageTitle}>{node.name}</h1>
      <div style={{ padding: "0 16px 8px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={styles.pillBtn} onClick={addEvent}><Plus size={13} /> Acontecimiento</button>
        <button style={styles.pillBtn}
          onClick={() => updateNode(node.id, { orientation: orientation === "vertical" ? "horizontal" : "vertical" })}>
          {orientation === "vertical" ? <ArrowLeftRight size={13} /> : <ArrowUpDown size={13} />}
          {orientation === "vertical" ? "Ver horizontal" : "Ver vertical"}
        </button>
        {(filterCharacterOptions.length > 0 || filterPlaceOptions.length > 0) && (
          <select value={filterId ? `${filterKind}:${filterId}` : ""} onChange={(e) => setFilter(e.target.value)} style={styles.pinSelect}>
            <option value="">Ver todos los acontecimientos</option>
            {filterCharacterOptions.length > 0 && (
              <optgroup label="Por personaje">
                {filterCharacterOptions.map((n) => <option key={n.id} value={`character:${n.id}`}>Solo: {n.name}</option>)}
              </optgroup>
            )}
            {filterPlaceOptions.length > 0 && (
              <optgroup label="Por lugar">
                {filterPlaceOptions.map((n) => <option key={n.id} value={`place:${n.id}`}>Solo: {n.name}</option>)}
              </optgroup>
            )}
          </select>
        )}
      </div>
      {groups.length === 0 && (
        <div style={{ color: "var(--muted)", fontStyle: "italic", padding: "8px 16px" }}>
          {filterId ? "Ningún acontecimiento enlaza esta página." : "Sin acontecimientos aún."}
        </div>
      )}

      {orientation === "vertical" ? (
        <div style={styles.timelineTrack}>
          {groups.map((group, gi) => (
            <div key={gi} style={styles.timelineEventRow}>
              <div style={styles.timelineDot} />
              {gi < groups.length - 1 && <div style={styles.timelineLine} />}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                {group.map((ev) => <div key={ev.id} style={{ flex: "1 1 260px", maxWidth: 420 }}><EventCard ev={ev} /></div>)}
              </div>
              <button style={{ ...styles.miniBtn, marginBottom: 14 }} onClick={() => addParallel(group[0].slot)} title="Añadir evento simultáneo">
                <Columns size={11} /> + Paralelo
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.timelineHTrack}>
          <div style={styles.timelineHLine} />
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start", padding: "0 16px" }}>
            {groups.map((group, gi) => (
              <div key={gi} style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", paddingTop: 22 }}>
                <div style={styles.timelineHDot} />
                {group.map((ev) => <EventCard key={ev.id} ev={ev} />)}
                <button style={styles.miniBtn} onClick={() => addParallel(group[0].slot)} title="Añadir evento simultáneo">
                  <Columns size={11} /> + Paralelo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
