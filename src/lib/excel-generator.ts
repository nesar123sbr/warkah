import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { WarkahItem } from "@/types/warkah";
import { toNumericIfPossible } from "@/lib/utils";

const FONT: Partial<ExcelJS.Font> = { name: "Calibri", size: 11 };
const BOLD_FONT: Partial<ExcelJS.Font> = { ...FONT, bold: true };
const CENTER: Partial<ExcelJS.Alignment> = { horizontal: "center" };
const LEFT: Partial<ExcelJS.Alignment> = { horizontal: "left" };

const COLUMN_WIDTHS = [9.14, 33.86, 15.43, 15.43, 13.0, 13.0, 8.57, 8.43, 9.14, 13.0, 13.0, 13.0];

/** Isi sel header: Calibri 11 Bold, rata tengah. Tanpa border. */
function setHeader(ws: ExcelJS.Worksheet, address: string, value: string): void {
  const cell = ws.getCell(address);
  cell.value = value;
  cell.font = BOLD_FONT;
  cell.alignment = CENTER;
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

  // Row 1
  ws.mergeCells("A1:L1");
  setHeader(ws, "A1", "DAFTAR GAMBAR UKUR");

  // Row 2
  ws.mergeCells("A2:A3");
  setHeader(ws, "A2", "No");
  ws.mergeCells("B2:B3");
  setHeader(ws, "B2", "Pemohon");
  ws.mergeCells("C2:D2");
  setHeader(ws, "C2", "Letak Tanah");
  setHeader(ws, "E2", "No. GU");
  setHeader(ws, "F2", "Tahun");

  // Row 3
  setHeader(ws, "C3", "Desa");
  setHeader(ws, "D3", "Kecamatan");
  setHeader(ws, "G3", "Luas()");
  ws.mergeCells("H3:L3");
  setHeader(ws, "H3", "RAK");

  // Row 4 (A4:G4 dibiarkan kosong)
  setHeader(ws, "H4", "NIB");
  setHeader(ws, "I4", "SU");
  setHeader(ws, "J4", "NO");
  setHeader(ws, "K4", "Baris");
  setHeader(ws, "L4", "Kolom");

  // Data (mulai row 5)
  items.forEach((item, index) => {
    const row = ws.getRow(5 + index);

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
      cell.font = FONT;
      cell.alignment = i === 1 ? LEFT : CENTER;
      // Kolom NIB (H) & SU (I): format teks murni
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
