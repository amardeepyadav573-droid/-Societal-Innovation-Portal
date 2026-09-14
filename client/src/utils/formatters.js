export function formatDate(date) {
  if (!date) return "—";

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  ).format(new Date(date));
}

export function formatNumber(value) {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(value || 0);
}

export function truncateText(
  text,
  length = 120
) {
  if (!text) return "";

  if (text.length <= length) {
    return text;
  }

  return `${text.substring(0, length)}...`;
}