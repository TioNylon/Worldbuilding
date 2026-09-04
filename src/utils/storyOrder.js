import { getPageBlocks } from "./blocks.js";

function blockOf(node, type) {
  return getPageBlocks(node).find((block) => block.type === type);
}

export function narrativeIndex(nodes) {
  const chapters = nodes
    .filter((node) => node.category === "chapter")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
  const chapterRank = new Map(chapters.map((chapter, index) => [chapter.id, index]));
  const beats = nodes
    .filter((node) => node.category === "beat")
    .map((node) => ({ node, info: blockOf(node, "beatInfo") }))
    .filter(({ info }) => info?.chapterId)
    .sort((a, b) =>
      (chapterRank.get(a.info.chapterId) ?? Number.MAX_SAFE_INTEGER) - (chapterRank.get(b.info.chapterId) ?? Number.MAX_SAFE_INTEGER)
      || (a.info.order ?? 0) - (b.info.order ?? 0)
      || a.node.name.localeCompare(b.node.name)
    );
  const scenesByBeat = new Map();
  nodes.filter((node) => node.category === "scene").forEach((node) => {
    const info = blockOf(node, "sceneInfo");
    if (!info?.beatId) return;
    const list = scenesByBeat.get(info.beatId) || [];
    list.push({ node, info });
    scenesByBeat.set(info.beatId, list);
  });
  const rank = new Map();
  const mark = (id, position) => {
    if (id && !rank.has(id)) rank.set(id, position);
  };
  beats.forEach(({ node, info }, index) => {
    const position = index * 100;
    (info.characterIds || []).forEach((id, offset) => mark(id, position + offset));
    mark(info.placeId, position + 50);
    (scenesByBeat.get(node.id) || []).forEach(({ info: scene }, sceneIndex) => {
      (scene.characterIds || []).forEach((id, offset) => mark(id, position + sceneIndex * 10 + offset));
      mark(scene.placeId, position + sceneIndex * 10 + 5);
    });
  });
  const compare = (a, b) =>
    (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    || (a.order ?? 0) - (b.order ?? 0)
    || a.name.localeCompare(b.name);
  return { chapters, beats, scenesByBeat, rank, compare };
}

export function chapterStoryReferences(nodes, chapterId) {
  const index = narrativeIndex(nodes);
  const ids = { character: [], place: [] };
  const seen = { character: new Set(), place: new Set() };
  const add = (category, id) => {
    if (!id || seen[category].has(id)) return;
    const node = nodes.find((candidate) => candidate.id === id && (category === "place" ? ["place", "ship"].includes(candidate.category) : candidate.category === category));
    if (!node) return;
    seen[category].add(id);
    ids[category].push(node);
  };
  index.beats.filter(({ info }) => info.chapterId === chapterId).forEach(({ node, info }) => {
    (info.characterIds || []).forEach((id) => add("character", id));
    add("place", info.placeId);
    (index.scenesByBeat.get(node.id) || []).forEach(({ info: scene }) => {
      (scene.characterIds || []).forEach((id) => add("character", id));
      add("place", scene.placeId);
    });
  });
  return ids;
}
