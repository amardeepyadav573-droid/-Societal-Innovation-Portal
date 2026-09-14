const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const apiOrigin = configuredApiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

export function resolveMediaUrl(url) {
  if (!url) return "";
  const value = String(url).trim();
  if (!value) return "";
  if (/^(https?:|blob:|data:)/i.test(value)) return value;
  if (value.startsWith("//")) return `${window.location.protocol}${value}`;
  if (value.startsWith("/")) return `${apiOrigin}${value}`;
  return `${apiOrigin}/${value}`;
}

export function getEvidenceType(item) {
  if (item?.type) return String(item.type).toUpperCase();
  const url = String(item?.url || "");
  const name = String(item?.name || url).toLowerCase();
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(name)) return "VIDEO";
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(name)) return "IMAGE";
  return "DOCUMENT";
}
