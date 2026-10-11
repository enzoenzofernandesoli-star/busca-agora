// The customer's CEP, kept in localStorage ("ba_cep") so the header and the
// freight quotes agree. The "storage" event only fires in other tabs, so
// saveCep also notifies this tab.
const KEY = "ba_cep";
const EVENT = "ba:cep";

export function subscribeStoredCep(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

export function getStoredCep(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveCep(cep: string) {
  try {
    window.localStorage.setItem(KEY, cep);
  } catch {
    /* Storage is optional. */
  }
  window.dispatchEvent(new Event(EVENT));
}
