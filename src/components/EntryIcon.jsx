import { PIXEL_ICONS } from "../data/theme.js";
import { colorForNode, iconForNode } from "../utils/tree.js";
import { activeIconOverrides } from "../state/globals.js";

export function EntryIcon({ node, size = 14, isOpen, color }) {
  const override = node.type === "page" ? activeIconOverrides[node.category] : null;
  if (override && PIXEL_ICONS[override]) {
    return <img src={PIXEL_ICONS[override].src} alt="" style={{ width: size, height: size, objectFit: "contain", imageRendering: "pixelated", flexShrink: 0 }} />;
  }
  const Icon = iconForNode(node, isOpen);
  return <Icon size={size} color={color ?? colorForNode(node)} />;
}
