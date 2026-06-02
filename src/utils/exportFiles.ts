import * as XLSX from "xlsx";
import { Invoice, Client, BookkeepingRecord, ProfitLossReport, BizProfile } from "../types";

// Helper to format currency to IDR
export const formatIDR = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Helper for Indonesian Month Name
export const getIndonesianMonthName = (monthStr: string): string => {
  const months: { [key: string]: string } = {
    "01": "Januari",
    "02": "Februari",
    "03": "Maret",
    "04": "April",
    "05": "Mei",
    "06": "Juni",
    "07": "Juli",
    "08": "Agustus",
    "09": "September",
    "10": "Oktober",
    "11": "November",
    "12": "Desember"
  };
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const m = parts[1];
    const y = parts[0];
    return `${months[m] || m} ${y}`;
  }
  return monthStr;
};

// 1. Export Invoice to PDF
export const exportInvoicePDF = async (invoice: Invoice, client: Client, bizProfile?: BizProfile) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Helper converter helper for hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    let cleaned = hex.replace("#", "");
    if (cleaned.length === 3) {
      cleaned = cleaned.split("").map(c => c + c).join("");
    }
    const num = parseInt(cleaned, 16);
    return [
      (num >> 16) & 255,
      (num >> 8) & 255,
      num & 255
    ];
  };

  // Color Palette - Drawn dynamically from Settings PDF Template config
  const primaryColor = bizProfile?.pdfColorPrimary ? hexToRgb(bizProfile.pdfColorPrimary) : [13, 148, 136]; // Teal #0d9488
  const secondaryColor = bizProfile?.pdfColorSecondary ? hexToRgb(bizProfile.pdfColorSecondary) : [71, 85, 105]; // Slate #475569
  const darkColor = [15, 23, 42]; // Slate 900 #0f172a
  const lightColor = [248, 250, 252]; // Slate 50 #f8fafc

  // Header Background Accent
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 15, "F");

  // Logo Drawing in PDF (handles JPG / PNG base64 safely or link)
  let yTextOffset = 32;
  if (bizProfile?.logoUrl) {
    try {
      doc.addImage(bizProfile.logoUrl, "PNG", 15, 21, 12, 12);
      yTextOffset = 38; // Push text down slightly when logo exists
    } catch (e) {
      // safe fallback on CORS or canvas errors
    }
  }

  // Logo Text / Organization Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(bizProfile?.companyName || "NOC MONITORING", 15, yTextOffset);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(bizProfile?.pdfSubTitle || "SLA PROACTIVE SERVICES", 15, yTextOffset + 5);
  doc.text(bizProfile?.address || "Gedung Cyber, Lt. 3, Kuningan Barat, Jakarta Selatan", 15, yTextOffset + 9);
  doc.text(`Email: ${bizProfile?.email || "billing@nocnet.id"} | Telp: ${bizProfile?.phone || "+62 811-9988-7711"}`, 15, yTextOffset + 13);

  // Invoice Title Right Aligned
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(bizProfile?.pdfTitle || "INVOICE UTAMA SLA", 195, 32, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`# ${invoice.id}`, 195, 38, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, 58, 195, 58);

  // Meta info columns
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("DITAGIHKAN KEPADA:", 15, 68);
  doc.text("INFORMASI TAGIHAN:", 120, 68);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  // Client Details
  doc.setFont("helvetica", "bold");
  doc.text(client.company, 15, 74);
  doc.setFont("helvetica", "normal");
  doc.text(`Attn: ${client.name}`, 15, 79);
  doc.text(`Email: ${client.email}`, 15, 84);
  doc.text(`Telp: ${client.phone}`, 15, 89);

  // Invoice Details
  doc.text(`Periode Layanan    : ${getIndonesianMonthName(invoice.billingMonth)}`, 120, 74);
  doc.text(`Tanggal Terbit         : ${invoice.issuedDate}`, 120, 79);
  doc.text(`Jatuh Tempo           : ${invoice.dueDate}`, 120, 84);
  doc.setFont("helvetica", "bold");
  const statusColor = invoice.status === "Paid" ? "LUNAS" : invoice.status === "Overdue" ? "MENUNGGAK" : "BELUM BAYAR";
  doc.text(`Status Pembayaran : ${statusColor}`, 120, 89);

  // Divider
  doc.line(15, 96, 195, 96);

  // Table Header
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(15, 101, 180, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("Deskripsi Layanan SLA", 18, 106);
  doc.text("Kuantitas", 130, 106, { align: "right" });
  doc.text("Harga Per Bulan", 160, 106, { align: "right" });
  doc.text("Jumlah (IDR)", 192, 106, { align: "right" });

  // Table Body (Using actual NOC client services)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Layanan Monitoring Proaktif NOC - Tier: ${client.serviceType}`, 18, 116);
  doc.text("SLA Level Target: 99.9% uptime real-time alerting", 18, 121);
  doc.text("1", 130, 116, { align: "right" });
  doc.text(formatIDR(client.monthlyFee), 160, 116, { align: "right" });
  doc.text(formatIDR(client.monthlyFee), 192, 116, { align: "right" });

  doc.line(15, 128, 195, 128);

  // Subtotals and totals
  const subtotal = invoice.amount;
  const ppn = subtotal * 0.11; // 11% Indonesian VAT Tax
  const grandTotal = subtotal + ppn;

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", 145, 136, { align: "right" });
  doc.text(formatIDR(subtotal), 192, 136, { align: "right" });

  doc.text("PPN (11%):", 145, 141, { align: "right" });
  doc.text(formatIDR(ppn), 192, 141, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Total Tagihan:", 145, 148, { align: "right" });
  doc.text(formatIDR(grandTotal), 192, 148, { align: "right" });

  // Payment Instruction panels at bottom
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(15, 154, 180, 42, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("PETUNJUK PEMBAYARAN ELEKTRONIK:", 20, 160);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  if (bizProfile?.staticQrisUrl || bizProfile?.staticQrisPayload) {
    doc.text("1. Pilihan QRIS Statis Otomatis (Instan):", 20, 165);
    doc.setFont("helvetica", "bold");
    doc.text(`   Scan QRIS pada Portal Pembayaran Digital (Merchant: ${bizProfile.qrisMerchantName || "SLA NOC BILLING"})`, 20, 169);
  } else {
    doc.text("1. Pilihan QRIS Statis Otomatis (Instan):", 20, 165);
    doc.setFont("helvetica", "bold");
    doc.text("   Scan QRIS dinamis di Portal Pelanggan", 20, 169);
  }

  doc.setFont("helvetica", "normal");
  doc.text("2. Saluran Transfer Virtual Account Aktif:", 20, 175);
  doc.setFont("helvetica", "bold");
  
  const activeMethods = bizProfile?.customPaymentMethods?.filter(pm => pm.active) || [];
  if (activeMethods.length > 0) {
    activeMethods.slice(0, 3).forEach((item, idx) => {
      const yOffset = 180 + (idx * 5);
      doc.text(`   - ${item.name} | No. Rek: ${item.accountNumber} A.N. ${item.accountHolder}`, 20, yOffset);
    });
  } else {
    doc.text("   - Bank Mandiri VA : 8899120000002   A.N. PT NOC MONITORING UTAMA", 20, 180);
    doc.text("   - Bank BCA VA     : 7711230000003   A.N. PT NOC MONITORING UTAMA", 20, 185);
  }

  // Footer terms custom
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(bizProfile?.pdfCustomNote || "Pesan ini digenerate secara otomatis oleh Billing NOC System dengan pembukuan real-time terintegrasi.", 105, 206, { align: "center" });
  doc.text(bizProfile?.footerText || "Terima kasih atas kepatuhan pembayaran tepat waktu demi kualitas monitoring server terbaik.", 105, 210, { align: "center" });

  // Save the document
  doc.save(`Invoice_${invoice.id}_${client.company.replace(/\s+/g, "_")}.pdf`);
};

// 2. Export Profit & Loss Report to PDF
export const exportProfitLossPDF = async (reportData: ProfitLossReport[], year: string, bookkeeping: BookkeepingRecord[]) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [13, 148, 136]; // Teal #0d9488
  const grayColor = [100, 116, 139]; // Slate 500

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("LAPORAN LABA RUGI BULANAN", 15, 25);
  
  doc.setFontSize(11);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`Tahun Buku: ${year} (Rekonsiliasi Pembukuan Otomatis)`, 15, 31);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Unit Layanan: PT NOC Monitoring Utama - SLA Monitoring & Reporting Suite", 15, 36);
  doc.text(`Waktu Cetak : ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID")}`, 15, 41);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 45, 195, 45);

  // Summary Metrics Header Card
  let totalRevenue = 0;
  let totalExpenses = 0;
  reportData.forEach(r => {
    totalRevenue += r.revenue;
    totalExpenses += r.expenses;
  });
  const totalNet = totalRevenue - totalExpenses;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(15, 50, 180, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("IKHTISAR KINERJA KEUANGAN TAHUNAN:", 18, 55);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Total Pendapatan", 20, 62);
  doc.setFont("helvetica", "normal");
  doc.text(formatIDR(totalRevenue), 52, 62);

  doc.setFont("helvetica", "bold");
  doc.text("Total Pengeluaran", 88, 62);
  doc.setFont("helvetica", "normal");
  doc.text(formatIDR(totalExpenses), 122, 62);

  doc.setFont("helvetica", "bold");
  doc.text("Keuntungan Bersih", 150, 62);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(totalNet >= 0 ? accentColor[0] : 185, totalNet >= 0 ? accentColor[1] : 28, totalNet >= 0 ? accentColor[2] : 28);
  doc.text(formatIDR(totalNet), 183, 62, { align: "right" });

  // Monthly Table
  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(15, 75, 180, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("Bulan Buku", 18, 80);
  doc.text("Pendapatan (IDR)", 85, 80, { align: "right" });
  doc.text("Pengeluaran Operational (IDR)", 135, 80, { align: "right" });
  doc.text("Laba/Rugi Bersih (IDR)", 192, 80, { align: "right" });

  let yOffset = 89;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700

  reportData.forEach((row, idx) => {
    // Alternating rows coloring
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yOffset - 4, 180, 6.5, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(row.monthName, 18, yOffset);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(formatIDR(row.revenue), 85, yOffset, { align: "right" });
    doc.text(formatIDR(row.expenses), 135, yOffset, { align: "right" });

    doc.setFont("helvetica", "bold");
    if (row.netProfit >= 0) {
      doc.setTextColor(13, 148, 136); // Teal
    } else {
      doc.setTextColor(220, 38, 38); // Red
    }
    doc.text(formatIDR(row.netProfit), 192, yOffset, { align: "right" });

    yOffset += 7;
  });

  // End of P&L Table line
  doc.setDrawColor(203, 213, 225);
  doc.line(15, yOffset, 195, yOffset);

  // Let's add expenses categorized list for June
  yOffset += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("ANALISIS KATEGORI BIAYA RATA-RATA OPERASIONAL:", 15, yOffset);
  
  yOffset += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("Pembukuan menguraikan beberapa pos pengeluaran server dan lisensi rutin bulanan:", 15, yOffset);

  // Group by category from bookkeeping list
  const categoryTotals: { [key: string]: number } = {};
  bookkeeping.forEach(rec => {
    if (rec.type === "Expense") {
      categoryTotals[rec.category] = (categoryTotals[rec.category] || 0) + rec.amount;
    }
  });

  yOffset += 6;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  
  Object.entries(categoryTotals).forEach(([category, val]) => {
    if (yOffset > 270) {
      doc.addPage();
      yOffset = 25;
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`- ${category}`, 18, yOffset);
    doc.setFont("helvetica", "bold");
    doc.text(formatIDR(val), 192, yOffset, { align: "right" });
    yOffset += 6.5;
  });

  // Sign-off section
  yOffset += 12;
  if (yOffset > 250) {
    doc.addPage();
    yOffset = 25;
  }
  doc.setDrawColor(226, 232, 240);
  doc.line(15, yOffset, 195, yOffset);

  yOffset += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Disetujui Oleh,", 145, yOffset);

  yOffset += 18;
  doc.text("Finance Department Head", 145, yOffset);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text("PT NOC Monitoring Utama", 145, yOffset + 4.5);

  doc.save(`Laporan_Laba_Rugi_${year}.pdf`);
};

// 3. Export Bookkeeping Ledger Excel Workbook
export const exportBookkeepingExcel = (bookkeeping: BookkeepingRecord[], invoices: Invoice[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: General Ledger/Buku Kas
  const ledgerData = bookkeeping.map(b => ({
    "ID Transaksi": b.id,
    "Tanggal": b.date,
    "Tipe": b.type === "Income" ? "Penerimaan (Masuk)" : "Pengeluaran (Keluar)",
    "Kategori Transaksi": b.category,
    "ID Invoice Terkait": b.invoiceId || "-",
    "Deskripsi Rincian": b.description,
    "Jumlah Rupiah": b.amount
  }));

  const wsLedger = XLSX.utils.json_to_sheet(ledgerData);
  XLSX.utils.book_append_sheet(wb, wsLedger, "Buku Kas Kasir NOC");

  // Sheet 2: Invoice Master
  const invoiceData = invoices.map(i => ({
    "No Invoice": i.id,
    "Nama Klien": i.clientName,
    "Instansi Klien": i.clientCompany,
    "Bulan Layanan": i.billingMonth,
    "Tanggal Terbit": i.issuedDate,
    "Tanggal Jatuh Tempo": i.dueDate,
    "Total Nominal": i.amount,
    "Status": i.status === "Paid" ? "Lunas" : i.status === "Overdue" ? "Terlambat (Overdue)" : "Belum Bayar",
    "Metode Pembayaran": i.paymentMethod || "-",
    "Tanggal Pelunasan": i.paymentDate || "-",
    "Banyak WA Pengingat": i.reminderSentCount
  }));

  const wsInvoices = XLSX.utils.json_to_sheet(invoiceData);
  XLSX.utils.book_append_sheet(wb, wsInvoices, "Master Tagihan Pelanggan");

  // Sheet 3: Financial Summary Analysis
  // Calculate P&L by Month
  const pmTracker: { [key: string]: { revenue: number; expenses: number } } = {};
  
  // Expenses from bookkeeping
  bookkeeping.forEach(rec => {
    const month = rec.date.substring(0, 7); // "YYYY-MM"
    if (!pmTracker[month]) {
      pmTracker[month] = { revenue: 0, expenses: 0 };
    }
    if (rec.type === "Expense") {
      pmTracker[month].expenses += rec.amount;
    } else {
      pmTracker[month].revenue += rec.amount;
    }
  });

  const summaryData = Object.entries(pmTracker)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      "Periode Bulan": getIndonesianMonthName(month),
      "Total Penerimaan Pendapatan (IDR)": data.revenue,
      "Total Pengeluaran Operasional (IDR)": data.expenses,
      "Keuntungan Bersih (Laba Bersih IDR)": data.revenue - data.expenses,
      "Rasio Efisiensi Biaya (%)": data.revenue > 0 ? Math.round((data.expenses / data.revenue) * 100) : 0
    }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Analisa Keuangan Bulanan");

  // Trigger browser download of Excel Book
  XLSX.writeFile(wb, `Laporan_Pembukuan_NOC_${new Date().getFullYear()}.xlsx`);
};
