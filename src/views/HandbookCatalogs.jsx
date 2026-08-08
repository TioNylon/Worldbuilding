import { useState, useMemo } from "react";
import { Ghost, Plus, User, Package, CircleAlert, Sparkles, Shield, TrendingUp } from "lucide-react";
import { PROGRESSION_LEVELS, PROGRESSION_STAT_ROWS } from "../data/statFields.js";
import { getPageBlocks } from "../utils/blocks.js";
import { bonusList, keyActivate, usableByLabel } from "../utils/misc.js";
import { deriveCharStats, rarityColor, targetSummary } from "../utils/stats.js";
import { stripMarkup } from "../utils/text.js";
import { styles } from "../styles.js";
import { activeArmorTypes, activeElements, activeRoles, activeStatusEffects, activeWeaponTypes } from "../state/globals.js";

export function ObjectsCatalogTab({ nodes, navigateToId, addCatalogEntry }) {
  const items = nodes.filter((n) => n.category === "object");
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
        Resumen de todos los objetos y sus bonos, para revisar el balance de un vistazo. Haz clic
        en un nombre para abrir su página.
      </div>
      {items.length === 0 ? (
        <div style={styles.canvasEmpty}>Aún no hay objetos. Crea el primero abajo.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.statsTable}>
            <thead>
              <tr>
                <th style={styles.statsTh}>Nombre</th>
                <th style={styles.statsTh}>Tipo</th>
                <th style={styles.statsTh}>Clasificación</th>
                <th style={styles.statsTh}>Rareza</th>
                <th style={styles.statsTh}>Precio</th>
                <th style={styles.statsTh}>Bonos</th>
                <th style={styles.statsTh}>Enseña</th>
                <th style={styles.statsTh}>AP</th>
                <th style={styles.statsTh}>Usable por</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const b = (n.blocks || []).find((x) => x.type === "itemStats");
                if (!b) return (
                  <tr key={n.id} className="catalog-row">
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span></td>
                    <td style={{ ...styles.statsTd, color: "var(--muted)", fontStyle: "italic" }} colSpan={8}>Sin bloque de estadísticas de objeto</td>
                  </tr>
                );
                const skill = nodes.find((x) => x.id === b.teachesSkillId);
                const usable = usableByLabel(b.usableBy, nodes);
                const isWeaponSlot = b.itemSlot === "Mano Principal" || b.itemSlot === "Mano Secundaria";
                const isArmorSlot = b.itemSlot === "Cabeza" || b.itemSlot === "Pecho" || b.itemSlot === "Piernas";
                const classification = isWeaponSlot
                  ? activeWeaponTypes.find((w) => w.key === b.weaponType)
                  : isArmorSlot
                  ? activeArmorTypes.find((a) => a.key === b.armorType)
                  : null;
                const weaponElement = isWeaponSlot ? activeElements.find((e) => e.key === b.element) : null;
                return (
                  <tr key={n.id} className="catalog-row">
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span></td>
                    <td style={styles.statsTd}>{b.itemSlot}</td>
                    <td style={styles.statsTd}>
                      <span style={{ color: classification ? classification.color : "var(--muted)" }}>{classification ? classification.label : "—"}</span>
                      {weaponElement && <span style={{ color: weaponElement.color }}> · {weaponElement.label}</span>}
                    </td>
                    <td style={{ ...styles.statsTdTotal, color: rarityColor(b.rarity ?? 1) }}>{b.rarity ?? 1}</td>
                    <td style={styles.statsTdTotal}>{b.price ?? 0}</td>
                    <td style={styles.statsTd}>{bonusList(b) || "—"}</td>
                    <td style={styles.statsTd}>{skill ? skill.name : "—"}</td>
                    <td style={styles.statsTd}>{skill ? (b.apToMaster ?? 0) : "—"}</td>
                    <td style={styles.statsTd}>{usable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }}
        onClick={() => addCatalogEntry("object", "itemStats", "Nuevo objeto")}>
        <Plus size={13} /> Nuevo objeto
      </button>
    </div>
  );
}

export function SkillsCatalogTab({ nodes, navigateToId, addCatalogEntry }) {
  const items = nodes.filter((n) => n.category === "skill");
  // Objetos que enseñan cada habilidad (escanea todos los bloques itemStats).
  const teachersBySkill = {};
  nodes.forEach((n) => {
    (n.blocks || []).forEach((b) => {
      if (b.type === "itemStats" && b.teachesSkillId) {
        (teachersBySkill[b.teachesSkillId] ||= []).push({ name: n.name, ap: b.apToMaster ?? 0 });
      }
    });
  });
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
        Resumen de habilidades y qué objetos las enseñan (con su costo en AP). Haz clic en un
        nombre para abrir su página.
      </div>
      {items.length === 0 ? (
        <div style={styles.canvasEmpty}>Aún no hay habilidades. Crea la primera abajo.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.statsTable}>
            <thead>
              <tr>
                <th style={styles.statsTh}>Nombre</th>
                <th style={styles.statsTh}>Tipo</th>
                <th style={styles.statsTh}>Objetivo</th>
                <th style={styles.statsTh}>Efecto</th>
                <th style={styles.statsTh}>Estado</th>
                <th style={styles.statsTh}>Enseñada por</th>
                <th style={styles.statsTh}>Usable por</th>
                <th style={styles.statsTh}>Requiere</th>
                <th style={styles.statsTh}>Costo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const b = (n.blocks || []).find((x) => x.type === "skillInfo");
                const teachers = teachersBySkill[n.id] || [];
                const usable = usableByLabel(b?.usableBy, nodes);
                const status = activeStatusEffects.find((s) => s.key === b?.inflictsStatusId);
                const prereq = nodes.find((x) => x.id === b?.prereqSkillId);
                return (
                  <tr key={n.id} className="catalog-row">
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span></td>
                    <td style={styles.statsTd}>{b?.skillType || "—"}</td>
                    <td style={styles.statsTd}>{targetSummary(b)}</td>
                    <td style={styles.statsTd}>{b?.effect || "—"}</td>
                    <td style={{ ...styles.statsTd, color: status ? status.color : "var(--muted)" }}>{status ? status.label : "—"}</td>
                    <td style={styles.statsTd}>{teachers.length ? teachers.map((t) => `${t.name} (${t.ap} AP)`).join(" · ") : "—"}</td>
                    <td style={styles.statsTd}>{usable}</td>
                    <td style={styles.statsTd}>{prereq ? prereq.name : "—"}</td>
                    <td style={styles.statsTd}>{b?.pointCost ?? 1} pt{(b?.pointCost ?? 1) === 1 ? "" : "s"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }}
        onClick={() => addCatalogEntry("skill", "skillInfo", "Nueva habilidad")}>
        <Plus size={13} /> Nueva habilidad
      </button>
    </div>
  );
}

export function CharactersCatalogTab({ nodes, navigateToId, addCatalogEntry }) {
  const items = nodes.filter((n) => n.category === "character");
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
        Resumen de personajes y sus estadísticas calculadas (fórmula FFIX), para comparar el
        balance entre ellos. Haz clic en un nombre para abrir su página.
      </div>
      {items.length === 0 ? (
        <div style={styles.canvasEmpty}>Aún no hay personajes con estadísticas. Crea el primero abajo.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.statsTable}>
            <thead>
              <tr>
                <th style={styles.statsTh}>Nombre</th>
                <th style={styles.statsTh}>Nivel</th>
                <th style={styles.statsTh}>PV</th>
                <th style={styles.statsTh}>SP/MP</th>
                <th style={styles.statsTh}>Atq. Físico</th>
                <th style={styles.statsTh}>Atq. Mágico</th>
                <th style={styles.statsTh}>Def. Física</th>
                <th style={styles.statsTh}>Def. Mágica</th>
                <th style={styles.statsTh}>Vel. Ataque</th>
                <th style={styles.statsTh}>Vel. Reacción</th>
                <th style={styles.statsTh}>Resist. Estados</th>
                <th style={styles.statsTh}>Suerte</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const b = (n.blocks || []).find((x) => x.type === "charStats");
                if (!b) return (
                  <tr key={n.id} className="catalog-row">
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span></td>
                    <td style={{ ...styles.statsTd, color: "var(--muted)", fontStyle: "italic" }} colSpan={11}>Sin bloque de estadísticas de personaje</td>
                  </tr>
                );
                const d = deriveCharStats(b);
                return (
                  <tr key={n.id} className="catalog-row">
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span></td>
                    <td style={styles.statsTd}>{b.nivel ?? 1}</td>
                    <td style={styles.statsTdTotal}>{d.maxHp}</td>
                    <td style={styles.statsTdTotal}>{d.maxResource}</td>
                    <td style={styles.statsTdTotal}>{d.atkFisico}</td>
                    <td style={styles.statsTdTotal}>{d.atkMagico}</td>
                    <td style={styles.statsTdTotal}>{d.defFisica}</td>
                    <td style={styles.statsTdTotal}>{d.defMagica}</td>
                    <td style={styles.statsTdTotal}>{d.velAtaque}</td>
                    <td style={styles.statsTdTotal}>{d.velReaccion}</td>
                    <td style={styles.statsTdTotal}>{d.resistEstados}</td>
                    <td style={styles.statsTdTotal}>{d.suerte}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }}
        onClick={() => addCatalogEntry("character", "charStats", "Nuevo personaje")}>
        <Plus size={13} /> Nuevo personaje
      </button>
    </div>
  );
}

export function ClassesCatalogTab({ nodes, navigateToId, addCatalogEntry }) {
  const items = nodes.filter((n) => n.category === "class");
  const roleCounts = useMemo(() => {
    const counts = {};
    items.forEach((n) => { (n.classRoles || []).forEach((k) => { counts[k] = (counts[k] || 0) + 1; }); });
    return counts;
  }, [items]);
  const withoutRole = items.filter((n) => !(n.classRoles || []).length).length;
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
        Resumen de clases/jobs y cuántos personajes, objetos y habilidades tiene asociados cada una.
        Haz clic en un nombre para abrir su página.
      </div>
      {items.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {activeRoles.map((r) => (
            <span key={r.key} style={{ ...styles.tagChip, color: r.color, border: "1px solid var(--border)" }}>
              {r.label}: {roleCounts[r.key] || 0}
            </span>
          ))}
          {withoutRole > 0 && (
            <span style={{ ...styles.tagChip, color: "var(--muted)", border: "1px solid var(--border)" }}>
              Sin rol: {withoutRole}
            </span>
          )}
        </div>
      )}
      {items.length === 0 ? (
        <div style={styles.canvasEmpty}>Aún no hay clases. Crea la primera abajo.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.statsTable}>
            <thead>
              <tr>
                <th style={styles.statsTh}>Nombre</th>
                <th style={styles.statsTh}>Roles</th>
                <th style={styles.statsTh}>Personajes</th>
                <th style={styles.statsTh}>Objetos</th>
                <th style={styles.statsTh}>Habilidades</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const charCount = nodes.filter((x) => x.category === "character" && (x.classIds || []).includes(n.id)).length;
                const itemCount = nodes.filter((x) => x.category === "object" && getPageBlocks(x).some((b) => b.type === "itemStats" && b.usableBy === n.id)).length;
                const skillCount = nodes.filter((x) => x.category === "skill" && getPageBlocks(x).some((b) => b.type === "skillInfo" && b.usableBy === n.id)).length;
                const roles = (n.classRoles || []).map((k) => activeRoles.find((r) => r.key === k)).filter(Boolean);
                return (
                  <tr key={n.id} className="catalog-row">
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span></td>
                    <td style={styles.statsTd}>
                      {roles.length ? roles.map((r) => (
                        <span key={r.key} style={{ color: r.color, marginRight: 6 }}>{r.label}</span>
                      )) : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td style={styles.statsTdTotal}>{charCount}</td>
                    <td style={styles.statsTdTotal}>{itemCount}</td>
                    <td style={styles.statsTdTotal}>{skillCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }}
        onClick={() => addCatalogEntry("class", "classSummary", "Nueva clase")}>
        <Plus size={13} /> Nueva clase
      </button>
    </div>
  );
}

export function SymbiontsCatalogTab({ nodes, navigateToId, addCatalogEntry }) {
  const items = nodes.filter((n) => n.category === "symbiont");
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
        Resumen de simbiontes, su habilidad activa y qué personajes los tienen equipados.
        Haz clic en un nombre para abrir su página.
      </div>
      {items.length === 0 ? (
        <div style={styles.canvasEmpty}>Aún no hay simbiontes. Crea el primero abajo.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.statsTable}>
            <thead>
              <tr>
                <th style={styles.statsTh}>Nombre</th>
                <th style={styles.statsTh}>Tipo</th>
                <th style={styles.statsTh}>Habilidad activa</th>
                <th style={styles.statsTh}>Equipado por</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => {
                const b = getPageBlocks(n).find((x) => x.type === "symbiontInfo");
                const activeSkill = nodes.find((x) => x.id === b?.activeSkillId);
                const bearers = nodes.filter((x) => x.category === "character" && (x.symbiontIds || []).includes(n.id));
                return (
                  <tr key={n.id} className="catalog-row">
                    <td style={styles.statsTd}><span style={styles.catalogLink} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span></td>
                    <td style={styles.statsTd}>{b?.kind || "—"}</td>
                    <td style={styles.statsTd}>{activeSkill ? activeSkill.name : "—"}</td>
                    <td style={styles.statsTd}>{bearers.length ? bearers.map((x) => x.name).join(" · ") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button style={{ ...styles.pillBtn, alignSelf: "flex-start" }}
        onClick={() => addCatalogEntry("symbiont", "symbiontInfo", "Nuevo simbionte")}>
        <Plus size={13} /> Nuevo simbionte
      </button>
    </div>
  );
}

// Contenido de Catálogos como sección de la Bitácora (antes era un modal
// aparte); mismo contenido, sin el envoltorio de overlay/panel flotante.
export function CatalogsContent({ nodes, navigateToId, addCatalogEntry }) {
  const [tab, setTab] = useState("object");
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 16, overflow: "hidden", background: "var(--app-bg, var(--bg))" }}>
      <h2 style={{ margin: "0 0 10px", fontFamily: "'Orbitron', sans-serif", fontSize: 18, color: "var(--text)" }}>
        <Package size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Catálogos
      </h2>
      <div style={styles.templatesTabRow}>
        <button style={{ ...styles.pillBtn, ...(tab === "object" ? styles.pillBtnActive : {}) }}
          onClick={() => setTab("object")}><Package size={13} /> Objetos</button>
        <button style={{ ...styles.pillBtn, ...(tab === "skill" ? styles.pillBtnActive : {}) }}
          onClick={() => setTab("skill")}><Sparkles size={13} /> Habilidades</button>
        <button style={{ ...styles.pillBtn, ...(tab === "character" ? styles.pillBtnActive : {}) }}
          onClick={() => setTab("character")}><User size={13} /> Personajes</button>
        <button style={{ ...styles.pillBtn, ...(tab === "class" ? styles.pillBtnActive : {}) }}
          onClick={() => setTab("class")}><Shield size={13} /> Clases</button>
        <button style={{ ...styles.pillBtn, ...(tab === "symbiont" ? styles.pillBtnActive : {}) }}
          onClick={() => setTab("symbiont")}><Ghost size={13} /> Simbiontes</button>
        <button style={{ ...styles.pillBtn, ...(tab === "progression" ? styles.pillBtnActive : {}) }}
          onClick={() => setTab("progression")}><TrendingUp size={13} /> Progresión</button>
      </div>
      {tab === "object" && <ObjectsCatalogTab nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry} />}
      {tab === "skill" && <SkillsCatalogTab nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry} />}
      {tab === "class" && <ClassesCatalogTab nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry} />}
      {tab === "symbiont" && <SymbiontsCatalogTab nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry} />}
      {tab === "character" && <CharactersCatalogTab nodes={nodes} navigateToId={navigateToId} addCatalogEntry={addCatalogEntry} />}
      {tab === "progression" && <ProgressionCatalogTab nodes={nodes} navigateToId={navigateToId} />}
    </div>
  );
}

// Curva de crecimiento: para cada Personaje/NPC/Enemigo/Jefe con estadísticas
// cargadas, cómo se ven sus stats derivadas en varios niveles de referencia
// (reevalúa deriveCharStats con ese nivel, sin tocar el bloque real), para
// revisar el ritmo de progresión del juego de un vistazo.
export function ProgressionCatalogTab({ nodes, navigateToId }) {
  const items = useMemo(
    () => nodes.filter((n) => ["character", "npc", "enemy", "boss"].includes(n.category) && getPageBlocks(n).some((b) => b.type === "charStats"))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
        Cómo crecen las estadísticas de cada Personaje/NPC/Enemigo/Jefe con estadísticas cargadas, en niveles
        de referencia, para revisar el ritmo de progresión del juego de un vistazo.
      </div>
      {items.length === 0 ? (
        <div style={styles.canvasEmpty}>Aún no hay entradas con Estadísticas de personaje.</div>
      ) : (
        items.map((n) => {
          const b = getPageBlocks(n).find((x) => x.type === "charStats");
          return (
            <div key={n.id}>
              <span style={{ ...styles.catalogLink, fontSize: 13, fontWeight: 700 }} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span>
              <div style={{ overflowX: "auto", marginTop: 6 }}>
                <table style={styles.statsTable}>
                  <thead>
                    <tr>
                      <th style={styles.statsTh}>Estadística</th>
                      {PROGRESSION_LEVELS.map((lv) => <th key={lv} style={styles.statsTh}>Nv. {lv}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {PROGRESSION_STAT_ROWS.map(([label, key]) => (
                      <tr key={key} className="catalog-row">
                        <td style={styles.statsTd}>{label}</td>
                        {PROGRESSION_LEVELS.map((lv) => (
                          <td key={lv} style={styles.statsTdTotal}>{deriveCharStats({ ...b, nivel: lv })[key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ---------- CABOS SUELTOS (misiones y rumores sin resolver) ---------- */
// Contenido de Cabos sueltos como sección de la Bitácora (antes era un modal
// aparte); mismo contenido, sin el envoltorio de overlay/panel flotante.
export function LooseEndsContent({ nodes, navigateToId }) {
  const missions = useMemo(() => nodes.filter((n) => n.category === "mission" && !n.missionResolved), [nodes]);
  const rumors = useMemo(() => {
    const out = [];
    nodes.forEach((n) => {
      getPageBlocks(n).filter((b) => b.type === "rumor" && !b.resolved && (b.text || "").trim())
        .forEach((b) => out.push({ node: n, block: b }));
    });
    return out;
  }, [nodes]);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16, background: "var(--app-bg, var(--bg))" }}>
      <h2 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: 18, color: "var(--text)" }}>
        <CircleAlert size={16} style={{ verticalAlign: "middle", marginRight: 6 }} /> Cabos sueltos
      </h2>
      <div>
        <div style={styles.statsIncidenceTitle2}>Misiones sin resolver ({missions.length})</div>
        {missions.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Ninguna. Todo al día.</div>
        ) : missions.map((n) => (
          <div key={n.id} style={{ padding: "4px 0" }}>
            <span style={styles.catalogLink} onClick={() => navigateToId(n.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{n.name}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={styles.statsIncidenceTitle2}>Rumores/secretos sin resolver ({rumors.length})</div>
        {rumors.length === 0 ? (
          <div style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>Ninguno. Todo al día.</div>
        ) : rumors.map(({ node, block }) => {
          const snippet = stripMarkup(block.text);
          return (
            <div key={block.id} style={{ padding: "4px 0" }}>
              <span style={styles.catalogLink} onClick={() => navigateToId(node.id)} role="button" tabIndex={0} onKeyDown={keyActivate}>{node.name}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}> — {snippet.slice(0, 70)}{snippet.length > 70 ? "…" : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
