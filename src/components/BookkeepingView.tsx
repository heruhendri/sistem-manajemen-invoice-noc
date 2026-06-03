import React, { useState, useMemo } from "react";
import { BookkeepingRecord, Invoice, Client } from "../types";
import { formatIDR, getIndonesianMonthName, exportBookkeepingExcel } from "../utils/exportFiles";
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Activity, 
  Check, 
  UploadCloud, 
  Cpu, 
  RefreshCw, 
  DollarSign,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";

interface BookkeepingViewProps {
  bookkeeping: BookkeepingRecord[];
  invoices: Invoice[];
  clients: Client[];
  onAddBookkeeping: (record: BookkeepingRecord) => void;
  onDeleteBookkeeping: (idOrIds: string | string[]) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: "Paid", method: "QRIS" | "Bank Transfer") => void;
  triggerToast?: (message: string, type?: "success" | "warning" | "error" | "info") => void;
}

// Sample raw bank transfer mutations waiting to be reconciled
interface RawBankMutation {
  id: string;
  bank: "Mandiri" | "BCA";
  mutDate: string; // YYYY-MM-DD
  rawText: string;
  amount: number;
  proposedInvoiceId: string | null;
  proposedClientCompany: string;
  isReconciled: boolean;
}

export default function BookkeepingView({
  bookkeeping,
  invoices,
  clients,
  onAddBookkeeping,
  onDeleteBookkeeping,
  onUpdateInvoiceStatus,
  triggerToast
}: BookkeepingViewProps) {
  const notify = (msg: string, type: "success" | "warning" | "error" | "info" = "info") => {
    if (triggerToast) {
      triggerToast(msg, type);
    } else {
      alert(msg);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedBookkeepingIds, setSelectedBookkeepingIds] = useState<string[]>([]);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);

  // New Expense form states
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<any>("Lisensi Software Monitoring");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);

  // Reconciliation Simulator states
  const [isReconScanOpen, setIsReconScanOpen] = useState(false);
  const [isReconScanning, setIsReconScanning] = useState(false);
  const [reconDoneCount, setReconDoneCount] = useState(0);

  // Compile active unpaid invoices
  const unpaidInvoices = useMemo(() => {
    return invoices.filter(i => i.status === "Unpaid" || i.status === "Overdue");
  }, [invoices]);

  // Construct simulated raw bank statement feed dynamically based on unpaid client amounts + tax!
  // E.g. Unpaid Invoice with Rp 12,000,000 -> amount with PPN 11% is Rp 13,320,000
  // PT Citra Global ISP VA transfer matches Rp 13,320,000
  const simulatedBankMutations = useMemo((): RawBankMutation[] => {
    return unpaidInvoices.map((inv, idx) => {
      const amountWithTax = inv.amount * 1.11;
      const bank = idx % 2 === 0 ? "Mandiri" as const : "BCA" as const;
      const vaCode = bank === "Mandiri" ? "8899120000002" : "7711230000003";

      return {
        id: `MUT-${1000 + idx}`,
        bank,
        mutDate: inv.dueDate, // assumes they transfer near due date
        rawText: `CR CR-IN ${inv.id} VA-${vaCode} DEP/${inv.clientCompany.substring(0, 10).toUpperCase()}/SLA-NOC-SUITE`,
        amount: amountWithTax,
        proposedInvoiceId: inv.id,
        proposedClientCompany: inv.clientCompany,
        isReconciled: false
      };
    });
  }, [unpaidInvoices]);

  // Active mutation states holding simulation updates
  const [mutationsFeed, setMutationsFeed] = useState<RawBankMutation[]>([]);

  // Open reconciliation popup and initialize transactions feed
  const handleOpenReconEngine = () => {
    if (unpaidInvoices.length === 0) {
      notify("Hebat! Seluruh invoice pelanggan telah Lunas terbayar. Tidak ada antrean VA bank yang perlu direkonsiliasi saat ini.", "success");
      return;
    }
    setMutationsFeed(simulatedBankMutations);
    setReconDoneCount(0);
    setIsReconScanOpen(true);
    setIsReconScanning(false);
  };

  // Perform AI/Regex matching scan simulation
  const handleTriggerReconScan = () => {
    setIsReconScanning(true);
    
    // Simulate smart matching delay
    setTimeout(() => {
      let reconciledCount = 0;
      
      mutationsFeed.forEach(mut => {
        if (mut.proposedInvoiceId && !mut.isReconciled) {
          // 1. Mark Invoice as paid
          onUpdateInvoiceStatus(mut.proposedInvoiceId, "Paid", "Bank Transfer");

          // 2. Add as Bookkeeping positive revenue
          const linkedInvoiceDetails = invoices.find(i => i.id === mut.proposedInvoiceId);
          if (linkedInvoiceDetails) {
            const newIncomeRecord: BookkeepingRecord = {
              id: `INC-R${Math.floor(100 + Math.random()*900)}`,
              date: new Date().toISOString().split("T")[0],
              type: "Income",
              category: "Pendapatan Jasa NOC",
              invoiceId: mut.proposedInvoiceId,
              description: `Penerimaan Rekonsiliasi Otomatis VA Bank - ${mut.proposedClientCompany} (Invoice #${mut.proposedInvoiceId})`,
              amount: linkedInvoiceDetails.amount
            };
            onAddBookkeeping(newIncomeRecord);
            reconciledCount++;
          }
        }
      });

      // Update local feed
      setMutationsFeed(prev => prev.map(m => ({ ...m, isReconciled: true })));
      setReconDoneCount(reconciledCount);
      setIsReconScanning(false);
    }, 2200);
  };

  // Handle manual operational cost dispatch
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      notify("Harap isi deskripsi pengeluaran dan jumlah nominal terlebih dahulu.", "warning");
      return;
    }

    const expenseRecord: BookkeepingRecord = {
      id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      date,
      type: "Expense",
      category,
      description,
      amount: Number(amount)
    };

    onAddBookkeeping(expenseRecord);
    setIsExpenseFormOpen(false);
    
    // Reset Form
    setDescription("");
    setAmount(0);
    setDate(new Date().toISOString().split("T")[0]);
  };

  // Cash Ledger searching filter
  const filteredBukuKas = useMemo(() => {
    return bookkeeping.filter(b => 
      b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.invoiceId && b.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a,b) => b.date.localeCompare(a.date));
  }, [bookkeeping, searchQuery]);

  // Aggregate balance totals
  const balanceAggregates = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    bookkeeping.forEach(b => {
      if (b.type === "Income") totalIn += b.amount;
      else totalOut += b.amount;
    });
    return {
      totalIn,
      totalOut,
      netBalance: totalIn - totalOut
    };
  }, [bookkeeping]);

  return (
    <div className="space-y-6" id="bookkeeping-main-wrapper">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs" id="bk-hdr">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" id="bk-title">Buku Kas & Rekonsiliasi Rekening Bank</h1>
          <p className="text-sm text-slate-500" id="bk-subtitle">Lacak rincian beban operasional, catat pengeluaran, serta simulasikan pencocokan mutasi bank otomatis.</p>
        </div>
        <div className="flex flex-wrap gap-2" id="bk-hdr-actions">
          <button 
            onClick={handleOpenReconEngine}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-950 text-white rounded-lg transition-colors cursor-pointer"
            id="btn-reconcile-bank"
          >
            <Cpu className="w-4 h-4 text-blue-400" /> Rekonsiliasi Bank VA ({unpaidInvoices.length})
          </button>
          
          <button 
            onClick={() => setIsExpenseFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
            id="btn-add-expense"
          >
            <Plus className="w-4 h-4" /> Catat Beban Pengeluaran
          </button>
        </div>
      </div>

      {/* Expense form panel if Open */}
      {isExpenseFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md animate-in fade-in zoom-in duration-150" id="expense-form-panel">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-5">
            <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Catat Biaya Operasional / Tagihan Keluar</h2>
            <button 
              onClick={() => setIsExpenseFormOpen(false)}
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4" id="form-expense">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tanggal Transaksi:</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-blue-500"
                required
                id="inp-exp-date"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori Pengeluaran Kantor:</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-blue-500 font-semibold text-slate-700"
                id="inp-exp-category"
              >
                <option value="Lisensi Software Monitoring">Lisensi Software Monitoring (PRTG/Zabbix)</option>
                <option value="Sewa Server & Cloud">Sewa Server & Cloud VPS</option>
                <option value="Gaji Karyawan">Gaji Karyawan / Engineers Shift</option>
                <option value="Operasional Kantor">Operasional Kantor (ATK/Akomodasi)</option>
                <option value="Internet & Listrik">Internet & Listrik Backhaul NOC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Deskripsi Detail Pengeluaran:</label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="misal: Pembelian lisensi addon monitor 200 network endpoints"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-blue-500"
                required
                id="inp-exp-desc"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nilai Pengeluaran (Rupiah):</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Jumlah nominal"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-blue-500 font-mono font-bold text-rose-600"
                required
                id="inp-exp-amount"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-2" id="form-exp-btns">
              <button 
                type="button" 
                onClick={() => setIsExpenseFormOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Batalkan
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Simpan Pengeluaran Baru
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cash balance widget blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="cash-summary-widgets">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Akumulasi Pendapatan Bersih</span>
            <h4 className="text-lg font-extrabold text-blue-600 font-mono mt-0.5">{formatIDR(balanceAggregates.totalIn)}</h4>
          </div>
          <span className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="w-5 h-5" /></span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Pengeluaran Operasi</span>
            <h4 className="text-lg font-extrabold text-slate-500 font-mono mt-0.5">{formatIDR(balanceAggregates.totalOut)}</h4>
          </div>
          <span className="p-2 bg-rose-50 rounded-lg text-rose-600"><TrendingDown className="w-5 h-5" /></span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Sisa Kas murni (Cash-in-hand)</span>
            <h4 className={`text-lg font-extrabold font-mono mt-0.5 ${balanceAggregates.netBalance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
              {formatIDR(balanceAggregates.netBalance)}
            </h4>
          </div>
          <span className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"><BookOpen className="w-5 h-5" /></span>
        </div>
      </div>

      {/* Bookkeeping Searching filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between" id="ledger-search-container">
        <div className="flex items-center gap-2 flex-1 w-full" id="ledger-search-box">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari log buku kas berdasarkan keterangan rincian, kategori transaksi, invoice id..."
            className="w-full text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800"
            id="inp-search-ledger"
          />
        </div>

        {selectedBookkeepingIds.length > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 px-3 py-1.5 rounded-xl animate-in fade-in duration-205">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-450">
              Terpilih: <strong>{selectedBookkeepingIds.length}</strong> kas
            </span>
            <button
              type="button"
              onClick={() => setIsBulkDeleteConfirm(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-sm"
              id="bulk-delete-kas-btn"
            >
              Hapus Massal
            </button>
            <button
              type="button"
              onClick={() => setSelectedBookkeepingIds([])}
              className="text-slate-400 hover:text-slate-650 text-[10.5px] font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Core Cashbook Register List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden" id="ledger-card-table">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center" id="ledger-card-hdr">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Buku Kas Besar Pemantauan NOC</span>
          <button
            onClick={() => exportBookkeepingExcel(bookkeeping, invoices)}
            className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 px-3 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
            id="btn-dl-ledger-excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" /> Ekspor Buku Kas (Excel)
          </button>
        </div>

        <div className="overflow-x-auto" id="ledger-tbl-scroll">
          <table className="w-full text-left border-collapse" id="ledger-main-table">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-3 px-4 text-center w-12" id="th-ledger-checkbox">
                  <input
                    type="checkbox"
                    checked={filteredBukuKas.length > 0 && selectedBookkeepingIds.length === filteredBukuKas.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBookkeepingIds(filteredBukuKas.map(b => b.id));
                      } else {
                        setSelectedBookkeepingIds([]);
                      }
                    }}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="py-3 px-6">ID Transaksi</th>
                <th className="py-3 px-6">Tanggal Buku</th>
                <th className="py-3 px-5">Kategori Bidang</th>
                <th className="py-3 px-6">Penjelasan Transaksi</th>
                <th className="py-3 px-5 text-center">Jenis Kas</th>
                <th className="py-3 px-6 text-right font-mono">Nominal</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {filteredBukuKas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold animate-pulse">
                    Tidak ditemukan log kasir yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredBukuKas.map((item) => (
                  <tr className="hover:bg-slate-50/50 transition-colors" key={item.id} id={`kas-row-${item.id}`}>
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedBookkeepingIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookkeepingIds(prev => [...prev, item.id]);
                          } else {
                            setSelectedBookkeepingIds(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                        className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                      />
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-700 text-[10.5px]">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-6 font-mono">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="p-1 px-1.5 bg-slate-100 text-slate-700 rounded text-[10.5px] font-semibold border border-slate-200">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 max-w-sm shrink-0">
                      <div>
                        {item.description}
                      </div>
                      {item.invoiceId && (
                        <span className="text-[10px] bg-blue-50 border border-blue-100 font-bold px-1 py-0.5 rounded text-blue-800 font-mono inline-block mt-0.5" title="Link dengan invoice pelanggan">
                          #{item.invoiceId}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center" id={`kas-type-${item.id}`}>
                      {item.type === "Income" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono">
                          ▲ MASUK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                          ▼ KELUAR
                        </span>
                      )}
                    </td>
                    <td className={`py-3.5 px-6 text-right font-mono font-bold ${item.type === "Income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {item.type === "Income" ? "+" : "-"}{formatIDR(item.amount)}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteBookkeeping(item.id);
                              setConfirmDeleteId(null);
                              notify(`Log kas #${item.id} berhasil terhapus secara permanen.`, "success");
                            }}
                            className="p-1 px-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[9px] cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-bold text-[9px] cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded transition-colors cursor-pointer"
                          title="Hapus Catatan Buku Kas"
                        >
                          Hapus
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECONCILIATION RADAR LOADER AND POPUP DIALOG */}
      {isReconScanOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="recon-overlay">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col" id="recon-dialog-core">
            
            {/* Header Dialog */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center" id="recon-hdr">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Rekonsiliasi Bank Otomatis (VA & QRIS Scanner)</h3>
              </div>
              <button 
                onClick={() => setIsReconScanOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
              >
                Tutup x
              </button>
            </div>

            {/* Reconciliation Process body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto" id="recon-body">
              <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 p-4 border border-slate-100 rounded-xl" id="recon-expl">
                <AlertCircle className="w-10 h-10 text-amber-500 shrink-0 mt-1" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">Bagaimana Mesin Rekonsiliasi Mencocokkan Transaksi Bank?</p>
                  <p className="text-slate-500 leading-normal">
                    Sistem mendeteksi mutasi kredit masuk pada Bank Mandiri dan BCA yang memiliki nominal pas sama dengan nilai tagihan unpaid murni dari client + 11% PPN. Mesin mendeteksi ID Invoice di keterangan mutasi digital dan mencatat pelunasan langsung murni pembukuan real-time.
                  </p>
                </div>
              </div>

              {/* Loader action element */}
              <div className="flex justify-between items-center border-t border-b border-slate-100 py-3" id="recon-scan-row">
                <div className="text-xs">
                  <span className="font-bold block text-slate-900">Antrean Bank Transaksi Ditemukan: {mutationsFeed.length} baris</span>
                  <p className="text-slate-400 mt-0.5">Semuanya memiliki status target tagihan Unpaid.</p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerReconScan}
                  disabled={isReconScanning || mutationsFeed.every(m => m.isReconciled)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl cursor-pointer transition-all inline-flex items-center gap-1.5"
                  id="btn-execute-reconciliation"
                >
                  {isReconScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      Mencari Kecocokan...
                    </>
                  ) : mutationsFeed.every(m => m.isReconciled) ? (
                    "Selesai Direkonsiliasi ✓"
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" /> Tarik & Rekonsilasi Instan
                    </>
                  )}
                </button>
              </div>

              {/* Transactions Bank Mutation layout stream */}
              <div className="space-y-2.5" id="mutations-list-scroller">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sandi Mutasi Bank Masuk REK Mandiri & BCA</span>
                
                {mutationsFeed.map((mut) => (
                  <div 
                    key={mut.id} 
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border text-xs gap-3 font-mono transition-all duration-300 ${
                      mut.isReconciled 
                        ? "bg-blue-50/75 border-blue-200" 
                        : "bg-white border-slate-200"
                    }`}
                    id={`recon-card-${mut.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1 rounded text-[9px] font-bold font-sans ${mut.bank === "Mandiri" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                          {mut.bank} VA
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{mut.mutDate}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 max-w-md break-all leading-relaxed font-mono">
                        {mut.rawText}
                      </div>
                      {mut.proposedInvoiceId && (
                        <div className="text-[10px] text-slate-400 font-sans font-semibold">
                          Proposed: <b className="text-blue-700 font-mono">#{mut.proposedInvoiceId}</b> ({mut.proposedClientCompany})
                        </div>
                      )}
                    </div>

                    <div className="text-right flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end w-full sm:w-auto shrink-0 gap-2 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 font-sans">
                      <div className="font-mono font-bold text-slate-900 text-xs">{formatIDR(mut.amount)}</div>
                      {mut.isReconciled ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" /> SINKRON
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-100 rounded-full animate-pulse">
                          Pending Scan
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Scan completed results overlay feedback */}
              {reconDoneCount > 0 && !isReconScanning && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center text-xs animate-bounce" id="recon-success-meta">
                  <p className="font-bold text-emerald-800">✓ PENYELARASAN MUTASI SELESAI SUKSES!</p>
                  <p className="text-emerald-700 mt-1">
                    Berhasil melunasi {reconDoneCount} invoice pelanggan. Arus kas masuk murni telah diintegrasikan di buku kas umum secara proaktif.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Bookkeeping Confirmation Modal */}
      {isBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150" id="bulk-kas-delete-modal-overlay">
          <div className="bg-white dark:bg-[#151e2e] w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertCircle className="w-6 h-6 shrink-0 animate-bounce" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-sans">
                Hapus Massal Catatan Buku Kas
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mb-6">
              Apakah Anda benar-benar yakin ingin menghapus secara permanen sebanyak <strong className="text-rose-650 font-bold">{selectedBookkeepingIds.length}</strong> catatan buku kas terpilih?
              <br /><br />
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Angka saldo kas masuk dan kas keluar Anda akan disesuaikan kembali secara otomatis.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBookkeeping(selectedBookkeepingIds);
                  setSelectedBookkeepingIds([]);
                  setIsBulkDeleteConfirm(false);
                  notify("Seluruh catatan buku kas terpilih berhasil dihapus massal.", "success");
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                id="bulk-delete-kas-confirm-btn"
              >
                Ya, Hapus Massal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
