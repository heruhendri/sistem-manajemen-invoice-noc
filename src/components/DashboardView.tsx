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
  History,
  Award
} from "lucide-react";
import { motion } from "motion/react";
import TrafficMonitor from "./TrafficMonitor";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from "recharts";

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const rev = payload[0]?.value || 0;
    const exp = payload[1]?.value || 0;
    const net = rev - exp;
    return (
      <div className="bg-slate-900 border border-slate-805 p-3 rounded-xl shadow-lg font-mono text-[10.5px] text-white">
        <p className="font-bold text-sky-400 mb-1.5">{label}</p>
        <div className="space-y-1">
          <p className="flex justify-between gap-4">
            <span className="text-slate-400 font-sans">Pendapatan:</span>
            <span className="font-bold text-blue-400">
              {formatIDR(rev)}
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-400 font-sans">Pengeluaran:</span>
            <span className="font-bold text-slate-400">
              {formatIDR(exp)}
            </span>
          </p>
          <div className="border-t border-slate-800 mt-1.5 pt-1.5 flex justify-between gap-4 font-bold">
            <span className="font-sans text-slate-350">Laba Bersih:</span>
            <span className={net >= 0 ? "text-emerald-400" : "text-rose-450"}>
              {formatIDR(net)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardViewProps {
  clients: Client[];
  invoices: Invoice[];
  bookkeeping: BookkeepingRecord[];
  onNavigate: (view: string) => void;
  onResetData?: () => void;
  onUpdateClient?: (client: Client) => void;
}

export default function DashboardView({ clients, invoices, bookkeeping, onNavigate, onResetData, onUpdateClient }: DashboardViewProps) {
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [hoveredReportMonth, setHoveredReportMonth] = useState<string | null>(null);

  // Detect whether database contains mock dummy records
  const hasDummyData = useMemo(() => {
    return invoices.some(inv => inv.id === "INV-2026-001" || inv.clientCompany === "PT Citra Global ISP");
  }, [invoices]);

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

  // Calculate Top 5 Highest Billing Clients from Invoice Data
  const topClientsData = useMemo(() => {
    const clientBillingMap: Record<string, { id: string; name: string; total: number; count: number; paid: number }> = {};

    invoices.forEach(inv => {
      const clientId = inv.clientId;
      const amount = inv.amount || 0;
      const isPaid = inv.status === "Paid";
      
      let clientName = inv.clientCompany || inv.clientName || "Klien Tidak Dikenal";
      // Try to find the live client record for the absolute most accurate name
      const liveClient = clients.find(c => c.id === clientId);
      if (liveClient) {
        clientName = liveClient.company || liveClient.name;
      }

      if (!clientBillingMap[clientId]) {
        clientBillingMap[clientId] = {
          id: clientId,
          name: clientName,
          total: 0,
          count: 0,
          paid: 0
        };
      }
      
      clientBillingMap[clientId].total += amount;
      clientBillingMap[clientId].count += 1;
      if (isPaid) {
        clientBillingMap[clientId].paid += amount;
      }
    });

    return Object.values(clientBillingMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [invoices, clients]);

  // Generate the last 6 months dynamically based on latest date in bookkeeping or today's month
  const last6MonthsList = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    let baseYear = 2026;
    let baseMonth = 5; // June is 5 (0-indexed)
    
    if (bookkeeping.length > 0) {
      const sortedRecords = [...bookkeeping].sort((a, b) => b.date.localeCompare(a.date));
      const latestDateStr = sortedRecords[0].date;
      const parts = latestDateStr.split("-");
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          baseYear = y;
          baseMonth = m;
        }
      }
    } else {
      baseYear = now.getFullYear();
      baseMonth = now.getMonth();
    }
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(baseYear, baseMonth - i, 1);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
      list.push(`${yyyy}-${mm}`);
    }
    return list;
  }, [bookkeeping]);

  // Compute last 6 months of profit loss for the Recharts Bar Chart
  const profitLossLast6Months = useMemo((): ProfitLossReport[] => {
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
    
    last6MonthsList.forEach(m => {
      monthlyData[m] = { revenue: 0, expenses: 0 };
    });

    bookkeeping.forEach(rec => {
      const month = rec.date.substring(0, 7);
      if (monthlyData[month] !== undefined) {
        if (rec.type === "Expense") {
          monthlyData[month].expenses += rec.amount;
        } else {
          monthlyData[month].revenue += rec.amount;
        }
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        monthName: getIndonesianMonthName(month),
        revenue: data.revenue,
        expenses: data.expenses,
        netProfit: data.revenue - data.expenses
      }));
  }, [bookkeeping, last6MonthsList]);

  // Group by months for Laba Rugi Report of the selected year
  const profitLossReports = useMemo((): ProfitLossReport[] => {
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
    
    const yearPrefix = `${selectedYear}-`;
    
    // Default priming for 2026
    if (selectedYear === "2026") {
      monthlyData["2026-03"] = { revenue: 0, expenses: 0 };
      monthlyData["2026-04"] = { revenue: 0, expenses: 0 };
      monthlyData["2026-05"] = { revenue: 0, expenses: 0 };
      monthlyData["2026-06"] = { revenue: 0, expenses: 0 };
    }
    
    bookkeeping.forEach(rec => {
      if (rec.date.startsWith(yearPrefix)) {
        const month = rec.date.substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0 };
        }
        if (rec.type === "Expense") {
          monthlyData[month].expenses += rec.amount;
        } else {
          monthlyData[month].revenue += rec.amount;
        }
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        monthName: getIndonesianMonthName(month),
        revenue: data.revenue,
        expenses: data.expenses,
        netProfit: data.revenue - data.expenses
      }));
  }, [bookkeeping, selectedYear]);

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

      {/* Demo Mode Alert Banner for Client Transition to Real Production */}
      {hasDummyData && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 shadow-xs" id="demo-mode-alert">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-250">Database Masih Berisi Data Demonstrasi / Simulasi</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Saat ini sistem memuat data bawaan demo (IndoNet, PT Citra Global ISP, dll). Klik tombol bersihkan di kanan untuk mengosongkan seluruh log tagihan & klien agar Anda bisa langsung menginput data pelayanan riil milik instansi Anda secara siap pakai.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("🚨 PERINGATAN: Tindakan ini akan menghapus seluruh data Klien, Invoice tagihan, dan Buku Kas simulasi dari memori browser Anda secara permanen. Apakah Anda yakin ingin memulai database kosong untuk operasional produksi rill?")) {
                if (onResetData) onResetData();
              }
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1 hover:shadow-xs self-end md:self-auto"
            id="btn-purge-demo-dash"
          >
            🧹 Kosongkan & Mulai Riil
          </button>
        </div>
      )}

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

          {/* Recharts Bar Chart Visualizer */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full h-80 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl p-4 flex flex-col justify-between border border-slate-100 dark:border-slate-800/30 shadow-xs" 
            id="chart-canvas-container"
          >
            <div className="flex-1 w-full min-h-0" id="chart-recharts-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={profitLossLast6Months}
                  margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
                  onMouseMove={(state: any) => {
                    const activePayload = state ? (state.activePayload || (state as any).activePayload) : undefined;
                    if (activePayload && activePayload.length > 0) {
                      const month = activePayload[0].payload.month;
                      if (hoveredReportMonth !== month) {
                        setHoveredReportMonth(month);
                      }
                    } else {
                      if (hoveredReportMonth !== null) {
                        setHoveredReportMonth(null);
                      }
                    }
                  }}
                  onMouseLeave={() => setHoveredReportMonth(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.4} />
                  <XAxis 
                    dataKey="monthName" 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                    tickFormatter={(value) => value.split(" ")[0]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(0)}M`;
                      if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}k`;
                      return `Rp ${value}`;
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.03)', radius: 4 }} />
                  <Bar 
                    name="Pendapatan Jasa NOC" 
                    dataKey="revenue" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    name="Beban Operational" 
                    dataKey="expenses" 
                    fill="#94a3b8" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="flex justify-center gap-5 text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800/50 pt-2.5 mt-2 font-mono" id="chart-legend">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#3b82f6] block"></span>
                Pendapatan Kas (Layanan NOC)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#94a3b8] block"></span>
                Biaya Operasi (Server, Lisensi & Gaji)
              </span>
            </div>
          </motion.div>
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
              {clients.filter(c => c.mikrotikIp).length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Activity className="w-8 h-8 mx-auto text-slate-300 mb-1.5 animate-pulse" />
                  <p>Tidak ada log aktif.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tambahkan Router MikroTik pada tab Klien untuk memantau status secara langsung.</p>
                </div>
              ) : (
                clients.filter(c => c.mikrotikIp || c.mikrotikInterface).map((client) => {
                  const hasUnpaid = invoices.some(i => i.clientId === client.id && i.status === "Unpaid");
                  return (
                    <div 
                      key={client.id}
                      className={`flex gap-2.5 text-xs p-2 border rounded-lg ${
                        hasUnpaid 
                          ? "border-amber-100 bg-amber-50/30" 
                          : "border-slate-100 bg-slate-50/50"
                      }`}
                      id={`log-${client.id}`}
                    >
                      {hasUnpaid ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-805" id={`log-${client.id}-t`}>
                          {client.company || client.name}
                        </p>
                        <p className="text-[10px] text-slate-500" id={`log-${client.id}-sub`}>
                          {hasUnpaid 
                            ? `Status: Aktif. Terdapat tagihan outstanding belum lunas.`
                            : `Terhubung via ${client.mikrotikIp || "IP DHCP"}:${client.mikrotikPort || 8728}. Monitoring aktif.`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
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

      {/* Top 5 Highest Billing Clients Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4" id="top-billing-clients-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" id="top-clients-hdr">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2" id="top-clients-title">
              <Award className="w-4 h-4 text-amber-500 shrink-0" /> Analisis Klien Premium (Top 5 Nilai Penagihan)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5" id="top-clients-subtitle">
              Peringkat 5 pelanggan dengan total akumulasi tagihan (billing volume) tertinggi berdasarkan seluruh invoice terbit.
            </p>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded border border-amber-100/50">
            Premium Client Leaderboard
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center" id="top-clients-stats-grid">
          {/* Bar Chart Column */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="lg:col-span-2 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl p-4 border border-slate-100 dark:border-slate-800/30" 
            id="top-clients-chart-wrap"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={topClientsData}
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" strokeOpacity={0.4} />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}Jt`;
                    if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}Rb`;
                    return `Rp ${value}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                  width={140}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip 
                  formatter={(value: any) => [formatIDR(value), "Akumulasi Tagihan"]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6" 
                  radius={[0, 4, 4, 0]} 
                  barSize={16}
                >
                  {topClientsData.map((entry, index) => {
                    const colors = ["#2563eb", "#3b82f6", "#60a5fa", "#818cf8", "#a78bfa"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* List and insights Column */}
          <div className="space-y-4" id="top-clients-insights">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Daftar Kontribusi Pelanggan</h3>
            <div className="space-y-2.5" id="top-clients-list">
              {topClientsData.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center">Belum ada data tagihan tertunda atau lunas.</p>
              ) : (
                topClientsData.map((entry, idx) => {
                  const rankColors = [
                    "bg-amber-100 text-amber-700 border-amber-200",
                    "bg-slate-100 text-slate-700 border-slate-200",
                    "bg-amber-50 text-amber-655 border-amber-100",
                    "bg-slate-50 text-slate-500 border-slate-100",
                    "bg-slate-50 text-slate-500 border-slate-100"
                  ];
                  const percentagePaid = entry.total > 0 ? (entry.paid / entry.total) * 100 : 0;

                  return (
                    <div 
                      key={entry.id} 
                      className="p-3 bg-slate-50/60 hover:bg-slate-50 border border-slate-150/70 rounded-xl flex items-center justify-between gap-3 transition-colors"
                      id={`top-client-item-${entry.id}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${rankColors[idx] || "bg-slate-50 text-slate-500"}`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={entry.name}>
                            {entry.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {entry.count} Tagihan • Lunas {percentagePaid.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-slate-800 font-mono">
                          {formatIDR(entry.total)}
                        </p>
                        <p className="text-[9px] text-emerald-600 font-bold font-mono">
                          Lunas: {formatIDR(entry.paid)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Micro-insights advice */}
            {topClientsData.length > 0 && (
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-2" id="client-retention-tip">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 leading-normal font-sans">
                  <strong>Retensi SLA:</strong> 5 mitra besar di atas menyumbang nilai penagihan utama. Prioritaskan kestabilan interkoneksi backbone sfp atau pppoe tunnel mereka untuk mencegah komplain SLA.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Bandwidth monitoring section with variable port interface selection */}
      <TrafficMonitor 
        title="NOC Enterprise Bandwidth Core Stream (NOC Admin)" 
        isAdmin={true} 
        clients={clients} 
        onUpdateClient={onUpdateClient}
      />

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
