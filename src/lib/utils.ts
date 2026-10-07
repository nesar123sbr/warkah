import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { STORAGE_KEY, type WarkahItem } from "@/types/warkah";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Ubah string numerik murni menjadi number; selain itu kembalikan apa adanya. */
export function toNumericIfPossible(value: string | number): string | number {
  if (typeof value === "number") return value;
  const trimmed = value.trim();
  if (trimmed !== "" && /^\d+([.,]\d+)?$/.test(trimmed) && !/^0\d/.test(trimmed)) {
    return Number(trimmed.replace(",", "."));
  }
  return trimmed;
}

/** Urutkan ulang nomor urut agar selalu 1..n. */
export function renumber(items: WarkahItem[]): WarkahItem[] {
  return items.map((item, index) => ({ ...item, no: index + 1 }));
}

function isWarkahItem(value: unknown): value is WarkahItem {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.pemohon === "string" && typeof v.nib === "string";
}

export function loadFromStorage(): WarkahItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return renumber(parsed.filter(isWarkahItem));
  } catch {
    return [];
  }
}

export function saveToStorage(items: WarkahItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage penuh / diblokir: abaikan agar UI tetap berjalan
  }
}

export function clearStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // abaikan
  }
}
