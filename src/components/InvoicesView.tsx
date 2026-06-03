import React, { useState, useMemo } from "react";
import { Client, Invoice, NotificationTemplate, BookkeepingRecord, BizProfile } from "../types";
import { formatIDR, getIndonesianMonthName, exportInvoicePDF } from "../utils/exportFiles";
import { 
  FilePlus, 
  Send, 
  Download, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Eye, 
  Copy, 
  Check, 
  Filter,
  MessageSquare,
  Mail,
  Smartphone,
  ExternalLink,
  X,
  FileText,
  Trash2
} from "lucide-react";

interface InvoicesViewProps {
  clients: Client[];
  invoices: Invoice[];
  templates: NotificationTemplate[];
  onChangeInvoices: (invoices: Invoice[]) => void;
  onAddBookkeeping: (record: BookkeepingRecord) => void;
  whatsappConnected: boolean;
  onUpdateClient: (client: Client) => void;
  triggerToast?: (message: string, type?: "success" | "warning" | "error" | "info") => void;
  bizProfile?: BizProfile;
}

export default function InvoicesView({
  clients,
  invoices,
  templates,
  onChangeInvoices,
  onAddBookkeeping,
  whatsappConnected,
  onUpdateClient,
  triggerToast,
  bizProfile
}: InvoicesViewProps) {
  const notify = (msg: string, type: "success" | "warning" | "error" | "info" = "info") => {
    if (triggerToast) {
      triggerToast(msg, type);
    } else {
      alert(msg);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  // Modals status
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [activeSendWizard, setActiveSendWizard] = useState<{ invoice: Invoice; client: Client } | null>(null);
  const [activePaymentPortal, setActivePaymentPortal] = useState<{ invoice: Invoice; client: Client } | null>(null);
  const [mobilePhoneMockupMessage, setMobilePhoneMockupMessage] = useState<string | null>(null);

  // New Invoice form states
  const [selectedClientId, setSelectedClientId] = useState("");
  const [billingMonth, setBillingMonth] = useState("2026-06");
  const [dueDateOffset, setDueDateOffset] = useState("10"); // days after issue
  const [invoiceStatus, setInvoiceStatus] = useState<"Draft" | "Unpaid">("Unpaid");

  // Send communication states
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isSendingComm, setIsSendingComm] = useState(false);
  const [sendLogs, setSendLogs] = useState<string[]>([]);

  // Clipboard Copied states
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);

  // Bulk Invoice Generation and Admin Advisory States
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<"warn" | "generate">("warn");
  const [bulkBillingMonth, setBulkBillingMonth] = useState("2026-06");
  const [bulkDueDateOffset, setBulkDueDateOffset] = useState("10");
  const [bulkStatus, setBulkStatus] = useState<"Draft" | "Unpaid">("Unpaid");

  // Handles inline service/fee edits directly inside the bulk preview notification checklist
  const [inlineEditingClientId, setInlineEditingClientId] = useState<string | null>(null);
  const [inlineTempService, setInlineTempService] = useState<string>("");
  const [inlineTempFee, setInlineTempFee] = useState<number>(0);

  // Active clients list for drop downs
  const activeClients = useMemo(() => clients.filter(c => c.status === "Active"), [clients]);

  // Combined and filtered invoice collections
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = 
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "All" || inv.status === statusFilter;

      return matchSearch && matchStatus;
    }).sort((a,b) => b.id.localeCompare(a.id));
  }, [invoices, searchQuery, statusFilter]);

  // Handle invoice ID auto generation
  const handleOpenNewInvoice = () => {
    if (activeClients.length === 0) {
      notify("Harap daftarkan minimal 1 pelanggan berstatus Aktif terlebih dahulu di tab Pelanggan.", "warning");
      return;
    }
    setSelectedClientId(activeClients[0].id);
    setBillingMonth("2026-06");
    setDueDateOffset("10");
    setInvoiceStatus("Unpaid");
    setIsNewInvoiceOpen(true);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    // e.g. Year-Month combination
    const totalCurrentInvoices = invoices.filter(i => i.billingMonth === billingMonth).length;
    const invId = `INV-${billingMonth.replace("-", "")}-${String(totalCurrentInvoices + 1).padStart(3, "0")}`;

    const newInvoice: Invoice = {
      id: invId,
      clientId: client.id,
      clientName: client.name,
      clientCompany: client.company,
      amount: client.monthlyFee,
      billingMonth,
      issuedDate: new Date().toISOString().split("T")[0],
      dueDate: calculateDueDate(new Date().toISOString().split("T")[0], Number(dueDateOffset)),
      status: invoiceStatus,
      reminderSentCount: 0,
      paymentMethod: "",
      paymentDate: null
    };

    // Prepend new invoice
    onChangeInvoices([newInvoice, ...invoices]);
    setIsNewInvoiceOpen(false);
  };

  const handleExecuteBulkInvoice = () => {
    const newInvoicesList: Invoice[] = [];
    let processedCount = 0;
    let skipCount = 0;

    activeClients.forEach((client) => {
      // Check if invoice already exists for this client and selected billing month
      const exists = invoices.some(
        inv => inv.clientId === client.id && inv.billingMonth === bulkBillingMonth
      );

      if (exists) {
        skipCount++;
        return;
      }

      // Generate invoice ID sequentially with premium clean format
      const billingMonthClean = bulkBillingMonth.replace("-", "");
      const countIndex = invoices.length + newInvoicesList.length + 1;
      const invId = `INV-${billingMonthClean}-${String(countIndex).padStart(3, "0")}`;

      const newInvoice: Invoice = {
        id: invId,
        clientId: client.id,
        clientName: client.name,
        clientCompany: client.company,
        amount: client.monthlyFee,
        billingMonth: bulkBillingMonth,
        issuedDate: new Date().toISOString().split("T")[0],
        dueDate: calculateDueDate(new Date().toISOString().split("T")[0], Number(bulkDueDateOffset)),
        status: bulkStatus,
        reminderSentCount: 0,
        paymentMethod: "",
        paymentDate: null
      };

      newInvoicesList.push(newInvoice);
      processedCount++;
    });

    if (newInvoicesList.length > 0) {
      onChangeInvoices([...newInvoicesList, ...invoices]);
      notify(`Berhasil menerbitkan ${processedCount} invoice baru untuk periode (${bulkBillingMonth}). ${skipCount > 0 ? `${skipCount} Klien terlewati karena sudah memiliki invoice.` : ""}`, "success");
    } else {
      notify(`Pemberitahuan:\nSeluruh pelanggan aktif (${skipCount} klien) sudah memiliki invoice untuk periode layanan ${bulkBillingMonth}.`, "info");
    }

    setIsBulkOpen(false);
  };

  const startInlineEdit = (client: Client) => {
    setInlineEditingClientId(client.id);
    setInlineTempService(client.serviceType);
    setInlineTempFee(client.monthlyFee);
  };

  const cancelInlineEdit = () => {
    setInlineEditingClientId(null);
  };

  const saveInlineEdit = (client: Client) => {
    const updatedClient: Client = {
      ...client,
      serviceType: inlineTempService as any,
      monthlyFee: inlineTempFee
    };
    onUpdateClient(updatedClient);
    setInlineEditingClientId(null);
  };

  const calculateDueDate = (issuedDate: string, offsetDays: number): string => {
    const d = new Date(issuedDate);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  // Open notification dispatcher wizard
  const handleOpenSendWizard = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client) return;
    
    // Choose starting template matching current invoice status
    let presetTplId = "";
    if (invoice.status === "Overdue") {
      const match = templates.find(t => t.triggerType === "overdue" && t.channel === "whatsapp");
      if (match) presetTplId = match.id;
    } else {
      const match = templates.find(t => t.triggerType === "due_soon" && t.channel === "whatsapp");
      if (match) presetTplId = match.id;
    }

    if (!presetTplId && templates.length > 0) presetTplId = templates[0].id;

    setSelectedTemplateId(presetTplId);
    setSendLogs([]);
    setIsSendingComm(false);
    setActiveSendWizard({ invoice, client });
  };

  // Substitute tags inside the text block dynamically
  const renderTemplatePreview = (templateContent: string, currentInvoice: Invoice, currentClient: Client): string => {
    const pLink = `${window.location.origin}/pay/${currentInvoice.id}`;
    
    return templateContent
      .replace(/{nama_klien}/g, currentClient.name)
      .replace(/{perusahaan_klien}/g, currentClient.company)
      .replace(/{no_invoice}/g, currentInvoice.id)
      .replace(/{jumlah_tagihan}/g, formatIDR(currentInvoice.amount))
      .replace(/{jatuh_tempo}/g, currentInvoice.dueDate)
      .replace(/{link_pembayaran}/g, pLink)
      .replace(/{layanan}/g, currentClient.serviceType)
      .replace(/{bulan_tagihan}/g, getIndonesianMonthName(currentInvoice.billingMonth));
  };

  // Process mock send
  const handleExecuteSend = () => {
    if (!activeSendWizard) return;
    const { invoice, client } = activeSendWizard;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setIsSendingComm(true);
    setSendLogs(["Menghubungkan ke WhatsApp API gateway..."]);

    setTimeout(() => {
      if (template.channel === "whatsapp" && !whatsappConnected) {
        setSendLogs(l => [
          ...l,
          "⚠️ Server warning: Sesi WhatsApp belum di-scan di tab Integrasi QR.",
          "Mencoba mengirim pesan via fallback server relay..."
        ]);
      }
      
      setTimeout(() => {
        setSendLogs(l => [
          ...l, 
          `Mempersiapkan berkas PDF Resmi Invoice ${invoice.id}...`,
          `Melampirkan berkas enkripsi aman: ${invoice.id}.pdf...`,
          `Mengubah placeholder tagihan ${invoice.id}...`,
          `Mengirim pesan teks & lampiran PDF ke nomor target ${client.phone}...`
        ]);

        setTimeout(() => {
          setSendLogs(l => [...l, "✔ Berhasil dikirim dengan lampiran berkas PDF! Status: Delivered (SLA OK)"]);
          setIsSendingComm(false);

          // Update reminder count on invoice
          const updatedInvoices = invoices.map(i => {
            if (i.id === invoice.id) {
              return { ...i, reminderSentCount: i.reminderSentCount + 1 };
            }
            return i;
          });
          onChangeInvoices(updatedInvoices);

          // Render on-screen mockup preview
          const messageCompiled = renderTemplatePreview(template.content, invoice, client);
          setMobilePhoneMockupMessage(messageCompiled);
        }, 1200);
      }, 1000);
    }, 800);
  };

  // Copy simulated link
  const handleCopyLink = (invoiceId: string) => {
    const dummyLink = `${window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(dummyLink);
    setCopiedInvoiceId(invoiceId);
    setTimeout(() => setCopiedInvoiceId(null), 1500);
  };

  // Simulated client checkout payment process
  const handleOpenClientPaymentPortal = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client) return;
    setActivePaymentPortal({ invoice, client });
  };

  const handleSimulatePaymentSuccess = (method: "QRIS" | "Bank Transfer") => {
    if (!activePaymentPortal) return;
    const { invoice, client } = activePaymentPortal;

    // 1. Update invoice status in DB
    const updatedInvoices = invoices.map(i => {
      if (i.id === invoice.id) {
        return {
          ...i,
          status: "Paid" as const,
          paymentMethod: method,
          paymentDate: new Date().toISOString().split("T")[0]
        };
      }
      return i;
    });

    onChangeInvoices(updatedInvoices);

    // 2. Append general bookkeeping ledger entry automatically
    const newBookkeepingEntry: BookkeepingRecord = {
      id: `INC-${Math.floor(100 + Math.random()*900)}`,
      date: new Date().toISOString().split("T")[0],
      type: "Income",
      category: "Pendapatan Jasa NOC",
      invoiceId: invoice.id,
      description: `Pembayaran Invoice #${invoice.id} (${client.company}) via ${method}`,
      amount: invoice.amount
    };

    onAddBookkeeping(newBookkeepingEntry);
    setActivePaymentPortal(null);
    notify(`Rekonsiliasi Sukses!\nTagihan ${invoice.id} kini berstatus Lunas. Kas masuk sebesar ${formatIDR(invoice.amount)} telah disinkronisasikan ke pembukuan secara real-time!`, "success");
  };

  return (
    <div className="space-y-6" id="invoices-main-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs" id="inv-hdr">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" id="inv-title">Manajemen & Pengiriman Tagihan</h1>
          <p className="text-sm text-slate-500" id="inv-subtitle">Buat invoice otomatis, unduh salinan PDF, pantau link pembayaran digital, dan kirim pengingat berkala.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3" id="header-actions">
          <button 
            onClick={() => {
              setBulkStep("warn");
              setIsBulkOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
            id="btn-trigger-bulk-inv"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse block"></span>
            Bulk Generate Invoice
          </button>

          <button 
            onClick={handleOpenNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
            id="btn-trigger-add-inv"
          >
            <FilePlus className="w-4 h-4" /> Buat Invoice Baru
          </button>
        </div>
      </div>

      {/* Draft invoice generator dialog */}
      {isNewInvoiceOpen && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md animate-in fade-in duration-100" id="invoice-gen-modal">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-5" id="inv-gen-hdr">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Generate Invoice Baru Pelanggan SLA</h2>
            <button 
              onClick={() => setIsNewInvoiceOpen(false)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="inv-gen-form">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Pilih Pelanggan SLA Aktif:</label>
              <select 
                value={selectedClientId} 
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-bold text-slate-700 focus:outline-blue-500"
                id="select-active-cli"
              >
                {activeClients.map(c => (
                  <option key={c.id} value={c.id}>{c.company} (PIC: {c.name} - {formatIDR(c.monthlyFee)}/bln)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Bulan Periode Layanan:</label>
              <select 
                value={billingMonth} 
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-blue-500"
                id="select-billing-period"
              >
                <option value="2026-03">Maret 2026</option>
                <option value="2026-04">April 2026</option>
                <option value="2026-05">Mei 2026</option>
                <option value="2026-06">Juni 2026</option>
                <option value="2026-07">Juli 2026</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Durasi Jatuh Tempo Pembayaran (Hari):</label>
              <select 
                value={dueDateOffset} 
                onChange={(e) => setDueDateOffset(e.target.value)}
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-blue-500"
                id="select-offset-days"
              >
                <option value="5">5 Hari sejak rilis</option>
                <option value="10">10 Hari sejak rilis (Standar)</option>
                <option value="15">15 Hari sejak rilis</option>
                <option value="30">30 Hari sejak rilis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Status Awal Penerbitan:</label>
              <select 
                value={invoiceStatus} 
                onChange={(e) => setInvoiceStatus(e.target.value as "Draft" | "Unpaid")}
                className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white focus:outline-blue-500"
                id="select-initial-state"
              >
                <option value="Unpaid">Terbit (Belum Bayar / Menunggu Pembayaran)</option>
                <option value="Draft">Draft (Disimpan Dahulu)</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-2" id="inv-foot-actions">
              <button 
                type="button" 
                onClick={() => setIsNewInvoiceOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Kembali
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Selesaikan & Rilis Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and search area */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3" id="inv-table-filters-container">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between" id="inv-table-filters">
          <div className="w-full md:max-w-md flex items-center gap-2" id="search-bar">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari invoice berdasarkan ID, Nama Klien, Perusahaan..."
              className="w-full text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800"
              id="inp-search-inv"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end" id="filter-pills">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {["All", "Paid", "Unpaid", "Overdue", "Draft"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-colors cursor-pointer ${
                  statusFilter === st 
                    ? "bg-blue-600 text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                id={`filter-pill-${st}`}
              >
                {st === "All" ? "Semua Tagihan" : st === "Paid" ? "Lunas" : st === "Unpaid" ? "Belum Bayar" : st === "Overdue" ? "Terlambat" : "Draft"}
              </button>
            ))}
          </div>
        </div>

        {selectedInvoiceIds.length > 0 && (
          <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 px-3 py-2 rounded-xl animate-in font-sans duration-200">
            <span className="text-[11.5px] font-bold text-rose-800 dark:text-rose-300">
              Terpilih <strong>{selectedInvoiceIds.length}</strong> invoice untuk tindakan massal.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirm(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                id="bulk-delete-invoices-btn"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Massal ({selectedInvoiceIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoiceIds([])}
                className="text-slate-400 hover:text-slate-650 text-xs font-semibold select-none cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Invoice List Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden" id="invoices-ledger-panel">
        <div className="overflow-x-auto" id="inv-table-scroll">
          <table className="w-full text-left border-collapse" id="inv-main-table">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-3.5 px-4 text-center w-12" id="th-inv-checkbox">
                  <input
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
                      } else {
                        setSelectedInvoiceIds([]);
                      }
                    }}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="py-3.5 px-6">No Invoice</th>
                <th className="py-3.5 px-6">Nama Instansi / Klien</th>
                <th className="py-3.5 px-5 font-mono">Bulan Buku</th>
                <th className="py-3.5 px-5 text-right font-mono">Nilai (IDR)</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-6 text-center">Tindakan Admin & Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                    Tidak ditemukan ada invoice dengan kriteria tersebut.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const client = clients.find(c => c.id === inv.clientId);
                  
                  return (
                    <tr className="hover:bg-slate-50/50 transition-colors" key={inv.id} id={`row-inv-${inv.id}`}>
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.includes(inv.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoiceIds(prev => [...prev, inv.id]);
                            } else {
                              setSelectedInvoiceIds(prev => prev.filter(id => id !== inv.id));
                            }
                          }}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                        />
                      </td>
                      {/* ID No */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-900" id={`td-code-${inv.id}`}>
                        {inv.id}
                      </td>

                      {/* Client Info */}
                      <td className="py-4 px-6" id={`td-client-${inv.id}`}>
                        <span className="font-bold text-slate-950 block">{inv.clientCompany}</span>
                        <span className="text-[11px] text-slate-500">PIC: {inv.clientName}</span>
                      </td>

                      {/* Billing Month */}
                      <td className="py-4 px-5 text-slate-500 font-mono" id={`td-month-${inv.id}`}>
                        {getIndonesianMonthName(inv.billingMonth)}
                      </td>

                      {/* Amount with PPN detail on hover */}
                      <td className="py-4 px-5 text-right font-mono font-bold text-slate-900" id={`td-val-${inv.id}`}>
                        <div>{formatIDR(inv.amount)}</div>
                        <span className="text-[10px] font-normal text-slate-400 block">+ PPN 11%: {formatIDR(inv.amount * 0.11)}</span>
                      </td>

                      {/* Status Badges */}
                      <td className="py-4 px-5 text-center" id={`td-badge-${inv.id}`}>
                        {inv.status === "Paid" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span> Lunas ({inv.paymentMethod})
                          </span>
                        ) : inv.status === "Unpaid" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 block"></span> Belum Bayar
                          </span>
                        ) : inv.status === "Overdue" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block"></span> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 block"></span> Draft
                          </span>
                        )}
                        {inv.reminderSentCount > 0 && (
                          <span className="block text-[9px] text-slate-400 mt-1">Disentil WA: {inv.reminderSentCount}x</span>
                        )}
                      </td>
 
                      {/* Dynamic Action suite */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {/* 1. PDF Exporter */}
                          <button
                            onClick={() => {
                              if (client) exportInvoicePDF(inv, client, bizProfile);
                            }}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Unduh PDF Resmi Invoice ini"
                          >
                            <Download className="w-3 h-3 text-slate-500" /> PDF
                          </button>
 
                          {/* 2. Notification Dispatch */}
                          {inv.status !== "Draft" && inv.status !== "Paid" && (
                            <button
                              onClick={() => handleOpenSendWizard(inv)}
                              className="p-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Kirim pengingat tagihan otomatis via WA & Email"
                            >
                              <Send className="w-3 h-3" /> Kirim Pengingat
                            </button>
                          )}
 
                          {/* 3. Link copy */}
                          {inv.status !== "Draft" && (
                            <button
                              onClick={() => handleCopyLink(inv.id)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                              title="Salin Portal Link Pembayaran client"
                            >
                              {copiedInvoiceId === inv.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
 
                          {/* 4. Payment simulation checkout portal link */}
                          {inv.status !== "Paid" && inv.status !== "Draft" && (
                            <button
                              onClick={() => handleOpenClientPaymentPortal(inv)}
                              className="p-1 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold tracking-tight inline-flex items-center gap-0.5 cursor-pointer transition-colors"
                              title="Buka Portal Pembayaran Instan QRIS & VA Klien"
                            >
                              <CreditCard className="w-3 h-3" /> Link Bayar
                            </button>
                          )}

                          {/* 5. Delete Invoice */}
                          {confirmDeleteId === inv.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const remaining = invoices.filter(i => i.id !== inv.id);
                                  onChangeInvoices(remaining);
                                  setConfirmDeleteId(null);
                                  if (triggerToast) triggerToast(`Invoice #${inv.id} berhasil dihapus secara permanen.`, "success");
                                }}
                                className="p-1 px-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(inv.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-colors cursor-pointer"
                              title="Hapus Invoice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH SEND REMINDER WIZARD MODAL */}
      {activeSendWizard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="send-wizard-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            {/* Left Setup panel */}
            <div className="p-6 flex-1 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Simulasi Pengiriman Tagihan</h3>
              <p className="text-xs text-slate-400 mb-4">Pilih saluran dan format templat yang akan dirilis otomatis ke client {activeSendWizard.client.company}.</p>

              {/* Template selection dropdown */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Pilih Templat Pengingat:</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded bg-white text-slate-700 font-semibold focus:outline-blue-500"
                    id="select-wizard-tpl"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.channel === "whatsapp" ? "💬 WA" : "✉ Email"} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Live substitutions info table */}
                <div className="bg-slate-50 p-3 rounded-lg text-[10px] space-y-1 text-slate-500 font-mono" id="substitutions-badge-meta">
                  <span className="font-bold block text-slate-700 mb-1">🏷 Variabel Aktif yang disubtitusikan:</span>
                  <div>{`{nama_klien}`} → {activeSendWizard.client.name}</div>
                  <div>{`{perusahaan_klien}`} → {activeSendWizard.client.company}</div>
                  <div>{`{no_invoice}`} → {activeSendWizard.invoice.id}</div>
                  <div>{`{jumlah_tagihan}`} → {formatIDR(activeSendWizard.invoice.amount)}</div>
                  <div>{`{jatuh_tempo}`} → {activeSendWizard.invoice.dueDate}</div>
                </div>

                {/* Logger box */}
                {sendLogs.length > 0 && (
                  <div className="bg-slate-900 text-blue-400 p-3 rounded-lg text-[10px] font-mono h-24 overflow-y-auto space-y-1 shadow-inner border border-slate-800" id="wizard-terminal-logs">
                    {sendLogs.map((log, index) => (
                      <div key={index}>{log}</div>
                    ))}
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setActiveSendWizard(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleExecuteSend}
                    disabled={isSendingComm}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-lg cursor-pointer inline-flex items-center gap-1"
                  >
                    {isSendingComm ? "Mengirim..." : "Kirim Sekarang"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right smartphone preview mockup */}
            <div className="bg-slate-100 p-6 w-full md:w-80 flex flex-col items-center justify-center border-t md:border-t-0 border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Pratinjau Smartphone Client</span>
              
              {/* Phone Container */}
              <div className="w-64 h-[400px] bg-slate-950 rounded-[30px] border-[5px] border-slate-800 p-2.5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                {/* Speaker grill / camera notch */}
                <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto absolute top-1 left-1/2 -translate-x-1/2 z-10"></div>
                
                {/* Phone screen inside */}
                <div className="flex-1 bg-slate-900 rounded-[20px] p-2 flex flex-col justify-between text-white font-sans text-[11px] overflow-hidden mt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[9px] text-slate-500 font-mono">
                    <span>Active Gateway</span>
                    <span>13:52 (UTC)</span>
                  </div>

                  {/* Chat interface panel bubble */}
                  <div className="flex-1 overflow-y-auto py-2 space-y-2">
                    <div className="bg-emerald-850 text-[10px] max-w-[85%] rounded-lg p-2 mr-auto text-emerald-100 border border-emerald-800 shadow-sm leading-snug break-words whitespace-pre-wrap">
                      {templates.find(t => t.id === selectedTemplateId) ? (
                        renderTemplatePreview(templates.find(t => t.id === selectedTemplateId)!.content, activeSendWizard.invoice, activeSendWizard.client)
                      ) : "Mohon pilih salah satu templat..."}

                      {/* Attached PDF card */}
                      <div className="mt-2 p-1.5 bg-white text-slate-800 rounded border border-slate-200 flex items-center gap-1.5 font-sans shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
                           onClick={() => exportInvoicePDF(activeSendWizard.invoice, activeSendWizard.client, bizProfile)}>
                        <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0 text-[8px] leading-tight text-left">
                          <div className="font-bold text-slate-900 truncate">{activeSendWizard.invoice.id}.pdf</div>
                          <div className="text-slate-400 font-normal">Klasifikasi: Resmi • 145 KB</div>
                        </div>
                        <span className="text-[7.5px] text-blue-600 bg-blue-50 px-1 rounded font-bold whitespace-nowrap">Unduh</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-1.5 rounded-lg text-slate-500 text-[8px] text-center">
                    Klik 'Kirim Sekarang' untuk memicu transmisi QR relay WA otomatis.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP MOBILE LAYOUT SENT SUCCESS MOCKUP POPUP */}
      {mobilePhoneMockupMessage && (
        <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-4 z-50 animate-in zoom-in duration-200">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xl relative w-full max-w-sm overflow-hidden flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-900 text-center">Notifikasi Mengalir ke WhatsApp Client!</h4>
            <p className="text-xs text-slate-400 text-center mt-1">Sistem menyimulasikan push API langsung ke smartphone PIC via token session QR:</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-950 font-sans mt-3 h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner w-full text-left">
               <span className="font-bold text-xs text-emerald-800 block border-b border-emerald-200 pb-1 mb-1">💬 Dari: Billing NOC Streamer</span>
               <div className="mb-2">{mobilePhoneMockupMessage}</div>

               {/* PDF Attachment inside successful notification */}
               <div className="p-2 bg-white text-slate-800 rounded-lg border border-slate-200 flex items-center gap-2 font-sans shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      const inv = activeSendWizard?.invoice;
                      const cli = activeSendWizard?.client;
                      if (inv && cli) exportInvoicePDF(inv, cli, bizProfile);
                    }}>
                 <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                 <div className="flex-1 min-w-0 text-[8.5px] leading-tight">
                   <div className="font-bold text-slate-900 truncate">{activeSendWizard?.invoice?.id || "invoice"}.pdf</div>
                   <div className="text-slate-400 font-medium">Dokumen Bukti Tagihan Sah • 145 KB</div>
                 </div>
                 <span className="text-[7.5px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-bold">UNDUH</span>
               </div>
            </div>

            <button
              onClick={() => setMobilePhoneMockupMessage(null)}
              className="mt-4 px-5 py-2 w-full bg-slate-900 hover:bg-slate-800 rounded-xl text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Kembali ke Panel Billing
            </button>
          </div>
        </div>
      )}

      {/* SMART CHKLST / PORTAL SIMULATOR FOR PAYMENT INVOICES */}
      {activePaymentPortal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150" id="portal-checkout">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden" id="p-core-dialog">
            
            {/* Header branding */}
            <div className="p-5 bg-gradient-to-r from-blue-700 to-blue-900 text-white flex justify-between items-center" id="p-hdr">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">PORTAL PEMBAYARAN DIGITAL CLIENT</span>
                <h3 className="text-sm font-bold tracking-tight mt-0.5">{activePaymentPortal.client.company}</h3>
              </div>
              <button 
                onClick={() => setActivePaymentPortal(null)}
                className="text-slate-200 hover:text-white font-bold text-xs bg-blue-800/50 p-1 px-2.5 rounded cursor-pointer"
              >
                Tutup x
              </button>
            </div>

            {/* Main Checkout details */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto" id="p-content">
              {/* Product Info summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">No Invoice</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{activePaymentPortal.invoice.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Total Pembayaran (PPN 11%)</span>
                  <span className="font-extrabold text-blue-600 font-mono text-sm">
                    {formatIDR(activePaymentPortal.invoice.amount * 1.11)}
                  </span>
                </div>
              </div>

              {/* Method 1: QRIS statis */}
              <div className="border border-slate-200 p-4 rounded-xl space-y-3 relative overflow-hidden bg-white hover:border-blue-500 transition-colors" id="checkout-qris">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-blue-50 text-blue-600 rounded-md font-bold text-[10px]">PILIHAN 1</span>
                    <h4 className="text-xs font-bold text-slate-800">QRIS Statis Auto-Check (Rekomendasi)</h4>
                  </div>
                  {/* Mock QRIS logo */}
                  <span className="text-[11px] font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest font-sans">QRIS</span>
                </div>

                <p className="text-[11px] text-slate-400">Scan QRIS merchant ini di e-wallet (Gopay, OVO, Dana, LinkAja) atau m-Banking Anda. Sistem SLA NOC mendeteksi pelunasan instan secara real-time.</p>

                {/* Simulated QR block layout */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                  {/* Generated QR Box */}
                  <div className="w-36 h-36 bg-white p-2 border border-slate-200 rounded-md flex items-center justify-center relative shadow-sm">
                    {/* Simulated SVG QRIS Pattern */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="opacity-90">
                      <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                      {/* Anchor square corners */}
                      <rect x="5" y="5" width="20" height="20" fill="#000" />
                      <rect x="8" y="8" width="14" height="14" fill="#fff" />
                      <rect x="11" y="11" width="8" height="8" fill="#000" />

                      <rect x="75" y="5" width="20" height="20" fill="#000" />
                      <rect x="78" y="8" width="14" height="14" fill="#fff" />
                      <rect x="81" y="81" width="8" height="8" fill="#000" />

                      <rect x="5" y="75" width="20" height="20" fill="#000" />
                      <rect x="8" y="78" width="14" height="14" fill="#fff" />
                      <rect x="11" y="81" width="8" height="8" fill="#000" />

                      {/* Random barcodes/blocks simulation */}
                      <rect x="35" y="15" width="25" height="10" fill="#000" />
                      <rect x="40" y="30" width="15" height="15" fill="#000" />
                      <rect x="15" y="40" width="10" height="25" fill="#000" />
                      <rect x="70" y="30" width="25" height="20" fill="#000" />
                      <rect x="40" y="75" width="25" height="20" fill="#000" />
                      <rect x="70" y="60" width="12" height="12" fill="#000" />
                      
                      {/* Tiny cyan center label */}
                      <rect x="42" y="42" width="16" height="16" fill="#2563eb" rx="2" />
                      <text x="50" y="52" fill="#fff" fontSize="6" textAnchor="middle" fontWeight="bold">NOC</text>
                    </svg>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-1.5 uppercase">UNIK: NM-{activePaymentPortal.invoice.id}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulatePaymentSuccess("QRIS")}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  [Simulasi] Selesaikan Scan QRIS & Bayar
                </button>
              </div>

              {/* Method 2: Virtual account bank */}
              <div className="border border-slate-200 p-4 rounded-xl space-y-3 bg-white hover:border-blue-500 transition-colors" id="checkout-bank">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-blue-50 text-blue-600 rounded-md font-bold text-[10px]">PILIHAN 2</span>
                    <h4 className="text-xs font-bold text-slate-800">Transfer Bank / Virtual Account (VA)</h4>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">INTERBANK</span>
                </div>

                <div className="space-y-2 text-xs" id="va-codes-group">
                  <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Bank Mandiri Virtual Account:</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">8899120000002</span>
                    </div>
                    <button 
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText("88991200000002");
                        } catch(e) {}
                        notify("Nomor Mandiri Virtual Account (8899120000002) berhasil disalin ke clipboard.", "success");
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 shrink-0 cursor-pointer"
                    >
                      Copy VA
                    </button>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg animate-pulse">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Bank BCA Virtual Account:</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">7711230000003</span>
                    </div>
                    <button 
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText("7711230000003");
                        } catch(e) {}
                        notify("Nomor BCA Virtual Account (7711230000003) berhasil disalin ke clipboard.", "success");
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 shrink-0 cursor-pointer"
                    >
                      Copy VA
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulatePaymentSuccess("Bank Transfer")}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                  [Simulasi] Selesaikan Transfer Bank VA & Rekonsiliasi
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* BULK GENERATION & ADMIN NOTIFICATION MODAL */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200" id="bulk-modal-overlay">
          <div className="bg-white dark:bg-[#151e2e] w-full max-w-4xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto" id="bulk-modal-sheet">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4" id="bulk-hdr">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Bulk Invoice Generator & Audit SLA
                </h3>
              </div>
              <button 
                onClick={() => setIsBulkOpen(false)}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors font-semibold"
                id="bulk-close-btn"
              >
                Kembali / Tutup
              </button>
            </div>

            {/* Mandatory Alert / Notifikasi ke Admin */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-lg mb-5" id="admin-notif-banner">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                    📣 Notifikasi & Peringatan Admin (Wajib Verifikasi)
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400/95 mt-1 leading-relaxed">
                    Sistem mewajibkan Admin untuk meninjau status dan jenis layanan pelanggan sebelum memicu pembuatan tagihan massal (Bulk Invoice). Layanan baru seperti <strong>VPN (IPSec Tunneling)</strong> dan <strong>Monitoring Node (SNMP)</strong> harus dikonfigurasikan sesuai kontrak berjalan. <span className="underline font-semibold">Silakan edit tipe layanan langsung di bawah ini</span> jika terdapat penyesuaian tarif terbaru.
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Verifikasi Layanan Pelanggan */}
            <div className="mb-6 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden" id="verif-table-wrapper">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3 border-b border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daftar Pelanggan Aktif ({activeClients.length} Klien Terdeteksi)
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded border border-emerald-100/50">
                  SLA & Jasa Berjalan
                </span>
              </div>

              {activeClients.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic dark:text-slate-500">
                  Belum ada pelanggan dengan status Aktif yang terdaftar di sistem.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto bg-slate-50/20" id="verifier-clients-list">
                  {activeClients.map((client) => {
                    const isEditingThis = inlineEditingClientId === client.id;
                    return (
                      <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs" key={client.id} id={`bulk-cli-row-${client.id}`}>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{client.company}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">PIC: {client.name} | Kontak: {client.phone}</div>
                        </div>

                        {isEditingThis ? (
                          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-blue-200/80 dark:border-blue-900/50 shadow-sm grow max-w-xl">
                            <div className="grow animate-in fade-in">
                              <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Edit Layanan:</label>
                              <select
                                value={inlineTempService}
                                onChange={(e) => {
                                  const svc = e.target.value;
                                  setInlineTempService(svc);
                                  // Preset pricing mapping from constant
                                  const pr = {
                                    "NOC Basic 8x5": 3000000,
                                    "NOC Standard 24x7": 5500000,
                                    "NOC Enterprise High-Availability": 12000000,
                                    "SLA Gold Monitoring 24x7": 7500000,
                                    "VPN IPSec Tunneling & Firewall": 2000000,
                                    "SD-WAN Dedicated Monitoring": 4500000,
                                    "Monitoring Node SNMP & Ping": 1500000,
                                    "NOC & Cloud Managed Service": 8000000,
                                  }[svc];
                                  if (pr) setInlineTempFee(pr);
                                }}
                                className="w-full text-xs border border-slate-200 dark:border-slate-800 p-1.5 rounded bg-white dark:bg-slate-900 font-bold"
                              >
                                <option value="NOC Basic 8x5">NOC Basic 8x5 (Rp 3jt)</option>
                                <option value="NOC Standard 24x7">NOC Standard 24x7 (Rp 5.5jt)</option>
                                <option value="NOC Enterprise High-Availability">NOC Enterprise (Rp 12jt)</option>
                                <option value="SLA Gold Monitoring 24x7">SLA Gold Mon (Rp 7.5jt)</option>
                                <option value="VPN IPSec Tunneling & Firewall">VPN IPSec (Rp 2jt)</option>
                                <option value="SD-WAN Dedicated Monitoring">SD-WAN Mon (Rp 4.5jt)</option>
                                <option value="Monitoring Node SNMP & Ping">Node SNMP (Rp 1.5jt)</option>
                                <option value="NOC & Cloud Managed Service">Cloud Managed (Rp 8jt)</option>
                              </select>
                            </div>
                            <div className="w-28 animate-in fade-in">
                              <label className="block text-[9px] text-slate-400 uppercase font-bold mb-0.5">Tarif Bulanan:</label>
                              <input
                                type="number"
                                value={inlineTempFee}
                                onChange={(e) => setInlineTempFee(Number(e.target.value))}
                                className="w-full text-xs border border-slate-200 dark:border-slate-800 p-1.5 rounded font-mono font-bold text-blue-600 dark:text-blue-400"
                              />
                            </div>
                            <div className="flex gap-1 self-end animate-in fade-in">
                              <button
                                onClick={() => saveInlineEdit(client)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold hover:scale-105 transition-transform font-sans"
                                title="Simpan Perubahan"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={cancelInlineEdit}
                                className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold"
                                title="Batal"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-150/50 dark:border-slate-800/80">
                            <div>
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold">
                                {client.serviceType}
                              </span>
                              <div className="text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400 text-right mt-0.5">
                                {formatIDR(client.monthlyFee)}/bln
                              </div>
                            </div>
                            <button
                              onClick={() => startInlineEdit(client)}
                              className="px-2.5 py-1 text-[10px] bg-slate-200 hover:bg-blue-600 text-slate-700 hover:text-white rounded font-bold cursor-pointer transition-colors duration-155"
                              id={`btn-inline-edit-${client.id}`}
                            >
                              Edit Jasa
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Invoicing Parameter Options Form */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/80 mb-6" id="bulk-params">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 font-sans">
                Konfigurasi Parameter Tagihan Massal
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Pilih Periode Jasa Bulanan:</label>
                  <select 
                    value={bulkBillingMonth} 
                    onChange={(e) => setBulkBillingMonth(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg bg-white dark:bg-slate-900 focus:outline-blue-500 font-semibold"
                    id="select-bulk-month"
                  >
                    <option value="2026-03">Maret 2026</option>
                    <option value="2026-04">April 2026</option>
                    <option value="2026-05">Mei 2026</option>
                    <option value="2026-06">Juni 2026</option>
                    <option value="2026-07">Juli 2026</option>
                    <option value="2026-08">Agustus 2026</option>
                    <option value="2026-09">September 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Batas Waktu Pembayaran:</label>
                  <select 
                    value={bulkDueDateOffset} 
                    onChange={(e) => setBulkDueDateOffset(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg bg-white dark:bg-slate-900 focus:outline-blue-500 font-semibold"
                    id="select-bulk-offset"
                  >
                    <option value="5">5 Hari ke depan</option>
                    <option value="10">10 Hari ke depan (Default)</option>
                    <option value="15">15 Hari ke depan</option>
                    <option value="30">30 Hari ke depan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status Saat Penerbitan:</label>
                  <select 
                    value={bulkStatus} 
                    onChange={(e) => setBulkStatus(e.target.value as "Draft" | "Unpaid")}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg bg-white dark:bg-slate-900 focus:outline-blue-500 font-semibold"
                    id="select-bulk-status"
                  >
                    <option value="Unpaid">Terbit Langsung (Unpaid)</option>
                    <option value="Draft">Draft (Disimpan sebagai rancangan)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left font-sans">
                Aksi ini memproses seluruh Klien berstatus Aktif di atas secara paralel.
              </p>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsBulkOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                  id="btn-close-and-cancel-bulk"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={activeClients.length === 0}
                  onClick={handleExecuteBulkInvoice}
                  className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg cursor-pointer flex items-center justify-center gap-2 font-sans"
                  id="btn-confirm-and-generate-bulk"
                >
                  <Check className="w-3.5 h-3.5" /> Terbitkan Massal ({activeClients.length} Invoice)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Bulk Delete Invoices Confirmation Dialog */}
      {isBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150" id="bulk-inv-delete-modal-overlay">
          <div className="bg-white dark:bg-[#151e2e] w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-sans">
                Hapus Massal Invoice
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mb-6">
              Apakah Anda benar-benar yakin ingin menghapus secara permanen sebanyak <strong className="text-rose-650 font-bold">{selectedInvoiceIds.length}</strong> invoice terpilih?
              <br /><br />
              Tindakan ini bersifat permanen dan tidak dapat dibatalkan. Riwayat buku kas yang terhubung mungkin perlu disesuaikan secara manual.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const remaining = invoices.filter(i => !selectedInvoiceIds.includes(i.id));
                  onChangeInvoices(remaining);
                  setSelectedInvoiceIds([]);
                  setIsBulkDeleteConfirm(false);
                  if (triggerToast) triggerToast("Seluruh invoice terpilih berhasil dihapus massal.", "success");
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                id="bulk-delete-inv-confirm-btn"
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
