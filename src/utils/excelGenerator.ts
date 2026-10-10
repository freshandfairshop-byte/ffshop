import * as XLSX from 'xlsx';
import { LEGACY_EXCEL_TEMPLATE_DATA } from '../data/initialData';

export function createExcelBuffer(data: Array<{ item_name: string; stock_level: number; price: number }>): Uint8Array {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory_Tracker');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

export function downloadSampleExcelFile(): void {
  const buffer = createExcelBuffer(LEGACY_EXCEL_TEMPLATE_DATA);
  const blob = new Blob([buffer as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Inventory_Tracker.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseExcelFile(
  file: File
): Promise<Array<{ item_name: string; stock_level: number; price: number }>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const normalized = rawJson.map((row) => {
          // Normalize column names in case of casing differences
          const itemName = (row['item_name'] || row['Item Name'] || row['Item'] || row['name'] || 'Unnamed Item') as string;
          const stock = Number(row['stock_level'] ?? row['Stock Level'] ?? row['stock'] ?? row['Quantity'] ?? 0);
          const price = Number(row['price'] ?? row['Price'] ?? row['Unit Price'] ?? 0);

          return {
            item_name: String(itemName).trim(),
            stock_level: isNaN(stock) ? 0 : Math.max(0, Math.floor(stock)),
            price: isNaN(price) ? 0.0 : Number(price.toFixed(2)),
          };
        });

        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
