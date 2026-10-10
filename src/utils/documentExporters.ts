import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports data to native Microsoft Excel (.xlsx) file
 */
export function exportToXlsx(
  data: Array<Record<string, unknown>>,
  filename: string,
  sheetName = 'Report'
): void {
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on content
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, cleanFilename);
}

/**
 * Exports structured report to professional PDF document
 */
export function exportToPdf(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  subtitle?: string
): void {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter',
  });

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 40, 45);

  // Subtitle & Timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  const dateStr = new Date().toLocaleString();
  const sub = subtitle ? `${subtitle}  |  Generated: ${dateStr}` : `Generated: ${dateStr}`;
  doc.text(sub, 40, 62);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(40, 72, 750, 72);

  // Table
  autoTable(doc, {
    startY: 85,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [16, 185, 129], // emerald-500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      // Footer page numbering
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Cloud Inventory & POS Suite  —  Page ${pageNumber}`,
        40,
        doc.internal.pageSize.height - 20
      );
    },
  });

  doc.save(cleanFilename);
}

/**
 * Exports structured table report to Microsoft Word document (.doc)
 * Generates an official Microsoft Word compatible MIME document with full table formatting.
 */
export function exportToDoc(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  subtitle?: string
): void {
  const cleanFilename = filename.endsWith('.doc') || filename.endsWith('.docx') ? filename : `${filename}.doc`;
  const dateStr = new Date().toLocaleString();

  const headerCellsHtml = headers
    .map(
      (h) =>
        `<th style="background-color: #10b981; color: #ffffff; padding: 10px; font-weight: bold; border: 1px solid #cbd5e1; text-align: left;">${h}</th>`
    )
    .join('');

  const rowsHtml = rows
    .map((row, idx) => {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = row
        .map(
          (c) =>
            `<td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 11pt; color: #1e293b;">${c}</td>`
        )
        .join('');
      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join('');

  const wordDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body {
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          color: #0f172a;
          margin: 40px;
        }
        h1 {
          font-size: 22pt;
          color: #0f172a;
          margin-bottom: 4px;
        }
        p.subtitle {
          font-size: 11pt;
          color: #64748b;
          margin-top: 0;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 10.5pt;
        }
        footer {
          margin-top: 30px;
          font-size: 9pt;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="subtitle">${subtitle ? subtitle + ' — ' : ''}Generated on: ${dateStr}</p>
      <table>
        <thead>
          <tr>${headerCellsHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <footer>
        <p>Exported from Cloud Inventory & Sales Application · Streamlit & Supabase PostgreSQL Suite</p>
      </footer>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordDocumentHtml], {
    type: 'application/msword',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
