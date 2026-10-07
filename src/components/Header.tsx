"use client";

import { Download, FileSpreadsheet, Trash2 } from "lucide-react";

interface HeaderProps {
  total: number;
  onDownload: () => void;
  /** Dipanggil saat tombol diklik; konfirmasi modal ditangani oleh parent. */
  onRequestClearAll: () => void;
  downloading?: boolean;
}

export default function Header({ total, onDownload, onRequestClearAll, downloading }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
            <FileSpreadsheet className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-slate-900">
              Sistem Input &amp; Generator Warkah
            </h1>
            <p className="text-xs text-slate-500">Daftar Gambar Ukur</p>
          </div>
          <span
            className="ml-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
            aria-label={`Total ${total} baris`}
          >
            {total} baris
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownload}
            disabled={total === 0 || downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            {downloading ? "Membuat file..." : "Download Excel (.xlsx)"}
          </button>
          <button
            type="button"
            onClick={onRequestClearAll}
            disabled={total === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Hapus Semua Data
          </button>
        </div>
      </div>
    </header>
  );
}
