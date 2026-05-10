"use client";

const EVENT_NAME = "app:data-updated";
const STORAGE_KEY = "app:data-updated-at";

export function publishDataUpdated(reason: string): void {
  const payload = { at: Date.now(), reason };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // noop
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
}

export function subscribeDataUpdated(cb: () => void): () => void {
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener(EVENT_NAME, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

