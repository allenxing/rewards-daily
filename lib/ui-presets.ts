export const themePresets = [
  { key: "sky", label: "天空", color: "#7DD3FC", gradient: "linear-gradient(135deg,#BAE6FD,#7DD3FC)" },
  { key: "coral", label: "珊瑚", color: "#FCA5A5", gradient: "linear-gradient(135deg,#FECDD3,#FCA5A5)" },
  { key: "mint", label: "薄荷", color: "#6EE7B7", gradient: "linear-gradient(135deg,#A7F3D0,#6EE7B7)" },
  { key: "lavender", label: "薰衣草", color: "#C4B5FD", gradient: "linear-gradient(135deg,#DDD6FE,#C4B5FD)" },
  { key: "sun", label: "阳光", color: "#FCD34D", gradient: "linear-gradient(135deg,#FDE68A,#FCD34D)" },
] as const;

export type ThemeKey = (typeof themePresets)[number]["key"];

export const adminColorPresets = [
  { key: "coffee", color: "#5D4432", label: "咖啡棕" },
  { key: "ocean", color: "#2563EB", label: "海蓝" },
  { key: "forest", color: "#059669", label: "森林绿" },
  { key: "wisteria", color: "#7C3AED", label: "紫藤" },
  { key: "chineseRed", color: "#DC2626", label: "中国红" },
  { key: "amber", color: "#D97706", label: "琥珀" },
] as const;

export const iconPresets = [
  "💧", "📚", "🎳", "🧹", "💌", "🎨",
  "🎵", "💪", "🌱", "🐶", "⭐",
] as const;

export const themeByKey = Object.fromEntries(
  themePresets.map((t) => [t.key, t])
) as Record<ThemeKey, (typeof themePresets)[number]>;
