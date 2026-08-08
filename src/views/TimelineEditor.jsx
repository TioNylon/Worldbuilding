import { useState, useMemo } from "react";
import { Plus, Trash2, ArrowLeftRight, ArrowUpDown, Columns } from "lucide-react";
import { normalizeEvents, uid } from "../utils/misc.js";
import { styles } from "../styles.js";
import { LinkPicker } from "../components/LinkPicker.jsx";

export function TimelineEditor({ node, nodes, updateNode, setSelectedId, isMobile }) {
  const events = useMemo(() => normalizeEvents(node.events || []), [node.events]);
  const orientation = node.orientation || "vertical";
  const [filterId, setFilterId] = useState("");

  // Páginas que algún acontecimiento ya enlaza, para poder filtrar la línea
  // de tiempo y ver solo lo que involucra a un Personaje/Lugar puntual.
  const linkableOptions = useMemo(() => {
    const ids = new Set(events.map((e) => e.linkedPageId).filter(Boolean));
    return nodes.filter((n) => ids.has(n.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [events, nodes]);
  const visibleEvents = filterId ? events.filter((e) => e.linkedPageId === filterId) : events;
  const maxSlot = visibleEvents.length ? Math.max(...visibleEvents.map((e) => e.slot)) : -1;

  const groups = useMemo(() => {
    const g = [];
    for (let s = 0; s <= maxSlot; s++) g.push(visibleEvents.filter((e) => e.slot === s));
    return g.filter((arr) => arr.length);
  }, [visibleEvents, maxSlot]);

  function commit(evts) { updateNode(node.id, { events: normalizeEvents(evts) }); }
  function addEvent() {
    commit([...events, { id: uid(), date: "", title: "Nuevo acontecimiento", description: "", linkedPageId: null, slot: maxSlot + 1 }]);
  }
  function addParallel(slot) {
    commit([...events, { id: uid(), date: "", title: "Evento paralelo", description: "", linkedPageId: null, slot }]);
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

  const EventCard = ({ ev }) => (
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
      <LinkPicker nodes={nodes} excludeId={node.id}
        value={ev.linkedPageId}
        onChange={(v) => updateEvent(ev.id, { linkedPageId: v })} />
      {ev.linkedPageId && (
        <button style={{ ...styles.pillBtn, marginTop: 6, alignSelf: "flex-start" }} onClick={() => setSelectedId(ev.linkedPageId)}>Ir a la página enlazada</button>
      )}
    </div>
  );

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
        {linkableOptions.length > 0 && (
          <select value={filterId} onChange={(e) => setFilterId(e.target.value)} style={styles.pinSelect}>
            <option value="">Ver todos los acontecimientos</option>
            {linkableOptions.map((n) => <option key={n.id} value={n.id}>Solo: {n.name}</option>)}
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
