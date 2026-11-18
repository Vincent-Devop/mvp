export function formatKes(minorUnits: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Math.round(minorUnits / 100));
}

export function slugTitle(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function setPageMeta(title: string, description: string) {
  if (typeof document === "undefined") return;
  document.title = title;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = description;
  const updateTag = (selector: string, attribute: "content", value: string, key: "property" | "name", name: string) => {
    let element = document.querySelector<HTMLMetaElement>(selector);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(key, name);
      document.head.appendChild(element);
    }
    element[attribute] = value;
  };
  updateTag('meta[property="og:title"]', "content", title, "property", "og:title");
  updateTag('meta[property="og:description"]', "content", description, "property", "og:description");
  updateTag('meta[name="twitter:title"]', "content", title, "name", "twitter:title");
  updateTag('meta[name="twitter:description"]', "content", description, "name", "twitter:description");
}
