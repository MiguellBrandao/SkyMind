// SkyBlock profile "cute names" are drawn from a fixed list of fruits. Best-effort cosmetic
// mapping to a matching emoji - anything not in this list (custom/rare names, special game modes)
// falls back to a generic icon rather than guessing.
const FRUIT_EMOJI: Record<string, string> = {
  apple: "🍎",
  banana: "🍌",
  blueberry: "🫐",
  cherry: "🍒",
  coconut: "🥥",
  cucumber: "🥒",
  grapes: "🍇",
  kiwi: "🥝",
  lemon: "🍋",
  lime: "🍏",
  mango: "🥭",
  melon: "🍈",
  orange: "🍊",
  papaya: "🧡",
  peach: "🍑",
  pear: "🍐",
  pineapple: "🍍",
  plum: "🟣",
  pomegranate: "🔴",
  raspberry: "🍓",
  strawberry: "🍓",
  tangerine: "🍊",
  tomato: "🍅",
  watermelon: "🍉",
  zucchini: "🥒",
};

export function getProfileEmoji(cuteName: string | null): string {
  if (!cuteName) return "🏝️";
  return FRUIT_EMOJI[cuteName.toLowerCase()] ?? "🏝️";
}
