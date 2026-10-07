import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { WarkahItem } from "@/types/warkah";
import { toNumericIfPossible } from "@/lib/utils";

const FONT: Partial<ExcelJS.Font> = { name: "Calibri", size: 11 };
const THIN: Partial<ExcelJS.Border> = { style: "thin", color: { argb: "FF000000" } };
const BORDER: Partial<ExcelJS.Borders> = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const COLUMN_WIDTHS = [8, 32, 18, 18, 12, 10, 12, 12, 10, 10, 10, 10];

/** Merge range lalu terapkan style + border ke SELURUH sel dalam range. */
function mergeHeader(
  ws: ExcelJS.Worksheet,
  range: string,
  value: string,
): void {
  ws.mergeCells(range);
  const [start, end] = range.split(":");
  const first = ws.getCell(start);
  first.value = value;

  const s = ws.getCell(start);
  const e = ws.getCell(end ?? start);
  const top = Number(s.row);
  const bottom = Number(e.row);
  const left = Number(s.col);
  const right = Number(e.col);

  for (let r = top; r <= bottom; r++) {
    for (let c = left; c <= right; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { ...FONT, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = BORDER;
    }
  }
}

/**
 * Deteksi tahun dominan dari data: tahun (4 digit) yang paling sering muncul.
 * Jika seri, dipakai tahun yang muncul paling akhir. Data kosong -> tahun berjalan.
 */
export function detectYear(items: WarkahItem[]): string {
  const counts = new Map<string, number>();
  const lastSeen = new Map<string, number>();
  items.forEach((item, index) => {
    const year = String(item.tahun).trim();
    if (!/^\d{4}$/.test(year)) return;
    counts.set(year, (counts.get(year) ?? 0) + 1);
    lastSeen.set(year, index);
  });

  let best: string | null = null;
  for (const [year, count] of counts) {
    if (best === null) {
      best = year;
      continue;
    }
    const bestCount = counts.get(best) ?? 0;
    if (count > bestCount || (count === bestCount && (lastSeen.get(year) ?? 0) > (lastSeen.get(best) ?? 0))) {
      best = year;
    }
  }
  return best ?? String(new Date().getFullYear());
}

export async function buildWarkahWorkbook(
  items: WarkahItem[],
  year: string = detectYear(items),
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistem Input & Generator Warkah";
  wb.created = new Date();

  const ws = wb.addWorksheet(`Warkah ${year}`);
  ws.columns = COLUMN_WIDTHS.map((width) => ({ width }));

  // Judul
  ws.mergeCells("A1:L1");
  const title = ws.getCell("A1");
  title.value = "DAFTAR GAMBAR UKUR";
  title.font = { ...FONT, bold: true };
  title.alignment = { horizontal: "center", vertical: "middle" };

  // Header
  mergeHeader(ws, "A2:A4", "No");
  mergeHeader(ws, "B2:B4", "Pemohon");
  mergeHeader(ws, "C2:D2", "Letak Tanah");
  mergeHeader(ws, "E2:E4", "No. GU");
  mergeHeader(ws, "F2:F4", "Tahun");
  mergeHeader(ws, "G2:G4", "Luas()");
  mergeHeader(ws, "H2:L2", "RAK");

  mergeHeader(ws, "C3:C4", "Desa");
  mergeHeader(ws, "D3:D4", "Kecamatan");
  mergeHeader(ws, "H3:H4", "NIB");
  mergeHeader(ws, "I3:I4", "SU");
  mergeHeader(ws, "J3:J4", "NO");
  mergeHeader(ws, "K3:K4", "Baris");
  mergeHeader(ws, "L3:L4", "Kolom");

  // Data (mulai row 5)
  items.forEach((item, index) => {
    const rowNumber = 5 + index;
    const row = ws.getRow(rowNumber);

    const values: (string | number)[] = [
      item.no,
      item.pemohon,
      item.desa,
      item.kecamatan,
      toNumericIfPossible(item.noGu),
      toNumericIfPossible(item.tahun),
      toNumericIfPossible(item.luas),
      String(item.nib), // selalu teks agar leading zero tetap utuh
      String(item.su),
      toNumericIfPossible(item.rakNo),
      toNumericIfPossible(item.rakBaris),
      toNumericIfPossible(item.rakKolom),
    ];

    values.forEach((value, i) => {
      const cell = row.getCell(i + 1);
      cell.value = value;
      cell.font = { ...FONT };
      cell.border = BORDER;
      cell.alignment = {
        horizontal: i === 1 ? "left" : "center",
        vertical: "middle",
      };
      // Kolom NIB (H) & SU (I): format teks eksplisit
      if (i === 7 || i === 8) {
        cell.numFmt = "@";
      }
    });
    row.commit();
  });

  return wb;
}

export async function downloadWarkahExcel(items: WarkahItem[]): Promise<string> {
  const year = detectYear(items);
  const wb = await buildWarkahWorkbook(items, year);
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const fileName = `warkah_daftar_gambar_ukur_tahun${year}.xlsx`;
  saveAs(blob, fileName);
  return fileName;
}
