"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "@/components/Header";
import EntryForm from "@/components/EntryForm";
import DataTable from "@/components/DataTable";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast, { type ToastMessage } from "@/components/Toast";
import { downloadWarkahExcel } from "@/lib/excel-generator";
import {
  clearStorage,
  generateId,
  loadFromStorage,
  renumber,
  saveToStorage,
} from "@/lib/utils";
import type { WarkahDraft, WarkahItem } from "@/types/warkah";

export default function Home() {
  const [items, setItems] = useState<WarkahItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WarkahItem | null>(null);

  const showToast = useCallback((message: string, type: ToastMessage["type"] = "success") => {
    setToast({ id: Date.now(), message, type });
  }, []);
  const closeToast = useCallback(() => setToast(null), []);

  // Muat dari localStorage setelah mount (hindari mismatch hydration)
  useEffect(() => {
    const stored = loadFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(stored);
    setHydrated(true);
  }, []);

  // Simpan otomatis setiap perubahan (setelah hydrate agar tidak menimpa data lama)
  useEffect(() => {
    if (hydrated) saveToStorage(items);
  }, [items, hydrated]);

  const handleAdd = useCallback(
    (draft: WarkahDraft) => {
      setItems((prev) => [...prev, { ...draft, id: generateId(), no: prev.length + 1 }]);
      showToast("Data berhasil ditambahkan");
    },
    [showToast],
  );

  const handleSaveEdit = useCallback(
    (id: string, draft: WarkahDraft) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...draft, id: it.id, no: it.no } : it)));
      setEditingId(null);
      showToast("Perubahan berhasil disimpan");
    },
    [showToast],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setItems((prev) => renumber(prev.filter((it) => it.id !== id)));
    setEditingId((current) => (current === id ? null : current));
    setPendingDelete(null);
    showToast("Data berhasil dihapus");
  }, [pendingDelete, showToast]);

  const handleClearAll = useCallback(() => {
    setItems([]);
    setEditingId(null);
    clearStorage();
    setConfirmClear(false);
    showToast("Semua data berhasil dihapus");
  }, [showToast]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const fileName = await downloadWarkahExcel(items);
      showToast(`Excel berhasil didownload (${fileName})`);
    } catch (err) {
      console.error(err);
      showToast("Gagal membuat file Excel", "error");
    } finally {
      setDownloading(false);
    }
  }, [items, showToast]);

  const editingItem = items.find((it) => it.id === editingId) ?? null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        total={items.length}
        onDownload={handleDownload}
        onRequestClearAll={() => setConfirmClear(true)}
        downloading={downloading}
      />
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <EntryForm
          onAdd={handleAdd}
          editingItem={editingItem}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingId(null)}
        />
        <DataTable
          items={items}
          editingId={editingId}
          onEdit={(item) => setEditingId(item.id)}
          onRequestDelete={setPendingDelete}
        />
      </main>

      <ConfirmDialog
        open={confirmClear}
        title="Hapus semua data?"
        message={`Seluruh ${items.length} baris data akan dihapus permanen.`}
        confirmLabel="Ya, Hapus Semua"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus baris data?"
        message={`Hapus baris data milik ${pendingDelete?.pemohon ?? ""}?`}
        confirmLabel="Ya, Hapus"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
