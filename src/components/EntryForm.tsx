"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Lock, Pencil, Plus, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EMPTY_DRAFT, type WarkahDraft, type WarkahItem } from "@/types/warkah";

interface EntryFormProps {
  onAdd: (draft: WarkahDraft) => void;
  /** Baris yang sedang diedit (null = mode tambah) */
  editingItem: WarkahItem | null;
  onSaveEdit: (id: string, draft: WarkahDraft) => void;
  onCancelEdit: () => void;
}

type FieldKey = keyof WarkahDraft;

interface FieldDef {
  key: FieldKey;
  label: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  sticky?: boolean;
  className?: string;
}

const FIELDS: FieldDef[] = [
  { key: "pemohon", label: "Pemohon", placeholder: "Nama pemohon", className: "sm:col-span-2" },
  { key: "noGu", label: "No. GU", inputMode: "numeric" },
  { key: "luas", label: "Luas (m²)", inputMode: "decimal" },
  { key: "nib", label: "NIB", placeholder: "mis. 00014 / 010047", inputMode: "numeric" },
  { key: "su", label: "SU", placeholder: "No. SU atau -" },
  { key: "desa", label: "Desa", sticky: true },
  { key: "kecamatan", label: "Kecamatan", sticky: true },
  { key: "tahun", label: "Tahun", inputMode: "numeric", sticky: true },
  { key: "rakNo", label: "No Rak", inputMode: "numeric", sticky: true },
  { key: "rakBaris", label: "Baris", inputMode: "numeric", sticky: true },
  { key: "rakKolom", label: "Kolom", inputMode: "numeric", sticky: true },
];

/** Urutan fokus keyboard (Enter pindah ke field berikutnya; Enter di terakhir = submit) */
const ORDER: FieldKey[] = [
  "pemohon",
  "noGu",
  "luas",
  "nib",
  "su",
  "desa",
  "kecamatan",
  "tahun",
  "rakNo",
  "rakBaris",
  "rakKolom",
];

function itemToDraft(item: WarkahItem): WarkahDraft {
  return {
    pemohon: item.pemohon,
    desa: item.desa,
    kecamatan: item.kecamatan,
    noGu: String(item.noGu),
    tahun: String(item.tahun),
    luas: String(item.luas),
    nib: item.nib,
    su: item.su,
    rakNo: String(item.rakNo),
    rakBaris: String(item.rakBaris),
    rakKolom: String(item.rakKolom),
  };
}

export default function EntryForm({ onAdd, editingItem, onSaveEdit, onCancelEdit }: EntryFormProps) {
  const [draft, setDraft] = useState<WarkahDraft>({ ...EMPTY_DRAFT });
  const [stash, setStash] = useState<WarkahDraft | null>(null);
  const [trackedId, setTrackedId] = useState<string | null>(null);
  const [sticky, setSticky] = useState(true);
  const [error, setError] = useState("");
  const refs = useRef<Partial<Record<FieldKey, HTMLInputElement | null>>>({});

  const editingId = editingItem?.id ?? null;
  const isEditing = editingItem !== null;

  // Sinkronkan form saat masuk/keluar mode edit (pola "adjust state during render")
  if (editingId !== trackedId) {
    setTrackedId(editingId);
    if (editingItem) {
      if (trackedId === null) setStash(draft); // simpan isian mode tambah
      setDraft(itemToDraft(editingItem));
    } else {
      setDraft(stash ?? { ...EMPTY_DRAFT });
      setStash(null);
    }
    setError("");
  }

  const focusPemohon = () => requestAnimationFrame(() => refs.current.pemohon?.focus());

  // Fokus ke Pemohon saat mulai edit
  useEffect(() => {
    if (editingId) refs.current.pemohon?.focus();
  }, [editingId]);

  const update = (key: FieldKey, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const submit = () => {
    if (!draft.pemohon.toString().trim()) {
      setError("Nama pemohon wajib diisi.");
      refs.current.pemohon?.focus();
      return;
    }
    const cleaned = { ...draft } as WarkahDraft;
    for (const key of ORDER) {
      (cleaned as unknown as Record<string, string>)[key] = String(draft[key]).trim();
    }
    cleaned.su = String(cleaned.su) || "-";

    if (editingItem) {
      onSaveEdit(editingItem.id, cleaned);
      // draft dipulihkan oleh sinkronisasi saat editingItem menjadi null
    } else {
      onAdd(cleaned);
      setDraft((prev) => {
        const next: WarkahDraft = { ...EMPTY_DRAFT };
        if (sticky) {
          for (const f of FIELDS) {
            if (f.sticky) {
              (next as unknown as Record<string, string | number>)[f.key] = prev[f.key];
            }
          }
        }
        return next;
      });
    }
    setError("");
    focusPemohon();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, key: FieldKey) => {
    if (e.key === "Escape" && isEditing) {
      onCancelEdit();
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Di SU (mode tambah + sticky aktif): submit hanya jika Desa, Kecamatan, Tahun sudah terisi.
    // Jika belum, lanjut ke Desa dan seterusnya sampai Kolom (submit di Kolom).
    if (key === "su" && sticky && !isEditing) {
      const mainFilled = [draft.desa, draft.kecamatan, draft.tahun].every(
        (v) => String(v).trim() !== "",
      );
      if (mainFilled) {
        submit();
        return;
      }
    }
    const idx = ORDER.indexOf(key);
    if (idx === ORDER.length - 1) {
      submit();
    } else {
      refs.current[ORDER[idx + 1]]?.focus();
    }
  };

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

  return (
    <section
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm sm:p-5",
        isEditing ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200",
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          {isEditing ? (
            <>
              <Pencil className="h-4 w-4 text-amber-600" aria-hidden />
              Edit Data No. {editingItem.no}
            </>
          ) : (
            "Input Data Cepat"
          )}
        </h2>
        {!isEditing && (
          <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-md bg-slate-50 px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200">
            <input
              type="checkbox"
              checked={sticky}
              onChange={(e) => setSticky(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
            />
            <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden />
            Kunci Nilai Berulang (Sticky Fields)
          </label>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
      >
        {FIELDS.map((f) => (
          <div key={f.key} className={cn("flex flex-col gap-1", f.className)}>
            <label htmlFor={`f-${f.key}`} className="flex items-center gap-1 text-xs font-medium text-slate-600">
              {f.label}
              {f.sticky && sticky && !isEditing && (
                <Lock className="h-3 w-3 text-emerald-600" aria-label="terkunci" />
              )}
            </label>
            <input
              id={`f-${f.key}`}
              ref={(el) => {
                refs.current[f.key] = el;
              }}
              value={String(draft[f.key])}
              onChange={(e) => update(f.key, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, f.key)}
              placeholder={f.placeholder}
              inputMode={f.inputMode}
              autoComplete="off"
              autoFocus={f.key === "pemohon"}
              className={cn(inputClass, f.key === "pemohon" && error && "border-red-400")}
            />
          </div>
        ))}

        <div className="col-span-2 flex items-end gap-2 sm:col-span-2">
          <button
            type="submit"
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition",
              isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-900 hover:bg-slate-700",
            )}
          >
            {isEditing ? <Save className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
            {isEditing ? "Simpan Perubahan" : "Tambah"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" aria-hidden />
              Batal
            </button>
          )}
        </div>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-slate-500">
        Tekan <kbd className="rounded border border-slate-300 bg-slate-50 px-1">Enter</kbd> untuk pindah field.
        {isEditing
          ? " Enter pada field terakhir menyimpan perubahan; Esc membatalkan."
          : " Enter di SU langsung menambah data jika Desa, Kecamatan, dan Tahun sudah terisi (fokus kembali ke Pemohon); jika belum, lanjut ke Desa sampai Kolom."}
      </p>
    </section>
  );
}
