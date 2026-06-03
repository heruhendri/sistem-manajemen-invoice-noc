import React, { useState, useMemo } from "react";
import { NotificationTemplate, Client, Invoice } from "../types";
import { 
  QrCode, 
  Settings, 
  Check, 
  Smartphone, 
  RefreshCw, 
  MessageSquare, 
  Mail, 
  Save, 
  Flame, 
  CheckCircle2, 
  Send, 
  Database, 
  Bell, 
  FileCode, 
  Trash2, 
  Play, 
  AlertTriangle, 
  Monitor, 
  Activity, 
  FolderDown, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Users,
  UploadCloud
} from "lucide-react";

interface IntegrationViewProps {
  templates: NotificationTemplate[];
  onUpdateTemplate: (template: NotificationTemplate) => void;
  whatsappConnected: boolean;
  onSetWhatsappConnected: (connected: boolean) => void;
  clients: Client[];
  invoices: Invoice[];
  triggerToast?: (message: string, type?: "success" | "warning" | "error" | "info") => void;
  onResetData?: () => void;
  onRestoreData?: (imported: any) => void;
}

interface TelegramLog {
  id: string;
  timestamp: string;
  type: "Ping Test" | "Backup Database" | "SLA Recommendation" | "SLA Error Alert";
  detail: string;
  status: "Success" | "Failed";
  destination: string;
}

interface SlaRecommendation {
  id: string;
  level: "🔴 CRITICAL OVERLOAD" | "🟡 BILLING EXCEEDED" | "🟢 BUSINESS ADVICE";
  title: string;
  message: string;
  isDispatched: boolean;
}

export default function IntegrationView({
  templates,
  onUpdateTemplate,
  whatsappConnected,
  onSetWhatsappConnected,
  clients,
  invoices,
  triggerToast,
  onResetData,
  onRestoreData
}: IntegrationViewProps) {
  const notify = (msg: string, type: "success" | "warning" | "error" | "info" = "info") => {
    if (triggerToast) {
      triggerToast(msg, type);
    } else {
      console.log(msg);
    }
  };

  // Sub-tabs segment state: "wa-email" (default) or "telegram" (new)
  const [activeTabSegment, setActiveTabSegment] = useState<"wa-email" | "telegram" | "whatsapp-bot">("wa-email");

  // WA QR pairing states
  const [pairingProgress, setPairingProgress] = useState<"none" | "initializing" | "ready" | "connecting" | "completed">(
    whatsappConnected ? "completed" : "ready"
  );
  const [phoneNumber, setPhoneNumber] = useState(whatsappConnected ? "081234567890" : "");

  // Restore Database State Confirm inside Integration
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<any | null>(null);

  // WhatsApp Multi-Admin state
  const [whatsappAdminPhones, setWhatsappAdminPhones] = useState<string[]>([
    "081234567890",
    "089876543210"
  ]);
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [whatsappChat, setWhatsappChat] = useState<Array<{ id: string; sender: "user" | "bot"; text: string; timestamp: string }>>([
    {
      id: "wa-1",
      sender: "bot",
      text: "🤖 *NOC Nusantara Multi-Admin WhatsApp Bot*\n\nSelamat datang! Gunakan list perintah di bawah untuk monitoring status database:\n\n👉 *!menu* - Tampilkan semua menu command\n👉 *!pelanggan* - Lihat live list klien terpasang\n👉 *!invoice* - Cek invoice & outstanding billing\n👉 *!keuangan* - Laporan arus kas Buku Kas\n👉 *!vps* - Ping check status Routerboard aktif",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [whatsappIsTyping, setWhatsappIsTyping] = useState(false);
  const [telegramBroadcastGroup, setTelegramBroadcastGroup] = useState("#NOC-NUSANTARA-ALERTS");
  const [telegramBroadcastText, setTelegramBroadcastText] = useState("");
  const [isTelegramBroadcasting, setIsTelegramBroadcasting] = useState(false);
  
  // Template customization states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "");
  const [editedContent, setEditedContent] = useState<string>(templates[0]?.content || "");
  const [editedSubject, setEditedSubject] = useState<string>(templates[0]?.subject || "");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Pick a sample client & invoice for the Sandbox Preview panel at bottom
  const sampleClient = useMemo(() => clients[0] || null, [clients]);
  const sampleInvoice = useMemo(() => invoices[0] || null, [invoices]);

  // Read current selected template values
  const currentTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Sync edits when selected template changes
  React.useEffect(() => {
    if (currentTemplate) {
      setEditedContent(currentTemplate.content);
      setEditedSubject(currentTemplate.subject || "");
    }
  }, [currentTemplate]);

  // Trigger QR render sequence
  const handleStartLinking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      notify("Harap masukkan nomor WhatsApp yang ingin disinkronisasikan terlebih dahulu.", "warning");
      return;
    }
    setPairingProgress("initializing");
    setTimeout(() => {
      setPairingProgress("ready");
    }, 1000);
  };

  // Simulating scanner match success
  const handleConfirmPairing = () => {
    setPairingProgress("connecting");
    setTimeout(() => {
      setPairingProgress("completed");
      onSetWhatsappConnected(true);
      notify("WhatsApp Server terhubung sukses!", "success");
    }, 1500);
  };

  // Terminate whatsapp link
  const handleDisconnect = () => {
    setShowDisconnectConfirm(true);
  };

  // Restore DB File Handler
  const handleSystemUploadRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && (parsed.clients || parsed.invoices)) {
            setShowRestoreConfirm(parsed);
          } else {
            notify("Format file JSON tidak cocok dengan blueprint backup database NOC.", "error");
          }
        } catch (error) {
          notify("Gagal membaca atau mem-parsing file JSON.", "error");
        }
      };
      reader.readAsText(file);
    }
  };

  // WhatsApp Admin Contact management mutations
  const handleAddAdminPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPhone) return;
    const cleanNum = newAdminPhone.trim();
    if (!whatsappAdminPhones.includes(cleanNum)) {
      setWhatsappAdminPhones([...whatsappAdminPhones, cleanNum]);
      setNewAdminPhone("");
      notify(`Nomor admin +${cleanNum} ditambahkan sebagai multi-admin sukses!`, "success");
    } else {
      notify("Nomor tersebut sudah terdaftar sebagai admin.", "warning");
    }
  };

  const handleDeleteAdminPhone = (num: string) => {
    if (whatsappAdminPhones.length <= 1) {
      notify("Harus menyisakan minimal 1 nomor admin utama.", "warning");
      return;
    }
    setWhatsappAdminPhones(whatsappAdminPhones.filter(p => p !== num));
    notify(`Nomor admin +${num} berhasil dihapus dari daftar multi-admin.`, "success");
  };

  // Dispatch NOC Alert Notification Group messaging
  const handleTelegramBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramBroadcastText) {
      notify("Harap ketik pesan informasi noc alert terlebih dahulu.", "warning");
      return;
    }
    setIsTelegramBroadcasting(true);
    notify(`Menghubungkan ke Chat API Telegram Group: ${telegramBroadcastGroup}...`, "info");
    
    setTimeout(() => {
      setIsTelegramBroadcasting(false);
      setTelegramBroadcastText("");
      
      const newLog: TelegramLog = {
        id: `TG-NOC-${Math.floor(Math.random() * 900) + 100}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "Ping Test", // Represent as system NOC ping
        detail: `NOC ALERT BROADCAST: ${telegramBroadcastText.slice(0, 30)}...`,
        status: "Success",
        destination: telegramBroadcastGroup
      };
      
      saveTelegramLogsToLocal([newLog, ...telegramLogs]);
      notify(`Sukses! Pesan NOC Alert berhasil didistribusikan ke group telegram ${telegramBroadcastGroup}`, "success");
    }, 1200);
  };

  // WhatsApp Chatbot response dispatching
  const handleWhatsappInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappInput.trim()) return;
    
    const userQuery = whatsappInput.trim();
    const adminContact = whatsappAdminPhones[0] || "081234567890";
    
    // Add user message to log
    const newUserMsg = {
      id: `wa-u-${Date.now()}`,
      sender: "user" as const,
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setWhatsappChat(prev => [...prev, newUserMsg]);
    setWhatsappInput("");
    setWhatsappIsTyping(true);
    
    // Process response after delay
    setTimeout(() => {
      let botResponseText = "";
      const queryLower = userQuery.toLowerCase().trim();
      
      if (queryLower === "!menu") {
        botResponseText = "🤖 *NOC NUSANTARA BOT SERVICES* • Perintah Utama:\n\n👉 *!pelanggan* - Lihat live list klien terpasang\n👉 *!invoice* - Cek invoice & outstanding billing\n👉 *!keuangan* - Ringkasan laba rugi Buku Kas\n👉 *!vps* - Ping check status Routerboard aktif\n👉 *!menu* - Tampilkan menu sedia";
      } else if (queryLower.includes("pelanggan") || queryLower === "!pelanggan") {
        botResponseText = `👥 *LIVE CUSTOMER DATABASE NOC* (${clients.length} terdaftar):\n\n` + 
          clients.map((c, i) => `${i + 1}. *${c.company}* (PIC: ${c.name})\n⚡ Paket: ${c.serviceType || "Premium SLA Broadband"}\n📡 Router: ${c.mikrotikIp || "No IP"}`).join("\n\n");
      } else if (queryLower.includes("invoice") || queryLower === "!invoice") {
        const unpaidCount = invoices.filter(i => i.status === "Unpaid").length;
        const overdueCount = invoices.filter(i => i.status === "Overdue").length;
        const sumUnpaid = invoices.filter(i => i.status !== "Paid").reduce((acc, curr) => acc + curr.amount, 0);
        
        botResponseText = `📝 *LAPORAN INVOICE & PENAGIHAN KLIEN*\n\n` +
          `• Belum Bayar: *${unpaidCount} Klien*\n` +
          `• Menunggak (Overdue): *${overdueCount} Klien*\n` +
          `• Outstanding Piutang: *Rp ${sumUnpaid.toLocaleString("id-ID")}*\n\n` +
          `_Ketik !pelanggan untuk rincian data alamat penagihan._`;
      } else if (queryLower.includes("keuangan") || queryLower === "!keuangan") {
        const incomeSum = invoices.filter(i => i.status === "Paid").reduce((acc, curr) => acc + curr.amount, 0);
        
        botResponseText = `💰 *LAPORAN POSISI KAS MASUK POSITIF (VPS)*\n\n` +
          `🏦 Akumulasi Arus Kas Masuk: *Rp ${incomeSum.toLocaleString("id-ID")}*\n\n` +
          `Data di-sinkronisasikan real-time dari riwayat denda laku.`;
      } else if (queryLower.includes("vps") || queryLower === "!vps") {
        botResponseText = `📡 *DIAGNOSTIK LINK CORE CHANNELS STATUS*:\n\n` +
          clients.filter(c => c.mikrotikIp && c.status === "Active").slice(0, 4).map(c => `🟢 [LINK OK] *${c.company}* - Latency: *${Math.floor(Math.random() * 10) + 11}ms* (SLA Stable)`).join("\n") || "⚠️ Tidak ada VPS IP Host terdaftar.";
      } else {
        botResponseText = `🤖 *NOC Nusantara WhatsApp Bot*\n\nMaaf, perintah *"${userQuery}"* tidak dikenali.\n\nKetik *!menu* untuk memunculkan list petunjuk monitoring beraliansi.`;
      }
      
      const newBotMsg = {
        id: `wa-b-${Date.now()}`,
        sender: "bot" as const,
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setWhatsappChat(prev => [...prev, newBotMsg]);
      setWhatsappIsTyping(false);
    }, 850);
  };

  // Text formatter for sandbox rendering
  const renderSandboxText = (text: string): string => {
    if (!sampleClient || !sampleInvoice) return "Silakan daftarkan minimal 1 pelanggan & invoice di database untuk melihat pratinjau dinamis.";
    
    // Formatter helpers
    const formatIDRLocal = (value: number): string => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
      }).format(value);
    };

    const pLink = `${window.location.origin}/pay/${sampleInvoice.id}`;

    return text
      .replace(/{nama_klien}/g, sampleClient.name)
      .replace(/{perusahaan_klien}/g, sampleClient.company)
      .replace(/{no_invoice}/g, sampleInvoice.id)
      .replace(/{jumlah_tagihan}/g, formatIDRLocal(sampleInvoice.amount))
      .replace(/{jatuh_tempo}/g, sampleInvoice.dueDate)
      .replace(/{link_pembayaran}/g, pLink)
      .replace(/{layanan}/g, sampleClient.serviceType)
      .replace(/{bulan_tagihan}/g, getIndonesianMonthName(sampleInvoice.billingMonth));
  };

  // Helper for Indonesian Month Name
  function getIndonesianMonthName(monthStr: string): string {
    const months: { [key: string]: string } = {
      "01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
      "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
      "09": "September", "10": "Oktober", "11": "November", "12": "Desember"
    };
    const parts = monthStr.split("-");
    if (parts.length === 2) {
      return `${months[parts[1]]} ${parts[0]}`;
    }
    return monthStr;
  }

  // Handle template updating
  const handleSaveTemplate = () => {
    if (!currentTemplate) return;
    
    const updated: NotificationTemplate = {
      ...currentTemplate,
      content: editedContent,
      subject: currentTemplate.channel === "email" ? editedSubject : undefined
    };

    onUpdateTemplate(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // ==========================================
  // TELEGRAM BOT INTEGRATION STATES & HANDLERS
  // ==========================================
  const [telegramToken, setTelegramToken] = useState<string>("bot7145829631:AAEpG69-Hn_kZ73J_gV9h04N84pY-zLsEwQ");
  const [telegramChatId, setTelegramChatId] = useState<string>("-1002049581735");
  const [isTelegramConnected, setIsTelegramConnected] = useState<boolean>(true);
  const [backupScheduleTime, setBackupScheduleTime] = useState<string>("03:00 WIB");
  const [autoForwardAlerts, setAutoForwardAlerts] = useState<boolean>(true);
  const [isTestLoading, setIsTestLoading] = useState<boolean>(false);
  const [isBackupLoading, setIsBackupLoading] = useState<boolean>(false);
  
  // Recommendations List
  const [recommendations, setRecommendations] = useState<SlaRecommendation[]>([
    {
      id: "rec-1",
      level: "🔴 CRITICAL OVERLOAD",
      title: "Satelindo Media Core Port Latency Deviasi (+18ms)",
      message: "ALARM: Latensi routing gateway SGP-Core-1 ke CDN Singapore melonjak naik ke 68ms karena overload sfp-plus1 transceivers (9.4 Gbps). Direkomendasikan melakukan re-route peering BGP melewati link cadangan Telin-Core-3 untuk kembali menjamin SLA 99.9%.",
      isDispatched: false
    },
    {
      id: "rec-2",
      level: "🟡 BILLING EXCEEDED",
      title: "Rekomendasi Isolir Tagihan Overdue (Aero Prima)",
      message: "SLA WARNING: Pelanggan CLI-101 (Aero Prima Corp) terdeteksi memiliki tagihan jatuh tempo bulan Mei yang telah menunggak melebihi batas 15 hari. Direkomendasikan memicu isolir otomatis portal Mikrotik & limit throughput ke 512Kbps.",
      isDispatched: false
    },
    {
      id: "rec-3",
      level: "🟢 BUSINESS ADVICE",
      title: "Saran Upgrade Kapasitas Transporter sfp-plus1",
      message: "KEUANGAN INFO: Keuntungan bersih (Net Profit) bulan Juni naik sebesar +14.2% dibandingkan pencapaian Mei. Untuk menyokong traffic peak pelanggan, direkomendasikan membeli SFP+ Transceiver baru untuk backup uplink port.",
      isDispatched: false
    }
  ]);

  // Logs database for Telegram
  const [telegramLogs, setTelegramLogs] = useState<TelegramLog[]>(() => {
    const saved = localStorage.getItem("telegram_system_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: "log-1",
        timestamp: "2026-06-02 03:00:01",
        type: "Backup Database",
        detail: "SLA_Backup_Cycle_Daily.json (Total Klien: 4, Invoice: 8, Bookkeeping: 12). Ukuran File: 22.4 KB",
        status: "Success",
        destination: "NOC Net Nusantara Group (-1002049581735)"
      },
      {
        id: "log-2",
        timestamp: "2026-06-02 08:14:32",
        type: "SLA Recommendation",
        detail: "Saran Re-Route Latensi Terkirim ke bot admin @NOC_Backups_Group",
        status: "Success",
        destination: "Channel @NOCnet_billing_channel"
      }
    ];
  });

  const saveTelegramLogsToLocal = (newLogs: TelegramLog[]) => {
    setTelegramLogs(newLogs);
    localStorage.setItem("telegram_system_logs", JSON.stringify(newLogs));
  };

  // ==========================================
  // INTERACTIVE TELEGRAM BOT INLINE SIMULATOR
  // ==========================================
  const [simulatedChat, setSimulatedChat] = useState<any[]>([
    {
      id: "bot-init",
      sender: "bot",
      text: "🤖 *NOC Net Nusantara BillBot* is active and ready!\n\nUse the inline buttons below to query the database, run operations, or trigger backups and restores:",
      timestamp: "Today",
      inlineButtons: [
        { text: "📊 Koneksi Routerboard", callbackId: "cmd_view_routers" },
        { text: "🧾 Ringkasan Keuangan", callbackId: "cmd_view_cash" },
        { text: "📦 Buat Backup Database", callbackId: "cmd_do_backup" },
        { text: "🔄 Restore Backup .json", callbackId: "cmd_do_restore" },
        { text: "⚙️ System Status Nodes", callbackId: "cmd_view_status" }
      ]
    }
  ]);
  const [botIsTyping, setBotIsTyping] = useState<boolean>(false);

  const handleBotCallback = (callbackId: string, buttonText: string) => {
    if (botIsTyping) return;

    // 1. Add User message bubble showing click
    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      sender: "user" as const,
      text: `👉 Klik tombol inline: *${buttonText}*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSimulatedChat(prev => [...prev, userMsg]);
    setBotIsTyping(true);

    setTimeout(() => {
      let botResponseText = "";
      let buttonsAfter = [
        { text: "📊 Koneksi Routerboard", callbackId: "cmd_view_routers" },
        { text: "🧾 Ringkasan Keuangan", callbackId: "cmd_view_cash" },
        { text: "📦 Buat Backup Database", callbackId: "cmd_do_backup" },
        { text: "🔄 Restore Backup .json", callbackId: "cmd_do_restore" },
        { text: "⚙️ System Status Nodes", callbackId: "cmd_view_status" }
      ];

      if (callbackId === "cmd_view_routers") {
        const activeClients = clients.filter(c => c.status === "Active");
        const withMikrotik = clients.filter(c => c.mikrotikIp);
        botResponseText = `📊 *Laporan Perbandingan Koneksi per Routerboard*\n\n` +
          `• Total Klien Terdaftar: *${clients.length}*\n` +
          `• Klien Aktif: *${activeClients.length}*\n` +
          `• Routerboard MikroTik Sinkron: *${withMikrotik.length}*\n\n` +
          `*Daftar Router Sinkron & Traffic:*` +
          (withMikrotik.length === 0 
            ? `\n_(Belum ada router MikroTik yang terkonfigurasi pada klien)_` 
            : `\n` + withMikrotik.map(c => `🌐 *${c.company}* (${c.mtRouterModel || 'RB-Series'})\n  └─ IP: \`${c.mikrotikIp}:${c.mikrotikPort}\` | PPPoE Aktif: *${c.mtActivePppoeCount || 0} user*\n  └─ Uptime: \`${c.mtUptime || 'N/A'}\` | Sync: _${c.mtLastSync || 'N/A'}_`).join("\n\n"));
      } 
      else if (callbackId === "cmd_view_cash") {
        const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0);
        const totalPaid = invoices.filter(inv => inv.status === "Paid").reduce((acc, inv) => acc + inv.amount, 0);
        const unpaidCount = invoices.filter(inv => inv.status !== "Paid").length;
        
        botResponseText = `🧾 *Laporan Kas & Ringkasan Keuangan SLA NOC*\n\n` +
          `• Total Omset Invoice Terbit: *Rp ${totalInvoiced.toLocaleString("id-ID")}*\n` +
          `• Total Dana Berhasil Ditagih: *Rp ${totalPaid.toLocaleString("id-ID")}*\n` +
          `• Invoice Belum Lunas (Pending/Draft): *${unpaidCount} Tagihan*\n\n` +
          `💰 _Status Rekonsiliasi Bank & QRIS otomatis berjalan real-time._`;
      } 
      else if (callbackId === "cmd_do_backup") {
        botResponseText = `📦 *Backup Database NOC Berhasil Di-generate!*\n\n` +
          `• File Name: \`noc_db_backup_${new Date().toISOString().slice(0, 10)}.json\`\n` +
          `• Total Klien: *${clients.length}*\n` +
          `• Total Invoice: *${invoices.length}*\n` +
          `• Status Integritas: *MD5-SAFE-SECUREPRO*\n\n` +
          `👇 _Unduh file backup langsung ke perangkat lokal komputer Anda dengan mengklik tombol di bawah ini:_`;
          
        buttonsAfter = [
          { text: "⬇️ Download File .JSON Backup", callbackId: "cmd_trigger_download_pc" },
          { text: " Kembali ke Menu Utama", callbackId: "cmd_view_main" }
        ];

        // Also push a manual backup log to the list!
        const sizeBytes = JSON.stringify({ clients, invoices }).length;
        const sizeKb = (sizeBytes / 1024).toFixed(2);
        const newLog: TelegramLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          type: "Backup Database",
          detail: `Bot Simulator Keyboard Trigger Backup: Ukuran ${sizeKb} KB (Total Klien: ${clients.length})`,
          status: "Success",
          destination: "@NocBotSimulatedInline"
        };
        saveTelegramLogsToLocal([newLog, ...telegramLogs]);
      }
      else if (callbackId === "cmd_trigger_download_pc") {
        handleDownloadBackupLocal();
        botResponseText = `✅ *Pengunduhan File Backup Dipicu di Browser PC!* Check folder download pc Anda.`;
      }
      else if (callbackId === "cmd_do_restore") {
        botResponseText = `🔄 *Menu Pemulihan / Restore Database SLA NOC*\n\n` +
          `Pilih salah satu metode tindakan pemulihan di bawah ini:\n\n` +
          `⚠️ *PERINGATAN:* Melakukan restore atau reset data akan mengganti isi database local pada memori utama browser Anda secara instan.`;
        buttonsAfter = [
          { text: "⚠️ Kosongkan Data Simulasi & Mulai Riil", callbackId: "cmd_trigger_reset_total" },
          { text: " Kembali ke Menu Utama", callbackId: "cmd_view_main" }
        ];
      }
      else if (callbackId === "cmd_trigger_reset_total") {
        if (onResetData) onResetData();
        botResponseText = `♻️ *Database Kosong Tercipta!*\n\nSeluruh data simulasi bawaan telah berhasil dihapus secara bersih. Layanan siap digunakan dari nol untuk mencatat data pelanggan riil Anda!`;
      }
      else if (callbackId === "cmd_view_status") {
        botResponseText = `⚙️ *Status Kesehatan Node Core SLA Monitoring*\n\n` +
          `• CPU Monitor Engine: *1.4% (Normal)*\n` +
          `• Websocket Stream: *Connected 🟢*\n` +
          `• Memory Overhead: *12.8 MB / 512 MB*\n` +
          `• Database Engine: *LocalStorage Sandbox*\n` +
          `• Telegram API Webhook: *Online (Listening 👂)*\n` +
          `• Database Integrity Key: \`MD5-NOCNET-SLA-GUARANTEE\``;
      }
      else {
        botResponseText = `🤖 *NOC Net Nusantara BillBot* is active and ready!\n\nUse the inline buttons below to query the database, run operations, or trigger backups and restores:`;
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot" as const,
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inlineButtons: buttonsAfter
      };

      setSimulatedChat(prev => [...prev, botMsg]);
      setBotIsTyping(false);
    }, 1000);
  };

  // Test send ping packet to Bot
  const handleTestBotConnection = () => {
    if (!telegramToken || !telegramChatId) {
      notify("Token Bot Telegram dan Chat ID wajib diisi!", "error");
      return;
    }
    setIsTestLoading(true);
    setTimeout(() => {
      setIsTestLoading(false);
      setIsTelegramConnected(true);
      
      const newLog: TelegramLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        type: "Ping Test",
        detail: "Koneksi Websocket Ping Bot Sukses. Robot Telegram bersuara: 'NOC Net Billing Bot Active ⚡'",
        status: "Success",
        destination: telegramChatId
      };
      
      saveTelegramLogsToLocal([newLog, ...telegramLogs]);
      notify("Sukses mengirimkan sinyal ping ke bot Telegram!", "success");
    }, 1200);
  };

  // Simulate pushing system recommendation to Telegram
  const handleDispatchRecommendation = (id: string) => {
    const recIndex = recommendations.findIndex(r => r.id === id);
    if (recIndex === -1) return;
    
    if (!isTelegramConnected) {
      notify("Bot Telegram terputus atau tidak terkonfigurasi.", "error");
      return;
    }

    const currentRec = recommendations[recIndex];
    notify("Sedang mengirimkan rekomendasi ke Telegram...", "info");

    setTimeout(() => {
      // Set to dispatched
      const updatedRecs = [...recommendations];
      updatedRecs[recIndex] = { ...currentRec, isDispatched: true };
      setRecommendations(updatedRecs);

      const newLog: TelegramLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        type: "SLA Recommendation",
        detail: `Rekomendasi Terkirim: [${currentRec.level}] ${currentRec.title}`,
        status: "Success",
        destination: telegramChatId
      };

      saveTelegramLogsToLocal([newLog, ...telegramLogs]);
      notify("Rekomendasi berhasil diteruskan ke Bot Telegram channel @NOC_Backups_Group!", "success");
    }, 800);
  };

  // Reset dispatched flags to allow testing multiple times
  const handleResetDispatched = () => {
    const updated = recommendations.map(r => ({ ...r, isDispatched: false }));
    setRecommendations(updated);
    notify("Status rekomendasi bot direset. Anda dapat mengirimkan ulang.", "info");
  };

  // Simulate Daily Database Backup to Telegram
  const handleSendBackupToTelegram = () => {
    if (!isTelegramConnected) {
      notify("Atur token Telegram dan uji koneksi bot terlebih dahulu.", "warning");
      return;
    }
    
    setIsBackupLoading(true);
    notify("Mengekstrak relasional database & mengonversi ke format JSON...", "info");

    setTimeout(() => {
      setIsBackupLoading(false);
      
      // Calculate file size dynamic string mock
      const sizeBytes = JSON.stringify({ clients, invoices }).length;
      const sizeKb = (sizeBytes / 1024).toFixed(2);

      const newLog: TelegramLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        type: "Backup Database",
        detail: `Manual Backup: database_noc_backup_${new Date().toISOString().slice(0, 10)}.json (Total Klien: ${clients.length}, Invoice: ${invoices.length}). Ukuran: ${sizeKb} KB`,
        status: "Success",
        destination: telegramChatId
      };

      saveTelegramLogsToLocal([newLog, ...telegramLogs]);
      notify("Database Backup harian berhasil di-push ke Server Telegram API!", "success");
    }, 1500);
  };

  // Local device PC Download for daily database backup
  const handleDownloadBackupLocal = () => {
    notify("Memulai pembentukan file cadangan JSON...", "info");

    const bundleData = {
      manifest: {
        appName: "Sistem Billing SLA NOC Nusantara",
        exportTime: new Date().toISOString(),
        author: "Finance & Networks Department",
        integrityKey: "MD5-NOCNET-SLA-GUARANTEE"
      },
      clients: clients,
      invoices: invoices,
      templates: templates
    };

    try {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(bundleData, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `noc_billing_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      notify("Sukses! File backup harian berhasil terunduh ke komputer Anda.", "success");
    } catch (e) {
      notify("Gagal mengunduh file JSON.", "error");
    }
  };

  const handleClearHistoryLogs = () => {
    saveTelegramLogsToLocal([]);
    notify("Log histori telegram dibersihkan.", "info");
  };

  return (
    <div className="space-y-6" id="integration-container">
      {/* View Header with Sub-tabs segment switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs" id="int-hdr">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" id="int-title">Sistem Integrasi Gateway</h1>
          <p className="text-sm text-slate-500" id="int-subtitle">
            Integrasikan billing & SLA monitoring dengan media platform WhatsApp, SMTP Email Server, dan Telegram Bot API.
          </p>
        </div>

        {/* Tab Segment Switcher */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 w-full md:w-auto shrink-0 shadow-inner gap-1" id="integration-tab-rail">
          <button
            type="button"
            onClick={() => setActiveTabSegment("wa-email")}
            className={`flex-grow md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
              activeTabSegment === "wa-email"
                ? "bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-sm font-extrabold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 font-semibold"
            }`}
          >
            💬 WhatsApp & Email Relay
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTabSegment("telegram")}
            className={`flex-grow md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
              activeTabSegment === "telegram"
                ? "bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-sm font-extrabold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 font-semibold"
            }`}
          >
            ✈ Telegram Bot & Backup
          </button>

          <button
            type="button"
            onClick={() => setActiveTabSegment("whatsapp-bot")}
            className={`flex-grow md:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
              activeTabSegment === "whatsapp-bot"
                ? "bg-white dark:bg-[#111827] text-[#128c7e] shadow-sm font-extrabold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250 font-semibold"
            }`}
          >
            🤖 WhatsApp Multi-Admin
          </button>
        </div>
      </div>

      {activeTabSegment === "telegram" ? (
        // ===============================================
        // NEW FEATURE: TELEGRAM BOT & ARCHIVE BACKUP TAB
        // ===============================================
        <div className="space-y-6" id="telegram-tab-view animate-in fade-in duration-300">
          
          {/* Simulation Header alert */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="telegram-gateway-banner">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#0088cc] font-bold block leading-none mb-1.5">Telegram API Gateway Ready</span>
              <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-[#0088cc] fill-[#0088cc]/20" /> Integrasi Bot Telegram & Backup Database Harian
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Platform menyediakan otomasi push-backup database harian yang aman ke chat internal tim, serta sinkronisasi bot pintar untuk meneruskan status anomali latensi router dan rekomendasi isolir pelanggan bermasalah secara langsung.
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Webhook: Online
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="telegram-view-grid">
            
            {/* LEFT SIDE: Configuration & Backup Module */}
            <div className="lg:col-span-5 space-y-6" id="telegram-left-col">
              
              {/* Card 1: Telegram Gateway Config */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4" id="tg-config-card">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3" id="tg-config-header">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Atur Kredensial Bot Telegram</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Token Bot Telegram:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="botXXXXXXXXX:AAEg..."
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-blue-500 text-slate-700 font-semibold"
                        id="tg-token-input"
                      />
                      <span className="absolute right-3 top-2.5 text-[9px] text-[#0088cc] font-mono px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded font-bold">API KEY</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      ID Chat Target (Channel / Group / User):
                    </label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="misal: -1002049581735"
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:outline-blue-500 text-slate-700 font-bold"
                      id="tg-chat-id-input"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      💡 Gunakan ID berawalan minus (<code className="font-mono bg-slate-100 p-0.5 rounded text-blue-600">-100...</code>) untuk group/channel resmi pemantauan NOC.
                    </span>
                  </div>

                  {/* Toggle configuration checkboxes */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-500" /> Auto-Backup Harian Aktif
                      </label>
                      <input
                        type="checkbox"
                        checked={isTelegramConnected}
                        onChange={(e) => setIsTelegramConnected(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        id="tg-auto-backup"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-rose-500" /> Teruskan Alarm SLA Otomatis
                      </label>
                      <input
                        type="checkbox"
                        checked={autoForwardAlerts}
                        onChange={(e) => setAutoForwardAlerts(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        id="tg-auto-forward"
                      />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleTestBotConnection}
                      disabled={isTestLoading}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      {isTestLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Test Ping...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white text-white" /> Test Ping Bot
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        notify("Konfigurasi API Bot berhasil disimpan ke system!", "success");
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Simpan Token
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Daily Database Backup Core */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4" id="database-backup-card">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Otomasi Backup Harian</h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">ACTIVE</span>
                </div>

                <div className="text-xs text-slate-500 space-y-3.5 leading-relaxed">
                  <p>
                    Data tagihan pelanggan, rincian bandwidth SLA, dan logs kas harian akan dikompresi menjadi file json terenkripsi dan diposting terjadwal ke server backup.
                  </p>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase">
                      Pilih Interval Jam Schedule Backup:
                    </label>
                    <select
                      value={backupScheduleTime}
                      onChange={(e) => {
                        setBackupScheduleTime(e.target.value);
                        notify(`Jadwal backup otomatis diubah: Setiap hari jam ${e.target.value}.`, "info");
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-blue-500 cursor-pointer"
                    >
                      <option value="00:00 WIB">🌌 Setiap Hari Jam 00:00 WIB (Tengah Malam)</option>
                      <option value="03:00 WIB">🌌 Setiap Hari Jam 03:00 WIB (Rekomendasi Beban Traffic Rendah)</option>
                      <option value="06:00 WITA">🌅 Setiap Hari Jam 06:00 WITA (Pagi Hari)</option>
                      <option value="12:00 WIB">☀️ Setiap Hari Jam 12:00 WIB (Siang Hari)</option>
                    </select>
                  </div>

                  {/* Simulated Trigger block */}
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-emerald-950 font-sans">Simulasi Manual Backup:</span>
                      <span className="text-[9.5px] text-emerald-800 font-mono">DB Size: ~{(JSON.stringify({clients, invoices}).length / 1024).toFixed(2)} KB</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {/* Sub button 1: Local PC Download */}
                      <button
                        type="button"
                        onClick={handleDownloadBackupLocal}
                        className="py-1.5 bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg cursor-pointer transition-all inline-flex items-center justify-center gap-1 shadow-xs"
                      >
                        <FolderDown className="w-3.5 h-3.5" /> Unduh .JSON PC
                      </button>

                      {/* Sub button 2: Send directly to Telegram */}
                      <button
                        type="button"
                        onClick={handleSendBackupToTelegram}
                        disabled={isBackupLoading}
                        className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-all inline-flex items-center justify-center gap-1 shadow-xs font-sans text-xs"
                      >
                        {isBackupLoading ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3 h-3" /> Push Telegram
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RESTORE DATABASE AREA */}
                  <div className="border-t border-dashed border-slate-250 pt-3.5 space-y-3">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-extrabold text-slate-800 uppercase block">Unggah Cadangan (Restore Database)</span>
                      <span className="text-[10px] text-slate-400 block leading-normal">
                        Kembalikan status database dari file .JSON yang telah diunduh sebelumnya.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="py-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs w-full justify-center">
                        <UploadCloud className="w-4 h-4" /> Pilih File Backup JSON
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleSystemUploadRestore}
                          className="hidden"
                          id="db-restore-file-input"
                        />
                      </label>
                    </div>

                    {showRestoreConfirm && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-2 animate-in fade-in duration-200" id="restore-confirm-inline">
                        <p className="font-extrabold text-amber-950 flex items-center gap-1">⚠️ KONFIRMASI RESTORE:</p>
                        <p className="leading-relaxed">Apakah Anda yakin ingin mengganti seluruh database Klien, Invoice, dan Kas saat ini dengan data dari file cadangan ini?</p>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (onRestoreData) {
                                onRestoreData(showRestoreConfirm);
                                notify("Database Klien & SLA sukses dipulihkan dari file JSON!", "success");
                              }
                              setShowRestoreConfirm(null);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded cursor-pointer text-[10.5px]"
                          >
                            Ya, Overwrite Data
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRestoreConfirm(null)}
                            className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded font-bold cursor-pointer text-[10.5px]"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* RIGHT SIDE: SLA Alerts & System Recommendation Feed */}
            <div className="lg:col-span-7 space-y-6" id="telegram-right-col">
              
              {/* Recommendations Forwarding container */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4" id="sla-bot-recommendations">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="rec-hdr-wrap">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4.5 h-4.5 text-rose-500 animate-bounce" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                      Instan Alert & Rekomendasi di Bot Telegram
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDispatched}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                    title="Ulangi simulasi pengiriman notifikasi rekomendasi ke bot"
                  >
                    Reset Status Kirim
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-normal font-sans">
                  Sistem deteksi anomali kami mengidentifikasi kondisi operasional dan merekomendasikan solusi di bawah. Anda dapat menguji dengan menekan tombol **"Kirim ke Telegram"** untuk melihat format pesan yang didorong ke channel.
                </p>

                {/* Grid items */}
                <div className="space-y-3" id="rec-feed-list">
                  {recommendations.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2.5 relative overflow-hidden ${
                        rec.level.startsWith("🔴")
                          ? "bg-rose-50/45 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/45 text-rose-900"
                          : rec.level.startsWith("🟡")
                          ? "bg-amber-50/45 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/45 text-amber-900"
                          : "bg-emerald-50/45 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/45 text-emerald-900"
                      }`}
                      id={`rec-item-${rec.id}`}
                    >
                      {/* Header block within card */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1" id="rec-item-hdr">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md font-mono ${
                          rec.level.startsWith("🔴") 
                            ? "bg-rose-100 dark:bg-rose-900/35 text-rose-700 dark:text-rose-300 border border-rose-200/50" 
                            : rec.level.startsWith("🟡")
                            ? "bg-amber-100 dark:bg-amber-900/35 text-amber-700 dark:text-amber-300 border border-amber-200/50"
                            : "bg-emerald-100 dark:bg-emerald-900/35 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50"
                        }`}>
                          {rec.level}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono font-semibold">Ready to forward</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">{rec.title}</h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed font-sans">{rec.message}</p>
                      </div>

                      {/* Transmit action */}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/40" id="rec-item-action-row">
                        <span className="text-[10px] text-slate-400 font-mono">Bot Endpoint: Telegram API</span>
                        
                        {rec.isDispatched ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <ShieldCheck className="w-3.5 h-3.5" /> Terkirim ke Telegram
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDispatchRecommendation(rec.id)}
                            className="text-[11px] bg-slate-950 hover:bg-slate-800 text-white font-bold py-1 px-3 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          >
                            <Send className="w-3 h-3 text-sky-400" /> Kirim Alert Bot
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bot Audit Logging History */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3" id="telegram-logging-ledger animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-slate-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                      Logs Histori Pengiriman Bot & Backup
                    </h3>
                  </div>
                  {telegramLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistoryLogs}
                      className="text-[9.5px] font-bold text-slate-400 hover:text-rose-500 uppercase transition-colors"
                      id="btn-clear-tg-logs"
                    >
                      Bereskan Riwayat
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto min-h-36 max-h-56 scrollbar-thin" id="tg-logs-scroller">
                  {telegramLogs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium italic">
                      Tidak ada logs aktivitas pengiriman bot telegram.
                    </div>
                  ) : (
                    <table className="w-full text-left text-[11px]" id="tg-logs-table">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-widest text-[9.5px]">
                          <th className="py-2 pr-2 font-bold select-none">Waktu</th>
                          <th className="py-2 px-2 font-bold select-none">Kategori</th>
                          <th className="py-2 px-2 font-bold select-none">Detail File / Rekomendasi</th>
                          <th className="py-2 px-2 font-bold select-none">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-600 font-sans">
                        {telegramLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/70" id={`tg-log-row-${log.id}`}>
                            <td className="py-2 pr-2 font-mono whitespace-nowrap text-slate-500 text-[10px]">{log.timestamp}</td>
                            <td className="py-2 px-2 whitespace-nowrap">
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                log.type === "Backup Database" 
                                  ? "bg-slate-100 text-slate-800" 
                                  : log.type === "SLA Recommendation"
                                  ? "bg-blue-100 text-blue-800"
                                  : log.type === "Ping Test"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="py-2 px-2 font-medium max-w-xs truncate" title={log.detail}>
                              {log.detail}
                              <div className="text-[9px] text-slate-400 font-mono">Ke: {log.destination}</div>
                            </td>
                            <td className="py-2 px-2 text-right whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[9px] font-bold rounded-full">
                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* INTERACTIVE TELEGRAM PHONE SIMULATOR CONSOLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4" id="telegram-bot-inline-buttons-simulator">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-extrabold bg-sky-400/10 px-2 py-0.5 rounded-md">LIVE INTERACTIVE CONTROL</span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
                  <Smartphone className="w-4 h-4 text-sky-400 animate-pulse" />
                  Visual Simulator Bot dengan Inline Keyboard
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed font-sans">
                Uji langsung semua menu bot Telegram di client simulator ini. Setiap tombol inline di bawah dapat diklik untuk memproses data riil Anda saat ini.
              </p>
            </div>

            <div className="max-w-2xl mx-auto bg-[#0e1621] rounded-2xl overflow-hidden border border-slate-800 shadow-xl" id="tg-phone-mockup">
              {/* Telegram App Header Bar */}
              <div className="bg-[#17212b] px-4 py-3 flex items-center justify-between border-b border-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center text-white font-extrabold text-sm shadow-sm font-mono">
                    NOC
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight font-sans">NOC Net Nusantara BillBot</h4>
                    <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1.5 font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> bot (online)
                    </span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-950/30 px-2.5 py-1 rounded-md">
                  WEBHOOK PORT: 3000
                </div>
              </div>

              {/* Chat bubble body container */}
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto scrollbar-thin flex flex-col pt-6 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0e1621] to-[#0e1621]" id="tg-chat-box">
                {simulatedChat.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"}`}
                  >
                    {/* Timestamp / Name tag */}
                    <div className="text-[9px] text-slate-500 mb-1 font-mono">{msg.sender === "user" ? "Anda" : "NOC BillBot"} • {msg.timestamp}</div>

                    {/* Bubble body content */}
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[#2b5278] text-white rounded-tr-none"
                          : "bg-[#182533] text-slate-200 rounded-tl-none border border-slate-800/50 font-mono"
                      }`}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {msg.text}
                    </div>

                    {/* Inline Button Row */}
                    {msg.sender === "bot" && msg.inlineButtons && msg.inlineButtons.length > 0 && (
                      <div className="mt-2.5 grid grid-cols-2 gap-2.5 w-full select-none" id="inline-keyboard">
                        {msg.inlineButtons.map((btn: any) => (
                          <button
                            key={btn.callbackId}
                            type="button"
                            onClick={() => handleBotCallback(btn.callbackId, btn.text)}
                            className="w-full text-[10.5px] font-bold py-2 px-3 bg-[#17212b] hover:bg-[#24303f] active:scale-95 border border-[#2b394a] hover:border-sky-500 text-sky-400 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500/20"></span>
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {botIsTyping && (
                  <div className="self-start flex flex-col items-start max-w-[85%]" id="bot-typing">
                    <div className="text-[9px] text-slate-500 mb-1 font-mono">NOC BillBot sedang mengetik...</div>
                    <div className="p-3 bg-[#182533] text-slate-400 font-bold tracking-wider rounded-2xl rounded-tl-none animate-pulse text-xs flex items-center gap-1.5 font-sans">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      Mengeksekusi perintah database...
                    </div>
                  </div>
                )}
              </div>

              {/* Bot Bottom input panel bar */}
              <div className="bg-[#17212b] p-3 flex items-center justify-between border-t border-slate-950 text-slate-400 text-xs">
                <span className="shrink-0 text-slate-500 font-mono text-[10px]">[/] Command Menu</span>
                <div className="flex-1 bg-slate-950/40 py-2 px-3 mx-2 rounded-xl border border-slate-800 text-[11px] text-slate-500 select-none">
                  Gunakan inline markup button di atas untuk interaksi langsung
                </div>
                <Send className="w-4 h-4 text-slate-600 rotate-45 shrink-0" />
              </div>
            </div>
          </div>

        </div>
      ) : activeTabSegment === "whatsapp-bot" ? (
        // ===============================================
        // NEW FEATURE: WHATSAPP SMART BOT SIMULATOR WITH MULTI-ADMINS
        // ===============================================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300" id="wa-bot-simulation-view">
          {/* LEFT COLUMN: Manage Multi-Admin numbers & Dispatch alert messages (5 columns) */}
          <div className="lg:col-span-5 space-y-6" id="wa-bot-left-col">
            
            {/* Box 1: Multi-Admin Number Registry */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4" id="wa-admin-registry-card">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3" id="wa-admin-reg-hdr">
                <Users className="w-4 h-4 text-[#128c7e]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Multi-Admin WhatsApp Bot</h3>
              </div>
              
              <div className="text-xs text-slate-500 space-y-3" id="wa-admin-reg-body">
                <p className="leading-relaxed">
                  Daftarkan nomor telepon tim NOC Anda di sini. Hanya nomor terdaftar dalam sistem Multi-Admin yang memiliki izin akses query data sensitif melalui chatbot WhatsApp Anda.
                </p>

                {/* Form to add number */}
                <form onSubmit={handleAddAdminPhone} className="flex gap-2" id="wa-add-admin-form">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-450 font-bold text-xs">+</span>
                    <input
                      type="text"
                      placeholder="628123456789"
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs pl-5 pr-2 py-2 border border-slate-200 rounded-lg focus:outline-blue-500 font-bold bg-white"
                      id="inp-new-admin"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-[#128c7e] hover:bg-[#075e54] text-white text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0 inline-flex items-center gap-1"
                    id="btn-add-admin"
                  >
                    Tambah Admin
                  </button>
                </form>

                {/* Current Admin Contacts List */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3" id="wa-admin-list-sect">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase">Daftar Admin Aktif:</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1" id="wa-admin-scroll-box">
                    {whatsappAdminPhones.map((phone) => (
                      <div key={phone} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-150 rounded-lg text-xs" id={`admin-row-${phone}`}>
                        <span className="font-mono font-bold text-slate-800">+{phone}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full uppercase scale-90">Authorized</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdminPhone(phone)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer inline-flex"
                            title="Hapus Izin Admin"
                            id={`btn-del-admin-${phone}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Box 2: Broadcast Alert NOC Tim ke Grup Telegram */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4" id="telegram-broadcast-alert-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="tg-broad-hdr">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-rose-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-sans">Kirim Broadcast ke Grup Telegram</h3>
                </div>
                <span className="text-[9.5px] font-mono bg-rose-50 text-rose-700 border border-rose-100 font-bold py-0.5 px-2 rounded-full uppercase">TIM NOC ALERT</span>
              </div>

              <form onSubmit={handleTelegramBroadcastSubmit} className="space-y-4 text-xs" id="tg-broad-form">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Grup Tujuan Telegram:
                  </label>
                  <input
                    type="text"
                    value={telegramBroadcastGroup}
                    onChange={(e) => setTelegramBroadcastGroup(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-blue-500 font-bold"
                    placeholder="misal: #NOC-NUSANTARA-ALERTS"
                    required
                    id="inp-tg-group"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pesan Gangguan / Alerts Terdeteksi NOC:
                  </label>
                  <textarea
                    rows={3}
                    value={telegramBroadcastText}
                    onChange={(e) => setTelegramBroadcastText(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-blue-500 font-sans"
                    placeholder="Koperatif: Terjadi gangguan link FO ruas Malang-Surabaya rtt spike..."
                    required
                    id="inp-tg-msg-text"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isTelegramBroadcasting}
                  className="w-full h-9 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all inline-flex items-center justify-center gap-1.5 shadow-sm"
                  id="btn-send-tg-broad"
                >
                  <Send className="w-3.5 h-3.5 text-white" /> {isTelegramBroadcasting ? "Mendistribusikan Pesan..." : "Kirim Broadcast ke Grup Telegram"}
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT COLUMN: WhatsApp Chatbot Simulator Screen (7 columns) */}
          <div className="lg:col-span-7" id="wa-bot-right-col">
            <div className="bg-[#e5ddd5] rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col h-[525px]" id="phone-wa-body">
              
              {/* Green WhatsApp Header */}
              <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shrink-0" id="phone-wa-header">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 border border-slate-50/20 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    WA
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide">NOC BillBot • Multi-Admin Bot</h3>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block animate-pulse"></span>
                      <span className="text-[10px] text-emerald-200 font-semibold uppercase">API Online v2.1</span>
                    </div>
                  </div>
                </div>
                
                {/* Active Simulated Number Indicator */}
                <div className="text-[10px] font-mono text-emerald-100 bg-[#128c7e] px-2.5 py-1 rounded-md border border-emerald-500/30">
                  tim-noc@wa-server
                </div>
              </div>

              {/* Chat Log Viewport Panel */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 flex flex-col justify-end" id="wa-messages-viewport">
                <div className="my-1.5 self-center bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 text-amber-900 dark:text-amber-300 text-[10.5px] px-3.5 py-1.5 rounded-lg text-center font-semibold leading-relaxed max-w-sm">
                  🔒 Chat terenkripsi end-to-end. Bot ini merespon query parameter dari daftar admin resmi di panel kiri.
                </div>

                <div className="flex-1 flex flex-col justify-end space-y-3">
                  {whatsappChat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-xs transition-transform ${
                        msg.sender === "user"
                          ? "self-end bg-[#dcf8c6] border border-emerald-200 text-slate-950 rounded-tr-none"
                          : "self-start bg-white border border-slate-200 text-slate-900 rounded-tl-none whitespace-pre-wrap"
                      }`}
                      id={`msg-wa-${msg.id}`}
                    >
                      <p className="font-mono leading-relaxed">{msg.text}</p>
                      <div className="flex justify-end gap-1 mt-1 text-[9px] text-slate-450 text-right leading-none">
                        <span>{msg.timestamp}</span>
                        {msg.sender === "user" && <span className="text-sky-500 font-bold">✓✓</span>}
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator Bubble */}
                  {whatsappIsTyping && (
                    <div className="self-start bg-white border border-slate-150 rounded-lg rounded-tl-none px-3.5 py-2 text-xs text-slate-500 flex items-center gap-1.5 animate-pulse max-w-xs shadow-xs">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#128c7e]" />
                      <span>Sistem Bot sedang menarik database...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Typing Panel */}
              <form onSubmit={handleWhatsappInputSubmit} className="bg-[#f0f0f0] p-3 border-t border-slate-300 flex gap-2 shrink-0" id="wa-chat-send-form">
                <input
                  type="text"
                  placeholder="Ketik command: !menu , !pelanggan , !invoice , !keuangan , atau !vps..."
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  className="flex-grow text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-[#075e54] text-slate-800"
                  id="inp-wa-chat"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#128c7e] hover:bg-[#075e54] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0 inline-flex items-center gap-1"
                  id="btn-wa-chat-send"
                >
                  Kirim <Send className="w-3 h-3 text-white" />
                </button>
              </form>

            </div>
          </div>
        </div>
      ) : (
        // ===============================================
        // PRESERVED ORIGINAL: WHATSAPP & EMAIL TEMPLATES VIEW
        // ===============================================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="integration-layout">
          
          {/* LEFT COLUMN: WhatsApp Linker scanner simulation - takes 5 cols */}
          <div className="lg:col-span-5 space-y-6" id="wa-link-col">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4" id="wa-link-card">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3" id="wa-link-hdr">
                <MessageSquare className="w-5 h-5 text-blue-600 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Gateway WhatsApp Broadcast</h2>
              </div>

              {/* Link state options */}
              {pairingProgress === "none" && (
                <form onSubmit={handleStartLinking} className="space-y-3" id="wa-pair-form">
                  <p className="text-xs text-slate-500 leading-normal font-sans">
                    Sistem pembuat invoice berintegrasi dengan robot pengirim Whatsapp instan. Autentikasi nomor HP Anda sekarang untuk memulai penyiapan gateway otomatis.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Nomor Handphone WhatsApp:</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="misal: 081234567890"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-blue-500 font-bold"
                      required
                      id="inp-wa-phone"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-xs rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                    id="btn-trigger-pair"
                  >
                    <QrCode className="w-4 h-4" /> Mulai Sinkronisasi QR
                  </button>
                </form>
              )}

              {/* Initializing Spinner */}
              {pairingProgress === "initializing" && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3" id="wa-initializing-spinner">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs font-bold text-blue-950 font-sans">Generating QR Code dari WebSocket session...</p>
                  <p className="text-[10px] text-slate-400">Harap tunggu sekitar 2 detik.</p>
                </div>
              )}

              {/* QR Ready Scan screen */}
              {pairingProgress === "ready" && (
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-3" id="wa-scan-panel">
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-bold uppercase py-0.5 px-2 rounded-full">Menolak Timeout Sesi QR</span>
                  
                  {/* QR Code Container Simulation with animated overlay scanline */}
                  <div className="relative w-44 h-44 bg-white p-2 border border-slate-200 rounded-xl shadow-inner flex items-center justify-center overflow-hidden">
                    {/* Scan bar line */}
                    <div className="absolute left-1/2 -translate-x-1/2 w-full h-[2px] bg-blue-500 shadow-md animate-[bounce_3s_infinite]" id="scanning-laser-line"></div>
                    
                    {/* Actual QR SVG */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="opacity-80">
                      <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                      <rect x="5" y="5" width="22" height="22" fill="#030" stroke="#000" strokeWidth="2" />
                      <rect x="10" y="10" width="12" height="12" fill="#fff" />
                      <rect x="73" y="5" width="22" height="22" fill="#030" stroke="#000" strokeWidth="2" />
                      <rect x="78" y="10" width="12" height="12" fill="#fff" />
                      <rect x="5" y="73" width="22" height="22" fill="#030" stroke="#000" strokeWidth="2" />
                      <rect x="10" y="78" width="12" height="12" fill="#fff" />

                      {/* QR Blocks */}
                      <rect x="35" y="10" width="10" height="20" fill="#000" />
                      <rect x="55" y="8" width="15" height="12" fill="#000" />
                      <rect x="40" y="35" width="20" height="20" fill="#000" />
                      <rect x="15" y="45" width="12" height="18" fill="#000" />
                      <rect x="70" y="35" width="18" height="18" fill="#000" />
                      <rect x="35" y="70" width="25" height="15" fill="#000" />
                      <rect x="70" y="65" width="20" height="20" fill="#000" />
                      {/* Mock phone in the center */}
                      <rect x="44" y="44" width="12" height="12" fill="#1e3a8a" rx="2" />
                    </svg>
                  </div>

                  <div className="text-xs space-y-1.5" id="scan-instructions-meta">
                    <p className="font-semibold text-slate-800">Pindai QR Code di Atas</p>
                    <p className="text-[11px] text-slate-400 font-sans">Buka WhatsApp Link Device di HP, arahkan kamera ke bar screen ini.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmPairing}
                    className="px-5 py-2 w-full bg-slate-900 border border-slate-950 hover:bg-slate-950 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    id="btn-simulate-scanned"
                  >
                    ✓ Konfirmasi Scan Sukses (Simulasi Terhubung)
                  </button>
                </div>
              )}

              {/* Connecting Spinner */}
              {pairingProgress === "connecting" && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3" id="wa-loading">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-xs font-bold text-blue-900 font-sans">Menyelaraskan Sesi WA Web...</p>
                  <p className="text-[10px] text-slate-400 font-sans">Menyalin cache kontak client terdaftar.</p>
                </div>
              )}

              {/* WA pairing COMPLETED */}
              {pairingProgress === "completed" && (
                <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-xl space-y-4" id="wa-paired-status">
                  <div className="flex items-center gap-2.5" id="paired-hdr">
                    <CheckCircle2 className="w-8 h-8 text-blue-600 shrink-0" />
                    <div>
                      <h3 className="text-xs font-bold text-blue-950 font-sans">Sesi Terhubung Aktif (SLA OK)</h3>
                      <p className="text-[10px] font-mono text-blue-700 font-semibold">Link No: {phoneNumber}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-blue-900 space-y-1 bg-white border border-blue-100 p-3 rounded-lg font-mono leading-relaxed font-semibold" id="paired-meta-ledger font-semibold">
                    <div>📱 Perangkat HP : WhatsApp Web (Node-V3 API)</div>
                    <div>📡 Gateway Port : Run Container localhost:3000</div>
                    <div>🔋 Level Baterai: 92% | Sinyal: Kuat (Wifi)</div>
                    <div>⚡ Heartbeat    : Live pinged OK 0.1ms</div>
                  </div>

                  {showDisconnectConfirm ? (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3 rounded-lg space-y-2 mt-2 font-sans">
                      <p className="text-[11px] text-rose-800 dark:text-rose-300 font-bold">Apakah Anda yakin ingin memutuskan sinkronisasi WhatsApp server?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSetWhatsappConnected(false);
                            setPairingProgress("none");
                            setPhoneNumber("");
                            setShowDisconnectConfirm(false);
                            notify("WhatsApp gateway berhasil diputuskan.", "success");
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] cursor-pointer"
                        >
                          Ya, Putuskan
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDisconnectConfirm(false)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold text-[10px] cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="w-full py-1.5 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      id="btn-disconnect-wa"
                    >
                      Putuskan Hubungan HP
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs" id="email-server-info">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3" id="email-hdr">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sistem Email SMTP Relay</h3>
              </div>
              <p className="text-xs text-slate-500 leading-normal mb-3 font-sans" id="email-desc">
                Semua link portal template email secara bawaan akan dikirim melalui SMTP internal relay terenkripsi SSL. Status server: <span className="text-emerald-600 font-bold">ONLINE</span>.
              </p>
              <div className="bg-slate-50 p-2.5 rounded text-[10px] text-slate-500 font-mono space-y-0.5 font-semibold">
                <div>⚙ Port SMTP: 465 (SSL)</div>
                <div>⚡ Host Relay: smtp.nocmonitor.net.id</div>
                <div>🔒 Enkripsi  : TLS V1.3 Enabled</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Templat Editor - takes 7 cols */}
          <div className="lg:col-span-7 space-y-6" id="template-editor-col">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4" id="tpl-editor-card">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3" id="tpl-editor-hdr">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Modifikasi Templat Pengiriman</h2>
                </div>
                
                {/* Select layout */}
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="text-xs border border-slate-150 rounded px-2.5 py-1 bg-slate-50 text-slate-700 font-bold focus:outline-blue-500"
                  id="select-active-editor-tpl"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.channel === "whatsapp" ? "💬 WA" : "✉ Email"} - {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentTemplate && (
                <div className="space-y-4" id="active-tpl-form">
                  
                  {/* Email Subject block (visible only for Email templates) */}
                  {currentTemplate.channel === "email" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-tpl-subj">Subjek Surat/Email:</label>
                      <input
                        type="text"
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-blue-500 font-semibold"
                        id="inp-tpl-subj"
                      />
                    </div>
                  )}

                  {/* Main Content editable area */}
                  <div>
                    <div className="flex justify-between items-center mb-1" id="tpl-text-hdr">
                      <label className="text-xs font-semibold text-slate-500" id="lbl-tpl-body">Inti Konten Narasi (Mendukung Dynamic tags):</label>
                      <span className="text-[10px] text-slate-400 font-semibold">Tipe: {currentTemplate.channel.toUpperCase()}</span>
                    </div>
                    <textarea
                      rows={10}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-lg font-mono focus:outline-blue-500 leading-relaxed text-slate-700"
                      id="inp-tpl-body"
                    />
                  </div>

                  {/* Substitution help keys */}
                  <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-lg space-y-1.5" id="tpl-variables-cheatsheet font-sans">
                    <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold uppercase tracking-wider block" id="cheat-hdr">
                      <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Panduan Tag Variabel Dinamis</span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 leading-normal font-sans">
                      Salin tag berikut ke dalam kotak templat di atas. Sistem kami otomatis mengonversinya saat broadcast dikirim:
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-650 font-mono" id="cheat-grid">
                      <div><b className="text-slate-900 font-mono font-bold">{`{nama_klien}`}</b> : PIC Pelanggan</div>
                      <div><b className="text-slate-900 font-mono font-bold">{`{perusahaan_klien}`}</b> : Nama Instansi</div>
                      <div><b className="text-slate-900 font-mono font-bold">{`{no_invoice}`}</b> : ID Tagihan</div>
                      <div><b className="text-slate-900 font-mono font-bold">{`{jumlah_tagihan}`}</b> : Total Nominal</div>
                      <div><b className="text-slate-900 font-mono font-bold">{`{jatuh_tempo}`}</b> : Tenggat Tanggal</div>
                      <div><b className="text-slate-900 font-mono font-bold">{`{link_pembayaran}`}</b> : URL Bayar Instan</div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex justify-end gap-2 items-center" id="tpl-actions-row">
                    {saveSuccess && (
                       <span className="text-emerald-600 font-bold text-xs inline-flex items-center gap-1 animate-pulse font-sans" id="toast-success-save">
                         ✔ Templat berhasil disimpan!
                       </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-white text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 min-w-[200px] justify-center"
                      id="btn-save-tpl"
                    >
                      <Save className="w-4 h-4" /> Simpan Perubahan Templat
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SANDBOX LIVE RENDER PREVIEW: Only shown when WhatsApp tab is active to avoid cluttering Telegram view */}
      {activeTabSegment === "wa-email" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in" id="sandbox-preview-panel">
          <div className="p-4 bg-slate-950 text-white flex justify-between items-center" id="sandbox-hdr">
            <div className="flex items-center gap-2" id="sandbox-title">
              <Smartphone className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-xs uppercase font-bold tracking-widest font-sans">Sandbox Live Render Preview (Pratinjau Klien Nyata)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans font-semibold">
              Menggunakan sample: <b className="text-white">{sampleClient?.company || "Tanpa Client"}</b> | <b className="text-white">{sampleInvoice?.id || "Tanpa Invoice"}</b>
            </span>
          </div>

          <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6 pt-5" id="sandbox-preview-split">
            
            {/* Output 1: WhatsApp simulation bubble */}
            <div className="space-y-2" id="wa-preview-sandbox">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Visualisasi Hasil WhatsApp Chat</span>
              <div className="bg-emerald-800 text-[11px] rounded-2xl p-4 text-emerald-50 max-w-lg shadow-md font-sans leading-relaxed relative border border-emerald-950 whitespace-pre-wrap">
                {currentTemplate && currentTemplate.channel === "whatsapp" ? (
                  renderSandboxText(editedContent)
                ) : (
                  <div className="text-slate-400 font-bold italic text-center py-5 font-sans">
                    (Buka templat Whatsapp di daftar pilihan di atas untuk menampilkan gelembung chat WA di sini)
                  </div>
                )}
              </div>
            </div>

            {/* Output 2: Email simulation body */}
            <div className="space-y-2" id="email-preview-sandbox">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Visualisasi Hasil Email Draft Resmi</span>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 text-xs text-slate-700 max-w-lg font-sans relative overflow-hidden leading-relaxed">
                {currentTemplate && currentTemplate.channel === "email" ? (
                  <div className="space-y-3 font-sans">
                    <div className="border-b border-slate-100 pb-2 mb-2 font-semibold font-sans">
                      <div className="text-[10px] text-slate-400 font-sans">Dari: Billing & SLA Department &lt;billing@nocnet.id&gt;</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-sans">Kepada: {sampleClient?.email}</div>
                      <div className="text-[11px] text-slate-900 mt-1.5 font-bold font-sans">Subjek: {renderSandboxText(editedSubject)}</div>
                    </div>
                    <div className="whitespace-pre-wrap font-sans text-slate-650 leading-relaxed text-[11px]">
                      {renderSandboxText(editedContent)}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 font-bold italic text-center py-5 font-sans">
                    (Buka templat Email di daftar pilihan di atas untuk menampilkan pratinjau surat email di sini)
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
