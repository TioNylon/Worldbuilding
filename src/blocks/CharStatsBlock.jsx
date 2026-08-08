import { ATTR_FIELDS } from "../data/statFields.js";
import { deriveCharStats } from "../utils/stats.js";
import { styles } from "../styles.js";

// Resumen de atributos con barras (Ficha del libro de Personajes) — el
// cálculo completo y el escalado por nivel viven en la página Progresión;
// acá solo se muestra un vistazo rápido de los 6 atributos base.
export function CharStatsSummaryBars({ block }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {ATTR_FIELDS.map(([k, label]) => {
        const v = block?.[k] ?? 10;
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
            <span style={{ width: 92, flexShrink: 0, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
            <div style={{ flex: 1, height: 5, background: "var(--panel2)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, v * 5)}%`, background: "linear-gradient(90deg, var(--border), var(--accent))" }} />
            </div>
            <span style={{ width: 22, textAlign: "right", fontWeight: 700, color: "var(--text)" }}>{v}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CharStatsBlock({ block, updateBlock }) {
  const d = deriveCharStats(block);
  const resourceLabel = block.isMagical ? "MP" : "SP";
  function setNum(field, value) {
    const n = value === "" ? 0 : parseInt(value, 10);
    updateBlock(block.id, { [field]: Number.isNaN(n) ? 0 : Math.max(field === "nivel" ? 1 : 0, n) });
  }
  return (
    <div>
      <div style={styles.statsGrid6}>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>Nivel</span>
          <input type="number" value={block.nivel ?? 1} style={styles.statsMiniInput}
            onChange={(e) => setNum("nivel", e.target.value)} />
        </label>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>XP actual</span>
          <input type="number" value={block.xpActual ?? 0} style={styles.statsMiniInput}
            onChange={(e) => setNum("xpActual", e.target.value)} />
        </label>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>XP para subir</span>
          <input type="number" value={d.xpParaSubir} disabled style={{ ...styles.statsMiniInput, opacity: 0.6 }} />
        </label>
      </div>

      <div style={styles.statsIncidenceTitle2}>Atributos</div>
      <div style={styles.statsGrid6}>
        {ATTR_FIELDS.map(([k, label]) => (
          <label key={k} style={styles.statsField}>
            <span style={styles.statsLabel}>{label}</span>
            <input type="number" value={block[k] ?? 10} style={styles.statsMiniInput}
              onChange={(e) => setNum(k, e.target.value)} />
          </label>
        ))}
      </div>

      <div style={styles.statsIncidenceTitle2}>Recursos base</div>
      <div style={styles.statsGrid6}>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>PV base</span>
          <input type="number" value={block.baseMaxHp ?? 100} style={styles.statsMiniInput}
            onChange={(e) => setNum("baseMaxHp", e.target.value)} />
        </label>
        <label style={styles.statsField}>
          <span style={styles.statsLabel}>Recurso base</span>
          <input type="number" value={block.baseMaxResource ?? 20} style={styles.statsMiniInput}
            onChange={(e) => setNum("baseMaxResource", e.target.value)} />
        </label>
        <label style={{ ...styles.statsField, justifyContent: "center" }}>
          <span style={styles.statsLabel}>Usa magia (MP)</span>
          <input type="checkbox" checked={!!block.isMagical}
            onChange={(e) => updateBlock(block.id, { isMagical: e.target.checked })} />
        </label>
      </div>

      <div style={styles.statsIncidenceTitle2}>Estadísticas de combate (calculadas)</div>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.statsTable}>
          <thead>
            <tr>
              <th style={styles.statsTh}>PV</th>
              <th style={styles.statsTh}>{resourceLabel}</th>
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
            <tr>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
