import { clsx, type ClassValue } from "clsx";
import { saveAs } from "file-saver";
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

// ---------------------------------------------------------------------------
// Backup & Restore JSON
// ---------------------------------------------------------------------------

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function asStringOrNumber(value: unknown): string | number {
  return typeof value === "number" ? value : asText(value);
}

/** Normalisasi satu objek mentah menjadi WarkahItem; null jika tidak valid. */
function normalizeItem(raw: unknown): WarkahItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const pemohon = asText(r.pemohon).trim();
  if (!pemohon) return null;
  return {
    id: typeof r.id === "string" && r.id ? r.id : generateId(),
    no: 0,
    pemohon,
    desa: asText(r.desa),
    kecamatan: asText(r.kecamatan),
    noGu: asStringOrNumber(r.noGu),
    tahun: asStringOrNumber(r.tahun),
    luas: asStringOrNumber(r.luas),
    nib: asText(r.nib), // selalu string: leading zero tetap utuh
    su: asText(r.su) || "-",
    rakNo: asStringOrNumber(r.rakNo),
    rakBaris: asStringOrNumber(r.rakBaris),
    rakKolom: asStringOrNumber(r.rakKolom),
  };
}

/** Parse isi file backup (format { items: [...] } atau array langsung). */
export function parseBackup(text: string): WarkahItem[] | null {
  try {
    const parsed: unknown = JSON.parse(text);
    const list: unknown = Array.isArray(parsed)
      ? parsed
      : typeof parsed === "object" && parsed !== null
        ? (parsed as { items?: unknown }).items
        : null;
    if (!Array.isArray(list)) return null;
    const items = list.map(normalizeItem).filter((i): i is WarkahItem => i !== null);
    if (items.length === 0 && list.length > 0) return null;
    return renumber(items);
  } catch {
    return null;
  }
}

export function downloadBackup(items: WarkahItem[]): string {
  const payload = {
    app: "warkah",
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const fileName = `warkah_backup_${new Date().toISOString().slice(0, 10)}.json`;
  saveAs(blob, fileName);
  return fileName;
}
