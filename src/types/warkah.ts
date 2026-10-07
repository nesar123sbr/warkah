export interface WarkahItem {
  id: string;
  /** Nomor urut (auto-increment) */
  no: number;
  pemohon: string;
  desa: string;
  kecamatan: string;
  noGu: string | number;
  tahun: string | number;
  luas: string | number;
  /** Harus string agar leading zero (mis. "00014") tetap utuh */
  nib: string;
  /** Nomor SU, atau "-" bila tidak ada */
  su: string;
  rakNo: string | number;
  rakBaris: string | number;
  rakKolom: string | number;
}

/** Data form (semua string, sebelum disimpan sebagai WarkahItem) */
export type WarkahDraft = Omit<WarkahItem, "id" | "no">;

export const STORAGE_KEY = "warkah_draft_data";

export const EMPTY_DRAFT: WarkahDraft = {
  pemohon: "",
  desa: "",
  kecamatan: "",
  noGu: "",
  tahun: "",
  luas: "",
  nib: "",
  su: "",
  rakNo: "",
  rakBaris: "",
  rakKolom: "",
};
