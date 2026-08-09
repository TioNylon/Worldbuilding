import { useState, useRef } from "react";
import { X, Palette, GripVertical } from "lucide-react";
import { ENTRY_TYPES, ENTRY_TYPE_KEYS, RELATION_TYPES } from "../data/entryTypes.js";
import { DEFAULT_SKIN, DEFAULT_THEME, NAV_ITEM_META, PIXEL_BUTTONS, PIXEL_BUTTON_KEYS, PIXEL_FRAMES, PIXEL_ICONS, PIXEL_ICON_KEYS, THEME_PRESETS } from "../data/theme.js";
import { keyActivate } from "../utils/misc.js";
import { styles } from "../styles.js";

// Vista previa en vivo: arma una mini composición con contenido real de la
// app (tipos de entrada, tipos de relación, ítems de navegación) en vez de
// muestras de color sueltas. No necesita recibir el theme como prop — vive
// bajo el mismo div raíz que ya aplica theme como variables CSS (--accent,
// --panel, etc. en app.jsx), así que cualquier cambio en el panel de al lado
// se refleja acá solo, exactamente como en el resto de la app.
function ThemeLivePreview() {
  const sampleType = ENTRY_TYPES.character;
  const SampleIcon = sampleType.icon;
  const sampleRelation = RELATION_TYPES[0];
  const navSample = Object.entries(NAV_ITEM_META).slice(0, 2);
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius-md, 8px)", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {navSample.map(([key, meta], i) => {
          const Icon = meta.icon;
          return (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: "var(--radius-sm, 4px)",
              background: i === 0 ? "var(--accent)" : "var(--panel2)", color: i === 0 ? "var(--bg)" : "var(--text)", fontSize: 11.5,
            }}>
              <Icon size={12} /> {meta.label}
            </div>
          );
        })}
      </div>
      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 4px)", padding: 8, display: "flex", alignItems: "center", gap: 7 }}>
        <SampleIcon size={15} color={sampleType.color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Reina Ysolde</div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>{sampleType.label}</div>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: sampleRelation.color, background: "color-mix(in srgb, currentColor 16%, transparent)", padding: "2px 7px", borderRadius: 999 }}>
          {sampleRelation.label}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" style={{ ...styles.pillBtn, ...styles.pillBtnActive, flex: 1, justifyContent: "center", fontSize: 11 }}>Guardar</button>
        <button type="button" style={{ ...styles.pillBtn, flex: 1, justifyContent: "center", fontSize: 11 }}>Cancelar</button>
      </div>
    </div>
  );
}

export function ThemePanel({ theme, updateTheme, skin, updateSkin, onClose, isMobile }) {
  const fields = [
    ["accent", "Acento"], ["bg", "Fondo"], ["panel", "Paneles"],
    ["panel2", "Botones"], ["border", "Bordes"], ["text", "Texto"], ["muted", "Texto tenue"],
  ];
  const radius = typeof theme.radius === "number" ? theme.radius : 10;
  const paletteKeys = ["bg", "panel", "panel2", "border", "accent", "text", "muted"];
  const activePreset = THEME_PRESETS.find((p) => paletteKeys.every((k) => p.theme[k] === theme[k]) && p.theme.radius === radius);
  const [iconType, setIconType] = useState(ENTRY_TYPE_KEYS[0]);
  const dragNavRef = useRef(null);
  const navOrder = [...(skin.navOrder && skin.navOrder.length ? skin.navOrder : DEFAULT_SKIN.navOrder)];
  Object.keys(NAV_ITEM_META).forEach((k) => { if (!navOrder.includes(k)) navOrder.push(k); });

  function moveNavItem(from, to) {
    const next = [...navOrder];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateSkin({ navOrder: next });
  }

  return (
    <div style={isMobile ? styles.pinPanelMobile : { ...styles.pinPanel, top: 60, bottom: "auto", width: 268 }}>
      <div style={styles.pinPanelHeader}>
        <span><Palette size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />Apariencia</span>
        <X size={14} style={{ cursor: "pointer" }} onClick={onClose} />
      </div>

      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>Vista previa</div>
      <div style={{ marginTop: 4 }}><ThemeLivePreview /></div>

      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 16 }}>Temas</div>
      <div style={{ ...styles.presetGrid, marginTop: 4 }}>
        {THEME_PRESETS.map((p) => {
          const active = activePreset && activePreset.name === p.name;
          return (
            <button key={p.name} onClick={() => updateTheme({ ...p.theme })} title={p.name}
              style={{ ...styles.presetBtn, borderColor: active ? "var(--accent)" : "var(--border)", outline: active ? "1px solid var(--accent)" : "none" }}>
              <span style={{ display: "flex", gap: 3 }}>
                <span style={{ ...styles.presetDot, background: p.theme.bg }} />
                <span style={{ ...styles.presetDot, background: p.theme.panel2 }} />
                <span style={{ ...styles.presetDot, background: p.theme.accent }} />
              </span>
              <span style={{ fontSize: 11, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            </button>
          );
        })}
      </div>

      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text)", marginTop: 16 }}>
        Redondez de bordes <span style={{ color: "var(--muted)" }}>{radius} px</span>
      </label>
      <input type="range" min={0} max={22} value={radius}
        onChange={(e) => updateTheme({ radius: Number(e.target.value) })}
        style={{ width: "100%", accentColor: "var(--accent)", marginTop: 2 }} />

      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 16 }}>Colores</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
        {fields.map(([key, label]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text)", gap: 6 }}>
            {label}
            <input type="color" value={theme[key]} onChange={(e) => updateTheme({ [key]: e.target.value })}
              style={{ width: 30, height: 22, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }} />
          </label>
        ))}
      </div>

      <button style={{ ...styles.pillBtn, justifyContent: "center", marginTop: 8 }} onClick={() => updateTheme({ ...DEFAULT_THEME })}>Restaurar por defecto</button>

      <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 10 }}>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}>Piel de interfaz (por mundo)</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => updateSkin({ uiSkin: "flat" })}
            style={{ ...styles.pillBtn, flex: 1, justifyContent: "center", ...(skin.uiSkin !== "pixel" ? styles.pillBtnActive : {}) }}>Plana</button>
          <button onClick={() => updateSkin({ uiSkin: "pixel" })}
            style={{ ...styles.pillBtn, flex: 1, justifyContent: "center", ...(skin.uiSkin === "pixel" ? styles.pillBtnActive : {}) }}>Pixel-art</button>
        </div>
      </div>

      {skin.uiSkin === "pixel" && (
        <>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 4 }}>Marco de panel</div>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(PIXEL_FRAMES).map(([key, f]) => (
                <div key={key} onClick={() => updateSkin({ pixelFrame: key })} title={f.label}
                  style={{ width: 56, height: 40, cursor: "pointer", backgroundImage: `url(${f.src})`, backgroundSize: "cover", backgroundPosition: "center", border: skin.pixelFrame === key ? "2px solid var(--accent)" : "2px solid var(--border)" }}  role="button" tabIndex={0} onKeyDown={keyActivate}/>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "8px 0 4px" }}>Color de botón de menú</div>
            <div style={{ display: "flex", gap: 6 }}>
              {PIXEL_BUTTON_KEYS.map((key) => {
                const b = PIXEL_BUTTONS[key];
                return (
                  <div key={key} onClick={() => updateSkin({ pixelButton: key })} title={b.label}
                    style={{ width: 40, height: 30, cursor: "pointer", backgroundImage: `url(${b.src})`, backgroundSize: "cover", backgroundPosition: "center", border: skin.pixelButton === key ? "2px solid var(--accent)" : "2px solid var(--border)" }}  role="button" tabIndex={0} onKeyDown={keyActivate}/>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "8px 0 4px" }}>Ícono por tipo de entrada</div>
            <select value={iconType} onChange={(e) => setIconType(e.target.value)} style={{ ...styles.pinSelect, width: "100%", marginBottom: 6 }}>
              {ENTRY_TYPE_KEYS.map((k) => <option key={k} value={k}>{ENTRY_TYPES[k].label}</option>)}
            </select>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <div onClick={() => updateSkin({ iconOverrides: { ...skin.iconOverrides, [iconType]: null } })}
                title="Predeterminado" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--bg)", border: !skin.iconOverrides[iconType] ? "2px solid var(--accent)" : "2px solid var(--border)" }} role="button" tabIndex={0} onKeyDown={keyActivate}>
                {(() => { const DefIcon = ENTRY_TYPES[iconType].icon; return <DefIcon size={15} color={ENTRY_TYPES[iconType].color} />; })()}
              </div>
              {PIXEL_ICON_KEYS.map((key) => (
                <div key={key} onClick={() => updateSkin({ iconOverrides: { ...skin.iconOverrides, [iconType]: key } })} title={PIXEL_ICONS[key].label}
                  style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--bg)", border: skin.iconOverrides[iconType] === key ? "2px solid var(--accent)" : "2px solid var(--border)" }} role="button" tabIndex={0} onKeyDown={keyActivate}>
                  <img src={PIXEL_ICONS[key].src} alt="" style={{ width: 18, height: 18, objectFit: "contain", imageRendering: "pixelated" }} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "8px 0 4px" }}>Orden de la barra lateral (arrastra)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {navOrder.map((key, i) => {
                const meta = NAV_ITEM_META[key];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <div key={key} draggable
                    onDragStart={() => { dragNavRef.current = i; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragNavRef.current !== null && dragNavRef.current !== i) moveNavItem(dragNavRef.current, i); dragNavRef.current = null; }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", background: "var(--panel2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm, 4px)", fontSize: 12, color: "var(--text)", cursor: "grab" }}>
                    <GripVertical size={12} color="var(--muted)" /> <Icon size={13} /> {meta.label}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
