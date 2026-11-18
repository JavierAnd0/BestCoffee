/** "https://origen.bestcoffee.co/" → "origen.bestcoffee.co", para la vista en Google. */
export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}
