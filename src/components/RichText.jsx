import React, { useState } from "react";
import { ENTRY_TYPES } from "../data/entryTypes.js";
import { keyActivate } from "../utils/misc.js";
import { pageSnippet } from "../utils/text.js";
import { styles } from "../styles.js";
import { EntryIcon } from "./EntryIcon.jsx";

/* ---------- ENLACE [[así]] CON VISTA PREVIA AL PASAR EL MOUSE ---------- */
export function WikiLinkSpan({ name, nodes, navigateByName }) {
  const [hover, setHover] = useState(false);
  const target = nodes.find((n) => n.name.toLowerCase() === name.trim().toLowerCase());
  const exists = !!target;
  const et = target && target.type === "page" ? ENTRY_TYPES[target.category] : null;
  const snippet = target ? pageSnippet(target, 100) : null;
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => exists && navigateByName(name)}
      style={{ position: "relative", color: exists ? "var(--accent)" : "#b04848", borderBottom: `1px dashed ${exists ? "var(--accent)" : "#b04848"}`, cursor: exists ? "pointer" : "default", fontWeight: 600 }}
     role="button" tabIndex={0} onKeyDown={keyActivate}>
      {name}
      {hover && (
        <span style={styles.wikiPreviewCard}>
          {target ? (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <EntryIcon node={target} size={13} />
                <b style={{ color: "var(--text)" }}>{target.name}</b>
              </span>
              {et && <span style={{ fontSize: 10, color: et.color, fontWeight: 600 }}>{et.label}</span>}
              {target.type === "folder" && <span style={{ fontSize: 10, color: "var(--muted)" }}>Carpeta</span>}
              {snippet && <span style={{ fontSize: 11, color: "var(--muted)", display: "block", marginTop: 3 }}>{snippet}</span>}
            </>
          ) : (
            <span style={{ fontSize: 11.5, color: "var(--muted)", fontStyle: "italic" }}>Página no encontrada — se creará al hacer clic en un editor.</span>
          )}
        </span>
      )}
    </span>
  );
}

/* ---------- RICH TEXT RENDERER ---------- */
export function renderRich(text, nodes, navigateByName, keyPrefix = "r") {
  const tokenRe = /(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\/\/[^/]+\/\/|__[^_]+__|\{#[0-9a-fA-F]{3,8}\|[^}]*\})/g;
  const parts = text.split(tokenRe);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    let m;
    if ((m = part.match(/^\[\[([^\]]+)\]\]$/))) {
      return <WikiLinkSpan key={key} name={m[1]} nodes={nodes} navigateByName={navigateByName} />;
    }
    if ((m = part.match(/^\*\*([^*]+)\*\*$/))) return <strong key={key}>{m[1]}</strong>;
    if ((m = part.match(/^\/\/([^/]+)\/\/$/))) return <em key={key}>{m[1]}</em>;
    if ((m = part.match(/^__([^_]+)__$/))) return <u key={key}>{m[1]}</u>;
    if ((m = part.match(/^\{(#[0-9a-fA-F]{3,8})\|([^}]*)\}$/))) return <span key={key} style={{ color: m[1] }}>{m[2]}</span>;
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}
