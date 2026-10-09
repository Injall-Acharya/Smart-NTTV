import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


/** Escape a CSV cell — wraps in quotes if needed. */
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build a CSV string from headers + rows. */
export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const head = headers.map(csvCell).join(',');
  const body = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  return `${head}\n${body}`;
}

/** Trigger a browser download of a text file. */
export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/** Convenience: download rows as a CSV file. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): void {
  downloadTextFile(filename, toCsv(headers, rows));
}

/* ─────────────────────────────────────────────────
   PDF
   ───────────────────────────────────────────────── */

const BRAND = { r: 31, g: 95, b: 168 };   // #1f5fa8
const DARK = { r: 13, g: 17, b: 23 };     // #0d1117
const MUTED = { r: 107, g: 118, b: 129 }; // #6b7681

/** Generate a PDF with a brand header + auto-generated table(s). */
export function downloadPdf(opts: {
  filename: string;
  title: string;
  subtitle?: string;
  sections: Array<{
    title: string;
    headers: string[];
    rows: Array<Array<string | number>>;
  }>;
}): void {
  const { filename, title, subtitle, sections } = opts;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  // ── Header bar ─────────────────────────────────
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Nepal Telecom', margin, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(title, margin, 44);

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, pageWidth - margin, 44, { align: 'right' });
  }

  // ── Generated timestamp ─────────────────────────
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.setFontSize(8);
  doc.text(
    `Generated ${new Date().toLocaleString()}`,
    pageWidth - margin,
    22,
    { align: 'right' }
  );

  // ── Sections ────────────────────────────────────
  let y = 90;

  sections.forEach((section, idx) => {
    if (idx > 0) y += 20;

    // Section title
    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(section.title, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [section.headers],
      body: section.rows.map((r) => r.map((v) => String(v))),
      theme: 'grid',
      headStyles: {
        fillColor: [BRAND.r, BRAND.g, BRAND.b],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: { fontSize: 9, textColor: [45, 55, 65] },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        // Footer on each page
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
        doc.setFontSize(7);
        const pageNum = doc.getNumberOfPages();
        doc.text(
          `Nepal Telecom · Confidential · Page ${pageNum}`,
          margin,
          pageHeight - 20
        );
      },
    });

    // @ts-ignore — lastAutoTable is set by the plugin
    y = doc.lastAutoTable.finalY + 12;
  });

  doc.save(filename);
}