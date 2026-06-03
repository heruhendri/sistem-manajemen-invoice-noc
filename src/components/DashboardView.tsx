import React, { useState, useMemo } from "react";
import { Client, Invoice, BookkeepingRecord, ProfitLossReport } from "../types";
import { formatIDR, getIndonesianMonthName, exportProfitLossPDF, exportBookkeepingExcel } from "../utils/exportFiles";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  AlertCircle, 
  Download, 
  Activity, 
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  QrCode,
  CreditCard,
  History
} from "lucide-react";
import { motion } from "motion/react";
import TrafficMonitor from "./TrafficMonitor";

interface DashboardViewProps {
  clients: Client[];
  invoices: Invoice[];
  bookkeeping: BookkeepingRecord[];
  onNavigate: (view: string) => void;
}

export default function DashboardView({ clients, invoices, bookkeeping, onNavigate }: DashboardViewProps) {
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [hoveredReportMonth, setHoveredReportMonth] = useState<string | null>(null);

  // Filter clients and invoices
  const activeClientsCount = useMemo(() => clients.filter(c => c.status === "Active").length, [clients]);

  // Get the last 10 successful QRIS / Bank Transfer payments
  const recentPayments = useMemo(() => {
    return invoices
      .filter(inv => inv.status === "Paid" && (inv.paymentMethod === "QRIS" || inv.paymentMethod === "Bank Transfer"))
      .sort((a, b) => {
        const dateA = a.paymentDate || "";
        const dateB = b.paymentDate || "";
        if (dateA === dateB) {
          return b.id.localeCompare(a.id);
        }
        return dateB.localeCompare(dateA);
      })
      .slice(0, 10);
  }, [invoices]);
  
  // Calculate general statistics for the current month (June 2026)
  const stats = useMemo(() => {
    let billingJune = 0;
    let paidJune = 0;
    let unpaidTotal = 0;
    let overdueTotal = 0;

    invoices.forEach(inv => {
      // June 2026 stats
      if (inv.billingMonth === "2026-06") {
        billingJune += inv.amount;
        if (inv.status === "Paid") {
          paidJune += inv.amount;
        }
      }
      // General balance due
      if (inv.status === "Unpaid") {
        unpaidTotal += inv.amount;
      } else if (inv.status === "Overdue") {
        overdueTotal += inv.amount;
      }
    });

    // Expenses in June 2026 (Note: our seed data has exp upto May, let's calculate actual total expenses)
    let totalExpense2026 = 0;
    let juneExpenses = 0;
    bookkeeping.forEach(b => {
      if (b.type === "Expense" && b.date.startsWith("2026-06")) {
        juneExpenses += b.amount;
      }
      if (b.type === "Expense") {
        totalExpense2026 += b.amount;
      }
    });

    return {
      billingJune,
      paidJune,
      unpaidTotal,
      overdueTotal,
      juneExpenses,
      totalExpense2026
    };
  }, [invoices, bookkeeping]);

  // Group by months for Laba Rugi Report
  const profitLossReports = useMemo((): ProfitLossReport[] => {
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {
      "2026-03": { revenue: 0, expenses: 0 },
      "2026-04": { revenue: 0, expenses: 0 },
      "2026-05": { revenue: 0, expenses: 0 },
      "2026-06": { revenue: 0, expenses: 0 }
    };

    // Calculate from official general bookkeeping register
    bookkeeping.forEach(rec => {
      const month = rec.date.substring(0, 7); // YYYY-MM
      if (monthlyData[month]) {
        if (rec.type === "Expense") {
          monthlyData[month].expenses += rec.amount;
        } else {
          monthlyData[month].revenue += rec.amount;
        }
      }
    });

    // Make sure we count June unpaid invoices? 
    // Wait! Traditional Cash Book bookkeeping (pembukuan berbasis kas) records income when money arrives (Status Paid in Invoice leads to Bookkeeping entries). 
    // To make it look extremely sync'd, we check that all "Paid" invoices are recorded in bookkeeping under "Pendapatan Jasa NOC".
    // We can compile the report based on these grouped values:
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        monthName: getIndonesianMonthName(month),
        revenue: data.revenue,
        expenses: data.expenses,
        netProfit: data.revenue - data.expenses
      }));
  }, [bookkeeping]);

  // Find max value in profitLossReports for SVG scaling
  const maxChartValue = useMemo(() => {
    let max = 10000000; // minimum 10jt limit
    profitLossReports.forEach(r => {
      if (r.revenue > max) max = r.revenue;
      if (r.expenses > max) max = r.expenses;
    });
    return max * 1.1; // 10% ceiling padding
  }, [profitLossReports]);

  // Quick PDF and Excel Actions
  const handleDownloadPL_PDF = () => {
    exportProfitLossPDF(profitLossReports, selectedYear, bookkeeping);
  };

  const handleDownloadPL_Excel = () => {
    exportBookkeepingExcel(bookkeeping, invoices);
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs" id="page-hdr">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" id="hdr-title">Dashboard Analitik SLA NOC</h1>
          <p className="text-sm text-slate-500" id="hdr-sub">Pemantauan arus kas, laporan laba-rugi otomatis, dan pengawasan penagihan real-time.</p>
        </div>
        <div className="flex flex-wrap gap-2" id="hdr-btns">
          <button 
            onClick={handleDownloadPL_PDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
            id="btn-download-pdf"
          >
            <Download className="w-4 h-4" /> Unduh Laba Rugi (PDF)
          </button>
          <button 
            onClick={handleDownloadPL_Excel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors cursor-pointer"
            id="btn-download-excel"
          >
            <Download className="w-4 h-4" /> Ekspor Buku Kas (Excel)
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        {/* Metric 1: Recurring Revenue target */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden" id="card-metric-total">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider" id="txt-total-inv">Penagihan Juni 2026</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1" id="val-total-inv">{formatIDR(stats.billingJune)}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600" id="icon-total-inv">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs" id="footer-total-inv">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 font-mono">
              <Clock className="w-3 h-3 mr-0.5" /> Berjalan
            </span>
            <span className="text-slate-400">Menunggu pembayaran jatuh tempo</span>
          </div>
        </div>

        {/* Metric 2: Paid Payments */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden" id="card-metric-paid">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider" id="txt-total-paid">Lunas Bulan Ini</p>
              <h3 className="text-lg font-bold text-blue-600 mt-1" id="val-total-paid">{formatIDR(stats.paidJune)}</h3>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600" id="icon-total-paid">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-xs text-slate-500" id="footer-total-paid">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Terpembukuan di kas masuk otomatis</span>
          </div>
        </div>

        {/* Metric 3: Outstanding Unpaid */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden" id="card-metric-unpaid">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider" id="txt-total-unpaid">Outstanding Belum Bayar</p>
              <h3 className="text-lg font-bold text-amber-600 mt-1" id="val-total-unpaid">{formatIDR(stats.unpaidTotal)}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600" id="icon-total-unpaid">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-xs text-amber-600" id="footer-total-unpaid">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Kirim pengingat tagihan WA di tab Invoice</span>
          </div>
        </div>

        {/* Metric 4: Overdue Invoices */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs relative overflow-hidden" id="card-metric-overdue">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider" id="txt-total-overdue">Total Menunggak (Overdue)</p>
              <h3 className="text-lg font-bold text-red-600 mt-1" id="val-total-overdue">{formatIDR(stats.overdueTotal)}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-600" id="icon-total-overdue">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-xs text-red-600 font-semibold" id="footer-total-overdue">
            <span>⚠️ Tindakan WA Overdue disarankan</span>
          </div>
        </div>
      </div>

      {/* Main Graph and Status Monitoring section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-layout">
        {/* Income Expense Chart Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-3.5" id="chart-card">
          <div className="flex justify-between items-center" id="chart-hdr">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight" id="chart-title">Grafik Perbandingan Laba Rugi Bulanan</h2>
              <span className="text-xs text-slate-400" id="chart-subtitle">Kas Masuk (Biru/Blue) vs Pengeluaran Server/Gaji (Slate)</span>
            </div>
            <div className="text-xs font-medium border border-slate-200 px-2 py-1 rounded bg-slate-50" id="chart-year-tag">
              Tahun {selectedYear}
            </div>
          </div>

          {/* Dynamic Interactive HUD for details */}
          {(() => {
            const activeReport = profitLossReports.find(r => r.month === hoveredReportMonth);
            return (
              <div className="h-12 flex items-center justify-between bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800 transition-all font-mono">
                {activeReport ? (
                  <div className="flex justify-between items-center w-full text-[11px] sm:text-xs">
                    <span className="text-sky-400 font-extrabold">📍 {activeReport.monthName} :</span>
                    <div className="flex gap-2 sm:gap-4 ml-2">
                      <span className="text-emerald-400">Masuk: <strong className="font-bold">{formatIDR(activeReport.revenue)}</strong></span>
                      <span className="text-slate-700">|</span>
                      <span className="text-rose-400">Keluar: <strong className="font-bold">{formatIDR(activeReport.expenses)}</strong></span>
                      <span className="text-slate-700">|</span>
                      <span className={`font-bold ${activeReport.revenue >= activeReport.expenses ? "text-emerald-400" : "text-rose-450"}`}>
                        Net: {formatIDR(activeReport.revenue - activeReport.expenses)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-[10.5px] font-sans flex items-center gap-1.5 w-full justify-center">
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    Sorot kursor / hover di atas balok grafik untuk rincian keuangan kas masuk-keluar riil.
                  </div>
                )}
              </div>
            );
          })()}

          {/* SVG Custom Interactive Chart */}
          <div className="w-full h-64 bg-slate-50/50 rounded-xl p-2 flex flex-col justify-between" id="chart-canvas-container">
            {/* SVG Elements */}
            <div className="flex-1 relative" id="chart-svg">
              <svg className="w-full h-full" viewBox="0 0 500 180" id="custom-bar-chart">
                {/* Horizontal Guide Lines */}
                <line x1="30" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="60" x2="480" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="100" x2="480" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="140" x2="480" y2="140" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3" />

                {/* Draw Columns for each month */}
                {profitLossReports.map((item, index) => {
                  const columnWidth = 100;
                  const startX = 40 + index * columnWidth;
                  
                  // Height scale ratio
                  const rHeight = (item.revenue / maxChartValue) * 120;
                  const eHeight = (item.expenses / maxChartValue) * 120;

                  // Bar Y coordinates (origin is y=140 since y=140 is bottom baseline)
                  const rY = 140 - rHeight;
                  const eY = 140 - eHeight;

                  return (
                    <g 
                      key={item.month} 
                      id={`month-g-${item.month}`}
                      onMouseEnter={() => setHoveredReportMonth(item.month)}
                      onMouseLeave={() => setHoveredReportMonth(null)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      {/* Highlight underlay */}
                      {hoveredReportMonth === item.month && (
                        <rect
                          x={startX - 10}
                          y="10"
                          width="60"
                          height="140"
                          fill="rgba(37, 99, 235, 0.05)"
                          rx="4"
                        />
                      )}
                      
                      {/* Revenue Bar */}
                      <rect 
                        x={startX} 
                        y={rY} 
                        width="18" 
                        height={rHeight > 0 ? rHeight : 1} 
                        fill={hoveredReportMonth === item.month ? "#3b82f6" : "#2563eb"} 
                        rx="3"
                        className="transition-all hover:brightness-110 cursor-pointer"
                      >
                        <title>{`Pendapatan ${item.monthName}: ${formatIDR(item.revenue)}`}</title>
                      </rect>
                      {/* Expense Bar */}
                      <rect 
                        x={startX + 22} 
                        y={eY} 
                        width="18" 
                        height={eHeight > 0 ? eHeight : 1} 
                        fill={hoveredReportMonth === item.month ? "#94a3b8" : "#64748b"} 
                        rx="3"
                        className="transition-all hover:brightness-110 cursor-pointer"
                      >
                        <title>{`Pengeluaran ${item.monthName}: ${formatIDR(item.expenses)}`}</title>
                      </rect>

                      {/* Net Profit Dot Indicator */}
                      {/* Calculate net profit projection dot */}
                      {(() => {
                        const netHeight = ((item.revenue - item.expenses) / maxChartValue) * 120;
                        const netY = 140 - netHeight;
                        const isPositive = (item.revenue - item.expenses) >= 0;
                        return (
                          <circle 
                            cx={startX + 20} 
                            cy={netY} 
                            r="4" 
                            fill={isPositive ? "#10b981" : "#ef4444"} 
                            stroke="#ffffff" 
                            strokeWidth="1.5"
                          >
                            <title>{`Laba Bersih: ${formatIDR(item.revenue - item.expenses)}`}</title>
                          </circle>
                        );
                      })()}

                      {/* Month Text Anchor */}
                      <text 
                        x={startX + 20} 
                        y="156" 
                        fontSize="9" 
                        textAnchor="middle" 
                        fontWeight="semibold" 
                        fill="#475569"
                        className="font-sans"
                      >
                        {item.monthName.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Chart Legend */}
            <div className="flex justify-center gap-5 text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-mono" id="chart-legend">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 block"></span>
                Pendapatan Kas (Layanan NOC)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-500 block"></span>
                Biaya Operasi (Server, Lisensi & Gaji)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white block"></span>
                Ujung Laba Bersih Positif
              </span>
            </div>
          </div>
        </div>

        {/* Live SLA & NOC Event Stream */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between" id="right-monitoring-panel">
          <div>
            <div className="flex items-center justify-between mb-3" id="sla-hdr">
              <div className="flex items-center gap-1.5" id="sla-title">
                <Activity className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Status Sistem Monitoring NOC</h2>
              </div>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 font-mono">
                OK: 99.98% SLA
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mb-4" id="sla-summary">Ping proaktif terintegrasi pada target host Zabbix & Prometheus pelanggan.</p>
            
            <div className="space-y-3" id="sla-logs-list">
              <div className="flex gap-2.5 text-xs text-slate-600 p-2 border border-slate-100 bg-slate-50/50 rounded-lg" id="log-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold" id="log-1-t">PT Citra Global ISP</p>
                  <p className="text-[10px] text-slate-400" id="log-1-sub">12 target ping nodes proaktif terpantau online & stabil.</p>
                </div>
              </div>

              <div className="flex gap-2.5 text-xs text-slate-600 p-2 border border-slate-100 bg-slate-50/50 rounded-lg" id="log-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold" id="log-2-t">IndoNet Solusindo</p>
                  <p className="text-[10px] text-slate-400" id="log-2-sub">Core Router BGP alert: Normal. Latency Jakarta-SGP 12ms.</p>
                </div>
              </div>

              <div className="flex gap-2.5 text-xs text-slate-600 p-2 border border-red-100 bg-red-50/30 rounded-lg animate-pulse" id="log-3">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-950" id="log-3-t">Aero Global Hosting</p>
                  <p className="text-[10px] text-red-600" id="log-3-sub">Tagihan nomor INV-2026-008 menunggak. Notifikasi WA dikirim.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100" id="sla-footer">
            <button 
              onClick={() => onNavigate("billing")}
              className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex justify-center items-center gap-1 cursor-pointer"
              id="lnk-reconcile"
            >
              Lihat Tagihan Tertunda <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Bandwidth monitoring section with variable port interface selection */}
      <TrafficMonitor title="NOC Enterprise Bandwidth Core Stream (NOC Admin)" isAdmin={true} clients={clients} />

      {/* Payment Transactions Section */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in duration-300" id="recent-payments-table-card">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="recent-pay-hdr">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2" id="recent-pay-title">
              <History className="w-4 h-4 text-blue-600 shrink-0" /> Transaksi Masuk (Gerbang Pembayaran)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5" id="recent-pay-subtitle">
              Histori 10 transaksi pembayaran sukses terakhir yang diselesaikan otomatis via QRIS Dinamis atau Bank Transfer Virtual Account.
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-100/50">
            Audit Log Gateway
          </span>
        </div>

        <div className="overflow-x-auto" id="recent-pay-scroll-wrap">
          {recentPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic text-xs" id="recent-pay-empty">
              Belum ada riwayat transaksi QRIS atau Bank Transfer yang berhasil diselesaikan.
            </div>
          ) : (
            <table className="w-full text-left border-collapse" id="recent-payments-table">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest" id="recent-pay-th-row">
                  <th className="py-3 px-6" id="th-tx-id">ID Transaksi</th>
                  <th className="py-3 px-5" id="th-tx-client">Pelanggan / Perusahaan</th>
                  <th className="py-3 px-5" id="th-tx-date">Tanggal Kejadian / Sukses</th>
                  <th className="py-3 px-5 text-right font-mono" id="th-tx-amount">Nilai Lunas</th>
                  <th className="py-3 px-6 text-center" id="th-tx-method">Metode Gateway</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600" id="recent-pay-tbody">
                {recentPayments.map((inv) => (
                  <tr className="hover:bg-slate-50/30 transition-colors" key={inv.id} id={`recent-pay-row-${inv.id}`}>
                    <td className="py-3.5 px-6 font-mono font-bold text-blue-600 text-[11px]" id={`recent-pay-id-${inv.id}`}>
                      TXN-{inv.id.replace("INV-", "")}
                    </td>
                    <td className="py-3.5 px-5" id={`recent-pay-client-${inv.id}`}>
                      <div className="font-semibold text-slate-800">{inv.clientCompany}</div>
                      <div className="text-[10px] text-slate-400">PIC: {inv.clientName}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono" id={`recent-pay-date-${inv.id}`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.paymentDate || inv.issuedDate}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-extrabold text-emerald-600" id={`recent-pay-amt-${inv.id}`}>
                      {formatIDR(inv.amount)}
                    </td>
                    <td className="py-3.5 px-6 text-center" id={`recent-pay-meth-${inv.id}`}>
                      {inv.paymentMethod === "QRIS" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <QrCode className="w-3 h-3 text-emerald-600" /> QRIS Dinamis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <CreditCard className="w-3 h-3 text-blue-600" /> Bank Transfer VA
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Monthly Profit & Loss (Laba Rugi) Ledger Dashboard Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden" id="pl-table-card">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="pl-table-hdr">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight" id="pl-title">Laporan Laba Rugi Otomatis (Tabular Bulanan)</h2>
            <p className="text-xs text-slate-500" id="pl-subtitle">Dihitung otomatis berdasarkan akumulasi kas dari tagihan lunas dan pos pengeluaran operasional.</p>
          </div>
          <div className="flex items-center gap-2" id="pl-table-opts">
            <label className="text-xs font-semibold text-slate-400" id="lbl-y-filter">Tahun Buku:</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-700 font-semibold focus:outline-blue-500"
              id="select-y-filter"
            >
              <option value="2026">2026</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto" id="pl-table-scroll font-sans">
          <table className="w-full text-left border-collapse" id="pl-balance-table">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest" id="pl-tbl-th-row">
                <th className="py-3.5 px-6" id="th-buku">Bulan Buku</th>
                <th className="py-3.5 px-5 text-right font-mono" id="th-rv">Pendapatan Jasa SLA (Kas)</th>
                <th className="py-3.5 px-5 text-right font-mono" id="th-ex">Beban Operational</th>
                <th className="py-3.5 px-5 text-right font-mono" id="th-np">Laba Bersih Bersih</th>
                <th className="py-3.5 px-6 text-center" id="th-acts">Laporan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600" id="pl-tbl-body">
              {profitLossReports.map((report) => (
                <tr className="hover:bg-slate-50/50 transition-colors" key={report.month} id={`pl-row-${report.month}`}>
                  <td className="py-4 px-6 font-semibold text-slate-900" id={`td-month-${report.month}`}>
                    {report.monthName}
                  </td>
                  <td className="py-4 px-5 text-right text-blue-600 font-mono font-semibold" id={`td-rev-${report.month}`}>
                    {formatIDR(report.revenue)}
                  </td>
                  <td className="py-4 px-5 text-right text-slate-500 font-mono" id={`td-exp-${report.month}`}>
                    {formatIDR(report.expenses)}
                  </td>
                  <td className={`py-4 px-5 text-right font-mono font-bold ${report.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`} id={`td-profit-${report.month}`}>
                    <span className="flex items-center justify-end gap-1">
                      {report.netProfit >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      {formatIDR(report.netProfit)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center" id={`td-act-${report.month}`}>
                    <button 
                      onClick={() => {
                        // Download single month report with details
                        exportProfitLossPDF([report], selectedYear, bookkeeping.filter(b => b.date.startsWith(report.month)));
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      id={`btn-monthly-pdf-${report.month}`}
                    >
                      <Download className="w-3 h-3" /> PDF Bulan ini
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Micro-helper icon
function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className={props.className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}
