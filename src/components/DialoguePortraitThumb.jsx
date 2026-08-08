import { useState, useEffect } from "react";
import { UserRound } from "lucide-react";
import { loadImage } from "../storage.js";
import { styles } from "../styles.js";

/* ---------- RETRATO PARA LA VISTA PREVIA DE DIÁLOGO ---------- */
export function DialoguePortraitThumb({ nodeId }) {
  const [src, setSrc] = useState(null);
  useEffect(() => { setSrc(null); (async () => setSrc(await loadImage(`cover-image:${nodeId}`)))(); }, [nodeId]);
  return (
    <div style={styles.dialoguePreviewPortrait}>
      {src ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : <UserRound size={22} color="var(--muted)" />}
    </div>
  );
}
