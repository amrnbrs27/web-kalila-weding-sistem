const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Setting = require('../models/Setting');
const AppError = require('../utils/AppError');
const { getTodayWIB } = require('../utils/dateUtils');
const {
  getFinanceRecap,
  getTransactionsExportMeta,
  createTransactionsExportCursor,
} = require('./financeService');

const MAX_EXPORT_ROWS_PDF = 2000;
const MAX_EXPORT_ROWS_XLSX = 20000;

/**
 * Mengamankan sel teks untuk Excel/spreadsheet agar tidak pernah dievaluasi sebagai rumus
 * (mencegah Spreadsheet Formula Injection seperti "=1+1", "+cmd", "@SUM(A1)").
 */
function sanitizeSpreadsheetText(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.length === 0) return '';
  // Jika diawali spasi/kontrol + karakter pemicu rumus (=, +, -, @, tab, CR), awali dengan apostrof
  if (/^[\s\u0000-\u001F]*[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Menjaga teks agar hanya memakai karakter yang didukung font bawaan PDFKit (Helvetica/WinAnsi).
 */
function toPdfSafeText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .trim();
}

/**
 * Memformat angka integer Rupiah untuk tampilan PDF (mis. "Rp 1.500.000", "-Rp 500.000").
 */
function formatRupiahPdf(amount) {
  const num = Math.round(Number(amount) || 0);
  const absFormatted = Math.abs(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return num < 0 ? `-Rp ${absFormatted}` : `Rp ${absFormatted}`;
}

/**
 * Mengubah objek Date UTC menjadi Date berpenanda WIB (+7 jam) agar nilai serial tanggal Excel
 * menampilkan jam lokal WIB dengan tepat namun tetap bertipe Date sungguhan.
 */
function toWibExcelDate(dateInput) {
  if (!dateInput) return null;
  const dt = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(dt.getTime())) return null;
  return new Date(dt.getTime() + 7 * 60 * 60 * 1000);
}

/**
 * Memformat Date ke string WIB ("YYYY-MM-DD HH:mm WIB") untuk tampilan PDF / Ringkasan.
 */
function formatDateTimeWIB(dateInput) {
  const wibDate = toWibExcelDate(dateInput);
  if (!wibDate) return '-';
  const y = wibDate.getUTCFullYear();
  const m = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wibDate.getUTCDate()).padStart(2, '0');
  const hh = String(wibDate.getUTCHours()).padStart(2, '0');
  const mm = String(wibDate.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm} WIB`;
}

/**
 * Memformat tanggal saja ke "YYYY-MM-DD" (WIB).
 */
function formatDateOnlyWIB(dateInput) {
  const wibDate = toWibExcelDate(dateInput);
  if (!wibDate) return '-';
  const y = wibDate.getUTCFullYear();
  const m = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(wibDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Membuat nama berkas unduhan aman di server hanya dari parameter terverifikasi
 * (huruf kecil, angka, dan strip; tanpa input teks bebas seperti `q`).
 */
function buildSafeExportFilename({ report, format, meta }) {
  let rawBase = `laporan-keuangan-${report}`;
  if (report === 'transactions') {
    rawBase = `laporan-transaksi-${meta.filters.from}-sd-${meta.filters.to}`;
  } else if (report === 'recap') {
    if (meta.groupBy === 'year') {
      rawBase = `rekap-keuangan-tahunan-${meta.fromYear}-sd-${meta.toYear}`;
    } else {
      rawBase = `rekap-keuangan-bulanan-${meta.year}`;
    }
  }

  const safeBase = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const safeExt = format === 'pdf' ? 'pdf' : 'xlsx';
  return `${safeBase}.${safeExt}`;
}

/**
 * Menyesuaikan lebar kolom worksheet Excel berdasarkan panjang isi setiap sel.
 */
function autoFitColumns(worksheet, minWidth = 10, maxWidth = 42) {
  worksheet.columns.forEach((column) => {
    let maxLen = minWidth;
    column.eachCell({ includeEmpty: false }, (cell) => {
      let textLen = 0;
      const val = cell.value;
      if (val instanceof Date) {
        textLen = 17;
      } else if (typeof val === 'number') {
        textLen = Math.abs(val).toString().length + 6;
      } else if (val && typeof val === 'object' && val.formula) {
        textLen = 18;
      } else if (val !== null && val !== undefined) {
        textLen = String(val).length;
      }
      if (textLen + 3 > maxLen) {
        maxLen = textLen + 3;
      }
    });
    column.width = Math.min(Math.max(maxLen, minWidth), maxWidth);
  });
}

/**
 * Mempersiapkan metadata ekspor dan mengecek batas jumlah baris SEBELUM membuat berkas.
 */
async function prepareFinanceExport(query, adminUser) {
  const settings = await Setting.getSettings();
  const businessName = settings?.businessName || 'Kalila Wedding, Dekor & Catering';
  const adminName = adminUser?.name || 'Admin';
  const printedAt = new Date();

  const { report, format } = query;

  if (report === 'transactions') {
    const meta = await getTransactionsExportMeta(query);
    const maxRows = format === 'pdf' ? MAX_EXPORT_ROWS_PDF : MAX_EXPORT_ROWS_XLSX;

    if (meta.count > maxRows) {
      throw new AppError(
        `Jumlah baris (${meta.count}) melebihi batas ekspor ${format.toUpperCase()} (maksimal ${maxRows.toLocaleString('id-ID')} baris). Silakan persempit periode atau tambahkan filter.`,
        400
      );
    }

    const filename = buildSafeExportFilename({ report, format, meta });
    return {
      report,
      format,
      filename,
      businessName,
      adminName,
      printedAt,
      rowCount: meta.count,
      meta,
      periodLabel: `${meta.filters.from} s/d ${meta.filters.to}`,
    };
  }

  // report === 'recap'
  const currentYear = Number(getTodayWIB().slice(0, 4));
  const groupBy = query.groupBy || 'month';
  const recapData = await getFinanceRecap({
    groupBy,
    year: query.year !== undefined ? Number(query.year) : currentYear,
    fromYear: query.fromYear !== undefined ? Number(query.fromYear) : undefined,
    toYear: query.toYear !== undefined ? Number(query.toYear) : undefined,
  });

  const filename = buildSafeExportFilename({ report, format, meta: recapData });
  const periodLabel =
    recapData.groupBy === 'month'
      ? `Tahun ${recapData.year} (Bulanan)`
      : `Tahun ${recapData.fromYear} - ${recapData.toYear} (Tahunan)`;

  return {
    report,
    format,
    filename,
    businessName,
    adminName,
    printedAt,
    rowCount: recapData.rows.length,
    recapData,
    periodLabel,
  };
}

/**
 * Mengisi sheet "Ringkasan" pada workbook XLSX.
 */
function buildSummaryWorksheet(workbook, exportContext, summaryNumbers) {
  const sheet = workbook.addWorksheet('Ringkasan');
  const currencyFmt = '"Rp"#,##0;-"Rp"#,##0;"Rp"0';

  const title =
    exportContext.report === 'transactions'
      ? 'Laporan Transaksi Keuangan'
      : 'Laporan Rekapitulasi Keuangan';

  const infoRows = [
    ['Nama Usaha', sanitizeSpreadsheetText(exportContext.businessName)],
    ['Judul Laporan', title],
    ['Periode', sanitizeSpreadsheetText(exportContext.periodLabel)],
    ['Waktu Cetak (WIB)', formatDateTimeWIB(exportContext.printedAt)],
    ['Dicetak Oleh', sanitizeSpreadsheetText(exportContext.adminName)],
    ['Jumlah Baris Data', exportContext.rowCount],
    [],
    ['Ringkasan Arus Kas', 'Nominal (Rp)'],
    ['Total Pemasukan (Masuk)', summaryNumbers.gross],
    ['Total Pengembalian (Keluar)', summaryNumbers.refunds],
    ['Pemasukan Bersih (Net)', summaryNumbers.net],
    [],
    ['Rincian Pemasukan Bersih per Kategori', 'Nominal Bersih (Rp)'],
    ['Dekor', summaryNumbers.byCategory.dekor],
    ['Catering', summaryNumbers.byCategory.catering],
    ['Wedding', summaryNumbers.byCategory.wedding],
  ];

  infoRows.forEach((rowVals, idx) => {
    const row = sheet.addRow(rowVals);
    if (idx === 0 || idx === 7 || idx === 12) {
      row.font = { bold: true };
    }
    if ([8, 9, 10, 13, 14, 15].includes(idx)) {
      const valCell = row.getCell(2);
      valCell.numFmt = currencyFmt;
      if (idx === 10) {
        row.font = { bold: true };
      }
    }
  });

  autoFitColumns(sheet, 18, 50);
}

/**
 * Mengalirkan file XLSX ke respons HTTP.
 */
async function streamXlsxExport(res, exportContext, query) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = sanitizeSpreadsheetText(exportContext.businessName);
  workbook.created = exportContext.printedAt;

  const currencyFmt = '"Rp"#,##0;-"Rp"#,##0;"Rp"0';

  if (exportContext.report === 'transactions') {
    const { meta } = exportContext;
    buildSummaryWorksheet(workbook, exportContext, {
      gross: meta.totals.masuk,
      refunds: meta.totals.keluar,
      net: meta.totals.net,
      byCategory: {
        dekor: meta.byCategory.dekor.net,
        catering: meta.byCategory.catering.net,
        wedding: meta.byCategory.wedding.net,
      },
    });

    const sheet = workbook.addWorksheet('Transaksi', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const headers = [
      'No',
      'Tanggal (WIB)',
      'No. Pesanan',
      'Pelanggan',
      'Kategori',
      'Paket',
      'Tipe',
      'Arah',
      'Metode',
      'Sumber',
      'Status',
      'Nominal (Rp)',
      'Masuk (Rp)',
      'Keluar (Rp)',
      'Verifikator',
      'Catatan',
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };

    const cursor = createTransactionsExportCursor(query);
    let idx = 0;

    for await (const item of cursor) {
      idx += 1;
      const isKeluar = item.direction === 'keluar';
      const amt = Math.round(item.amount || 0);
      const row = sheet.addRow([
        idx,
        toWibExcelDate(item.paidAt),
        sanitizeSpreadsheetText(item.bookingNumber),
        sanitizeSpreadsheetText(item.customerName),
        sanitizeSpreadsheetText(item.category),
        sanitizeSpreadsheetText(item.packageName),
        sanitizeSpreadsheetText(item.type),
        sanitizeSpreadsheetText(item.direction),
        sanitizeSpreadsheetText(item.method),
        sanitizeSpreadsheetText(item.source),
        sanitizeSpreadsheetText(item.status),
        amt,
        isKeluar ? 0 : amt,
        isKeluar ? amt : 0,
        sanitizeSpreadsheetText(item.verifiedByName),
        sanitizeSpreadsheetText(item.note),
      ]);

      row.getCell(2).numFmt = 'yyyy-mm-dd hh:mm';
      row.getCell(12).numFmt = currencyFmt;
      row.getCell(13).numFmt = currencyFmt;
      row.getCell(14).numFmt = currencyFmt;
    }

    const totalRow = sheet.addRow([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      idx > 0 ? { formula: `SUM(L2:L${idx + 1})` } : 0,
      idx > 0 ? { formula: `SUM(M2:M${idx + 1})` } : 0,
      idx > 0 ? { formula: `SUM(N2:N${idx + 1})` } : 0,
      '',
      '',
    ]);
    totalRow.font = { bold: true };
    totalRow.getCell(12).numFmt = currencyFmt;
    totalRow.getCell(13).numFmt = currencyFmt;
    totalRow.getCell(14).numFmt = currencyFmt;

    autoFitColumns(sheet, 10, 40);
  } else {
    const { recapData } = exportContext;
    buildSummaryWorksheet(workbook, exportContext, {
      gross: recapData.totals.gross,
      refunds: recapData.totals.refunds,
      net: recapData.totals.net,
      byCategory: recapData.totals.byCategory,
    });

    const sheet = workbook.addWorksheet('Rekap', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const headers = [
      'Periode',
      'Dekor Bersih (Rp)',
      'Catering Bersih (Rp)',
      'Wedding Bersih (Rp)',
      'Pemasukan Kotor (Rp)',
      'Pengembalian (Rp)',
      'Pemasukan Bersih (Rp)',
      'Jumlah Transaksi',
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };

    recapData.rows.forEach((r) => {
      const row = sheet.addRow([
        sanitizeSpreadsheetText(r.label),
        Math.round(r.byCategory.dekor || 0),
        Math.round(r.byCategory.catering || 0),
        Math.round(r.byCategory.wedding || 0),
        Math.round(r.gross || 0),
        Math.round(r.refunds || 0),
        Math.round(r.net || 0),
        Math.round(r.counts.payments || 0),
      ]);
      for (let c = 2; c <= 7; c += 1) {
        row.getCell(c).numFmt = currencyFmt;
      }
      row.getCell(8).numFmt = '#,##0';
    });

    const rowCount = recapData.rows.length;
    const totalRow = sheet.addRow([
      'TOTAL',
      rowCount > 0 ? { formula: `SUM(B2:B${rowCount + 1})` } : 0,
      rowCount > 0 ? { formula: `SUM(C2:C${rowCount + 1})` } : 0,
      rowCount > 0 ? { formula: `SUM(D2:D${rowCount + 1})` } : 0,
      rowCount > 0 ? { formula: `SUM(E2:E${rowCount + 1})` } : 0,
      rowCount > 0 ? { formula: `SUM(F2:F${rowCount + 1})` } : 0,
      rowCount > 0 ? { formula: `SUM(G2:G${rowCount + 1})` } : 0,
      rowCount > 0 ? { formula: `SUM(H2:H${rowCount + 1})` } : 0,
    ]);
    totalRow.font = { bold: true };
    for (let c = 2; c <= 7; c += 1) {
      totalRow.getCell(c).numFmt = currencyFmt;
    }
    totalRow.getCell(8).numFmt = '#,##0';

    autoFitColumns(sheet, 14, 34);
  }

  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Menggambar satu baris tabel PDF dengan pembungkus/pemotongan teks agar tidak keluar sel.
 */
function drawPdfTableRow(doc, columns, values, y, rowHeight, options = {}) {
  const { isHeader = false, isTotal = false, fillColor = null } = options;
  const startX = columns[0].x;
  const totalWidth = columns.reduce((acc, col) => acc + col.width, 0);

  if (fillColor) {
    doc.save();
    doc.rect(startX, y, totalWidth, rowHeight).fill(fillColor);
    doc.restore();
  }

  doc
    .font(isHeader || isTotal ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(isHeader ? 8 : 7.5)
    .fillColor('#111111');

  columns.forEach((col, i) => {
    const text = toPdfSafeText(values[i]);
    doc.text(text, col.x + 3, y + 4, {
      width: col.width - 6,
      height: rowHeight - 6,
      align: col.align || 'left',
      ellipsis: true,
    });
  });

  doc
    .moveTo(startX, y + rowHeight)
    .lineTo(startX + totalWidth, y + rowHeight)
    .lineWidth(isHeader || isTotal ? 0.8 : 0.4)
    .strokeColor('#CCCCCC')
    .stroke();
}

/**
 * Menggambar footer nomor halaman pada halaman PDF aktif.
 */
function drawPdfFooter(doc, pageNumber, printedAt) {
  const footerY = doc.page.height - doc.page.margins.bottom + 8;
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  doc.save();
  doc.font('Helvetica').fontSize(8).fillColor('#555555');
  doc.text(
    `Dicetak pada ${formatDateTimeWIB(printedAt)}`,
    doc.page.margins.left,
    footerY,
    { width: contentWidth / 2, align: 'left', lineBreak: false }
  );
  doc.text(
    `Halaman ${pageNumber}`,
    doc.page.margins.left + contentWidth / 2,
    footerY,
    { width: contentWidth / 2, align: 'right', lineBreak: false }
  );
  doc.restore();
}

/**
 * Mengalirkan file PDF langsung ke respons HTTP menggunakan PDFKit (font bawaan).
 */
async function streamPdfExport(res, exportContext, query) {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 32,
    autoFirstPage: true,
    info: {
      Title:
        exportContext.report === 'transactions'
          ? 'Laporan Transaksi Keuangan'
          : 'Laporan Rekapitulasi Keuangan',
      Author: toPdfSafeText(exportContext.businessName),
    },
  });

  let clientClosed = false;
  let activeCursor = null;

  const onClose = () => {
    clientClosed = true;
    if (activeCursor && typeof activeCursor.close === 'function') {
      activeCursor.close().catch(() => {});
    }
  };
  res.on('close', onClose);

  doc.pipe(res);

  const streamDonePromise = new Promise((resolve, reject) => {
    doc.once('error', reject);
    res.once('error', reject);
    res.once('finish', resolve);
    res.once('close', resolve);
  });

  try {
    let pageNumber = 1;
    const pageBottomLimit = doc.page.height - doc.page.margins.bottom - 18;
    const contentLeft = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Kop halaman pertama
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111');
    doc.text(toPdfSafeText(exportContext.businessName), contentLeft, doc.y);

    doc.font('Helvetica-Bold').fontSize(11);
    const reportTitle =
      exportContext.report === 'transactions'
        ? 'LAPORAN TRANSAKSI KEUANGAN'
        : 'LAPORAN REKAPITULASI KEUANGAN';
    doc.text(reportTitle, contentLeft, doc.y + 2);

    doc.font('Helvetica').fontSize(8.5).fillColor('#333333');
    doc.text(
      `Periode: ${toPdfSafeText(exportContext.periodLabel)}   |   Dicetak oleh: ${toPdfSafeText(exportContext.adminName)}   |   Waktu: ${formatDateTimeWIB(exportContext.printedAt)}`,
      contentLeft,
      doc.y + 3
    );

    // Ringkasan box pada halaman pertama
    let summaryInfo;
    if (exportContext.report === 'transactions') {
      const { meta } = exportContext;
      summaryInfo = {
        gross: meta.totals.masuk,
        refunds: meta.totals.keluar,
        net: meta.totals.net,
        dekor: meta.byCategory.dekor.net,
        catering: meta.byCategory.catering.net,
        wedding: meta.byCategory.wedding.net,
      };
    } else {
      const { recapData } = exportContext;
      summaryInfo = {
        gross: recapData.totals.gross,
        refunds: recapData.totals.refunds,
        net: recapData.totals.net,
        dekor: recapData.totals.byCategory.dekor,
        catering: recapData.totals.byCategory.catering,
        wedding: recapData.totals.byCategory.wedding,
      };
    }

    const boxY = doc.y + 6;
    doc.save();
    doc.rect(contentLeft, boxY, contentWidth, 34).fill('#F4F4F4');
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#111111');
    doc.text(
      `Masuk: ${formatRupiahPdf(summaryInfo.gross)}   |   Keluar: ${formatRupiahPdf(summaryInfo.refunds)}   |   Bersih: ${formatRupiahPdf(summaryInfo.net)}`,
      contentLeft + 8,
      boxY + 6,
      { width: contentWidth - 16 }
    );
    doc.font('Helvetica').fontSize(8).fillColor('#333333');
    doc.text(
      `Bersih per Kategori - Dekor: ${formatRupiahPdf(summaryInfo.dekor)}   |   Catering: ${formatRupiahPdf(summaryInfo.catering)}   |   Wedding: ${formatRupiahPdf(summaryInfo.wedding)}`,
      contentLeft + 8,
      boxY + 19,
      { width: contentWidth - 16 }
    );

    let y = boxY + 44;

    if (exportContext.report === 'transactions') {
      const rawCols = [
        { label: 'No', width: 28, align: 'right' },
        { label: 'Tanggal', width: 62, align: 'left' },
        { label: 'No. Pesanan', width: 82, align: 'left' },
        { label: 'Pelanggan', width: 96, align: 'left' },
        { label: 'Kategori', width: 52, align: 'left' },
        { label: 'Paket', width: 102, align: 'left' },
        { label: 'Tipe', width: 62, align: 'left' },
        { label: 'Arah', width: 42, align: 'left' },
        { label: 'Metode', width: 48, align: 'left' },
        { label: 'Status', width: 52, align: 'left' },
        { label: 'Nominal', width: 82, align: 'right' },
        { label: 'Catatan', width: 69, align: 'left' },
      ];
      let curX = contentLeft;
      const cols = rawCols.map((c) => {
        const colObj = { ...c, x: curX };
        curX += c.width;
        return colObj;
      });
      const headerVals = cols.map((c) => c.label);

      drawPdfTableRow(doc, cols, headerVals, y, 20, { isHeader: true, fillColor: '#E5E7EB' });
      y += 20;

      activeCursor = createTransactionsExportCursor(query);
      let idx = 0;

      for await (const item of activeCursor) {
        if (clientClosed) break;
        idx += 1;
        const rowHeight = 20;

        if (y + rowHeight > pageBottomLimit) {
          drawPdfFooter(doc, pageNumber, exportContext.printedAt);
          doc.addPage();
          pageNumber += 1;
          y = doc.page.margins.top;
          drawPdfTableRow(doc, cols, headerVals, y, 20, { isHeader: true, fillColor: '#E5E7EB' });
          y += 20;
        }

        const rowVals = [
          String(idx),
          formatDateOnlyWIB(item.paidAt),
          item.bookingNumber || '-',
          item.customerName || '-',
          item.category || '-',
          item.packageName || '-',
          item.type || '-',
          item.direction || '-',
          item.method || '-',
          item.status || '-',
          formatRupiahPdf(item.amount),
          item.note || '-',
        ];

        drawPdfTableRow(doc, cols, rowVals, y, rowHeight, {
          fillColor: idx % 2 === 0 ? '#FAFAFA' : null,
        });
        y += rowHeight;
      }

      if (!clientClosed) {
        const totalRowHeight = 22;
        if (y + totalRowHeight > pageBottomLimit) {
          drawPdfFooter(doc, pageNumber, exportContext.printedAt);
          doc.addPage();
          pageNumber += 1;
          y = doc.page.margins.top;
          drawPdfTableRow(doc, cols, headerVals, y, 20, { isHeader: true, fillColor: '#E5E7EB' });
          y += 20;
        }

        drawPdfTableRow(
          doc,
          cols,
          [
            '',
            'TOTAL BERSIH',
            `${exportContext.meta.totals.count} trx`,
            `Masuk: ${formatRupiahPdf(exportContext.meta.totals.masuk)}`,
            '',
            `Keluar: ${formatRupiahPdf(exportContext.meta.totals.keluar)}`,
            '',
            '',
            '',
            '',
            formatRupiahPdf(exportContext.meta.totals.net),
            '',
          ],
          y,
          totalRowHeight,
          { isTotal: true, fillColor: '#E5E7EB' }
        );
        drawPdfFooter(doc, pageNumber, exportContext.printedAt);
      }
    } else {
      const rawCols = [
        { label: 'Periode', width: 105, align: 'left' },
        { label: 'Dekor Bersih', width: 98, align: 'right' },
        { label: 'Catering Bersih', width: 98, align: 'right' },
        { label: 'Wedding Bersih', width: 98, align: 'right' },
        { label: 'Pemasukan Kotor', width: 105, align: 'right' },
        { label: 'Pengembalian', width: 95, align: 'right' },
        { label: 'Pemasukan Bersih', width: 108, align: 'right' },
        { label: 'Transaksi', width: 70, align: 'right' },
      ];
      let curX = contentLeft;
      const cols = rawCols.map((c) => {
        const colObj = { ...c, x: curX };
        curX += c.width;
        return colObj;
      });
      const headerVals = cols.map((c) => c.label);

      drawPdfTableRow(doc, cols, headerVals, y, 22, { isHeader: true, fillColor: '#E5E7EB' });
      y += 22;

      const { recapData } = exportContext;
      recapData.rows.forEach((r, idx) => {
        const rowHeight = 20;
        if (y + rowHeight > pageBottomLimit) {
          drawPdfFooter(doc, pageNumber, exportContext.printedAt);
          doc.addPage();
          pageNumber += 1;
          y = doc.page.margins.top;
          drawPdfTableRow(doc, cols, headerVals, y, 22, { isHeader: true, fillColor: '#E5E7EB' });
          y += 22;
        }

        drawPdfTableRow(
          doc,
          cols,
          [
            r.label,
            formatRupiahPdf(r.byCategory.dekor),
            formatRupiahPdf(r.byCategory.catering),
            formatRupiahPdf(r.byCategory.wedding),
            formatRupiahPdf(r.gross),
            formatRupiahPdf(r.refunds),
            formatRupiahPdf(r.net),
            String(r.counts.payments),
          ],
          y,
          rowHeight,
          { fillColor: idx % 2 === 1 ? '#FAFAFA' : null }
        );
        y += rowHeight;
      });

      const totalRowHeight = 22;
      if (y + totalRowHeight > pageBottomLimit) {
        drawPdfFooter(doc, pageNumber, exportContext.printedAt);
        doc.addPage();
        pageNumber += 1;
        y = doc.page.margins.top;
        drawPdfTableRow(doc, cols, headerVals, y, 22, { isHeader: true, fillColor: '#E5E7EB' });
        y += 22;
      }

      drawPdfTableRow(
        doc,
        cols,
        [
          'TOTAL',
          formatRupiahPdf(recapData.totals.byCategory.dekor),
          formatRupiahPdf(recapData.totals.byCategory.catering),
          formatRupiahPdf(recapData.totals.byCategory.wedding),
          formatRupiahPdf(recapData.totals.gross),
          formatRupiahPdf(recapData.totals.refunds),
          formatRupiahPdf(recapData.totals.net),
          String(recapData.totals.counts.payments),
        ],
        y,
        totalRowHeight,
        { isTotal: true, fillColor: '#E5E7EB' }
      );
      drawPdfFooter(doc, pageNumber, exportContext.printedAt);
    }

    doc.end();
    await streamDonePromise;
  } finally {
    res.removeListener('close', onClose);
    if (activeCursor && typeof activeCursor.close === 'function') {
      await activeCursor.close().catch(() => {});
    }
  }
}

module.exports = {
  MAX_EXPORT_ROWS_PDF,
  MAX_EXPORT_ROWS_XLSX,
  sanitizeSpreadsheetText,
  toPdfSafeText,
  prepareFinanceExport,
  streamXlsxExport,
  streamPdfExport,
};
