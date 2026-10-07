"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WarkahItem } from "@/types/warkah";

interface DataTableProps {
  items: WarkahItem[];
  editingId: string | null;
  onEdit: (item: WarkahItem) => void;
  onRequestDelete: (item: WarkahItem) => void;
}

type ColumnKey = Exclude<keyof WarkahItem, "id" | "no">;

const COLUMNS: { key: ColumnKey; label: string; width: string; align?: "left" }[] = [
  { key: "pemohon", label: "Pemohon", width: "min-w-48", align: "left" },
  { key: "desa", label: "Desa", width: "min-w-32" },
  { key: "kecamatan", label: "Kecamatan", width: "min-w-32" },
  { key: "noGu", label: "No. GU", width: "min-w-20" },
  { key: "tahun", label: "Tahun", width: "min-w-20" },
  { key: "luas", label: "Luas", width: "min-w-20" },
  { key: "nib", label: "NIB", width: "min-w-24" },
  { key: "su", label: "SU", width: "min-w-20" },
  { key: "rakNo", label: "No Rak", width: "min-w-16" },
  { key: "rakBaris", label: "Baris", width: "min-w-16" },
  { key: "rakKolom", label: "Kolom", width: "min-w-16" },
];

export default function DataTable({ items, editingId, onEdit, onRequestDelete }: DataTableProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.pemohon.toLowerCase().includes(q) || it.nib.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <h2 className="text-base font-semibold text-slate-900">
          Preview Data{" "}
          <span className="text-sm font-normal text-slate-500">
            ({filtered.length}
            {filtered.length !== items.length ? ` dari ${items.length}` : ""})
          </span>
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pemohon atau NIB..."
            aria-label="Cari pemohon atau NIB"
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2 text-center">No</th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "border-b border-slate-200 px-3 py-2",
                    c.align === "left" ? "text-left" : "text-center",
                    c.width,
                  )}
                >
                  {c.label}
                </th>
              ))}
              <th className="border-b border-slate-200 px-3 py-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="px-4 py-12 text-center text-slate-500">
                  {items.length === 0
                    ? "Belum ada data. Mulai input pada form di atas."
                    : "Tidak ada data yang cocok dengan pencarian."}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-slate-100 hover:bg-emerald-50/40",
                    editingId === item.id ? "bg-amber-50" : "odd:bg-white even:bg-slate-50/60",
                  )}
                >
                  <td className="px-3 py-2 text-center text-slate-500">{item.no}</td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className={cn("px-3 py-2", c.align === "left" ? "text-left" : "text-center")}>
                      <span className={c.key === "nib" ? "font-mono" : undefined}>{String(item[c.key])}</span>
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Edit"
                        aria-label={`Edit ${item.pemohon}`}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRequestDelete(item)}
                        title="Hapus"
                        aria-label={`Hapus ${item.pemohon}`}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
