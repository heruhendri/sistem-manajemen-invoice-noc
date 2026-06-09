import React, { useState, useMemo, useEffect } from "react";
import { Client, Invoice, BookkeepingRecord, BizProfile } from "../types";
import { 
  QrCode, 
  CreditCard, 
  CheckCircle, 
  RefreshCw, 
  AlertCircle, 
  Wifi, 
  User, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Check, 
  DollarSign, 
  ArrowRight,
  Sparkles,
  Inbox
} from "lucide-react";
import { formatIDR } from "../utils/exportFiles";
import TrafficMonitor from "./TrafficMonitor";

interface CustomerPortalViewProps {
  clients: Client[];
  invoices: Invoice[];
  onUpdateInvoiceStatus: (invoiceId: string, status: "Paid", method: "QRIS" | "Bank Transfer") => void;
  onAddBookkeeping: (record: BookkeepingRecord) => void;
  triggerToast?: (message: string, type?: "success" | "warning" | "error" | "info") => void;
  bizProfile?: BizProfile;
  onUpdateClient?: (client: Client) => void;
}

export default function CustomerPortalView({
  clients,
  invoices,
  onUpdateInvoiceStatus,
  onAddBookkeeping,
  triggerToast,
  bizProfile,
  onUpdateClient
}: CustomerPortalViewProps) {
  const notify = (msg: string, type: "success" | "warning" | "error" | "info" = "info") => {
    if (triggerToast) {
      triggerToast(msg, type);
    } else {
      alert(msg);
    }
  };
  // Simulator login states
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginInput, setLoginInput] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<Invoice | null>(null);
  
  // Enhanced security states: Lockout rate limiting, OTP Simulation steps
  const [customerFailedAttempts, setCustomerFailedAttempts] = useState<number>(0);
  const [customerLockoutTime, setCustomerLockoutTime] = useState<number>(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [pendingClient, setPendingClient] = useState<Client | null>(null);
  const [otpCode, setOtpCode] = useState<string>( "");
  const [activeOtpCode, setActiveOtpCode] = useState<string>("882255");
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

  // Multi countdown loops in Portal
  useEffect(() => {
    if (customerLockoutTime <= 0) return;
    const timer = setInterval(() => {
      setCustomerLockoutTime((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [customerLockoutTime]);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Payment dynamic states
  const [paymentStep, setPaymentStep] = useState<"idle" | "review" | "scanning" | "processing" | "success">("idle");
  const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "VA_MANDIRI" | "VA_BCA">("QRIS");
  const [reconciliationLog, setReconciliationLog] = useState<string[]>([]);
  const [activeCoreTab, setActiveCoreTab] = useState<"pppoe_active" | "pppoe_offline" | "hotspot">("pppoe_active");
  const [enableQuickDemo, setEnableQuickDemo] = useState<boolean>(() => {
    return localStorage.getItem("noc_portal_enable_quick_demo") !== "false";
  });

  // Find currently simulated client
  const simulatedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  const handleLogin = (e?: React.FormEvent, bypassValue?: string) => {
    if (e) e.preventDefault();
    if (customerLockoutTime > 0) {
      notify(`Sistem terkunci! Silakan tunggu ${customerLockoutTime} detik.`, "error");
      return;
    }

    const query = (bypassValue || loginInput).trim().toLowerCase();
    
    if (!query) {
      setLoginError("Silakan masukkan salah satu opsi data login Anda.");
      return;
    }

    const found = clients.find(c => {
      const matchId = c.id.toLowerCase() === query;
      const matchName = c.name?.toLowerCase().includes(query) || c.company?.toLowerCase().includes(query);
      const matchEmail = c.email?.toLowerCase().includes(query);
      
      const cleanInput = query.replace(/\D/g, "");
      const cleanPhone = c.phone?.replace(/\D/g, "") || "";
      const matchPhone = (cleanInput && cleanPhone.includes(cleanInput)) || c.phone?.toLowerCase().includes(query);

      return matchId || matchName || matchEmail || matchPhone;
    });

    if (found) {
      if (bizProfile?.otpAuthenticationEnabled === false) {
        setSelectedClientId(found.id);
        setIsLoggedIn(true);
        setLoginInput("");
        setLoginError("");
        notify(`Status Portal Aktif: Selamat datang kembali, ${found.company} (${found.name})`, "success");
        return;
      }

      // Transition to OTP verification factor stage
      setPendingClient(found);
      setIsVerifyingOtp(true);
      const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveOtpCode(randomCode);
      setOtpCountdown(30);
      setLoginError("");
      setOtpCode("");
      
      notify(`Gateway Otorisasi 2FA: Kode OTP baru dikirim ke WhatsApp/Email ${found.name || found.company}!`, "success");

      // Dispatch the verification SMS/WA code through our gateway endpoint
      const formattedMessage = `🔑 *VERIFIKASI OTP MULTI-FACTOR NOC*\n\nHalo *${found.name || "Klien NYA"}*,\n\nKode verifikasi rahasia Anda untuk masuk ke Portal Pelanggan NOC Nusantara adalah:\n\n👉 *${randomCode}*\n\nKode berlaku selama 5 menit. Harap jaga kerahasiaan sandi sekali pakai ini.\n\n_System security monitoring powered by NOC Nusantara_`;
      
      fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: found.phone || "081234567890",
          text: formattedMessage
        })
      })
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            console.log(`[OTP WhatsApp dispatched via ${result.mode || "gateway"}]: code ${randomCode}`);
          }
        })
        .catch(err => {
          console.warn("OTP Gateway delivery bypassed:", err.message);
        });
    } else {
      const nextAttempts = customerFailedAttempts + 1;
      setCustomerFailedAttempts(nextAttempts);
      if (nextAttempts >= 3) {
        setCustomerLockoutTime(30);
        setCustomerFailedAttempts(0);
        setLoginError("Percobaan gagal berulang! Sistem terkunci selama 30 detik untuk perlindungan data.");
        notify("Autentikasi gagal berulang. Portal dibekukan sementara.", "error");
      } else {
        setLoginError(`Identifikasi tidak ditemukan. Sisa toleransi percobaan: ${3 - nextAttempts}`);
        notify("Identifikasi pelanggan salah.", "error");
      }
    }
  };

  // Filter client's invoices
  const clientInvoices = useMemo(() => {
    if (!simulatedClient) return [];
    return invoices.filter(inv => inv.clientId === simulatedClient.id);
  }, [invoices, simulatedClient]);

  // Outstanding/Unpaid invoices
  const unpaidInvoices = useMemo(() => {
    return clientInvoices.filter(inv => inv.status === "Unpaid" || inv.status === "Overdue");
  }, [clientInvoices]);

  // Paid translation sums
  const totalPaidTransactions = useMemo(() => {
    return clientInvoices
      .filter(inv => inv.status === "Paid")
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [clientInvoices]);

  // Start payment checkout flow
  const handleInitiatePayment = (invoice: Invoice) => {
    setActiveInvoiceForPayment(invoice);
    setPaymentStep("review");
    setPaymentMethod("QRIS");
    setReconciliationLog([]);
  };

  // Generate dynamic unique QRIS code payload text including transaction details
  const dynamicQrisPayload = useMemo(() => {
    if (!activeInvoiceForPayment) return "";
    const basePayload = "00020101021226380010ID.CO.QRIS.WWW0118936000020000";
    const amountHex = (activeInvoiceForPayment.amount * 1.11).toFixed(0);
    return `${basePayload}10${activeInvoiceForPayment.id}${amountHex}5204481155026263045A95`;
  }, [activeInvoiceForPayment]);

  // Simulate gateway checkout webhook confirmation
  const handleSimulateWebhookNotification = () => {
    if (!activeInvoiceForPayment || !simulatedClient) return;

    setPaymentStep("processing");
    setReconciliationLog([
      "🔄 [GATEWAY API] Menerima request pemindaian QRIS...",
      "📡 [GATEWAY API] Mencari invoice terkait: ID " + activeInvoiceForPayment.id,
      "⚡ [WEBHOOK] Memvalidasi checksum PPN 11% & Corporate billing code...",
    ]);

    // Fast progress logs to make it look highly responsive and real-time
    setTimeout(() => {
      setReconciliationLog(prev => [
        ...prev,
        "🟢 [SUCCESS] Pembayaran Lunas diverifikasi oleh sistem m-Banking gateway.",
        "📡 [WEBHOOK] Mengirimkan callback aman (IP Whitelisted) -> App Port 3000.",
      ]);
    }, 700);

    setTimeout(() => {
      setReconciliationLog(prev => [
        ...prev,
        "📥 [DATABASE] Memperbarui status Invoice " + activeInvoiceForPayment.id + " ke Lunas.",
        "📊 [BUKU KAS] Mencatat kas masuk otomatis senilai " + formatIDR(activeInvoiceForPayment.amount) + " ke buku kas.",
      ]);

      // Trigger app mutations
      onUpdateInvoiceStatus(activeInvoiceForPayment.id, "Paid", paymentMethod === "QRIS" ? "QRIS" : "Bank Transfer");
      
      // Also record in bookkeeping
      const newBookkeepingEntry: BookkeepingRecord = {
        id: `INC-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split("T")[0],
        type: "Income",
        category: "Pendapatan Jasa NOC",
        invoiceId: activeInvoiceForPayment.id,
        description: `Pembayaran Auto-Portal Invoice #${activeInvoiceForPayment.id} (${simulatedClient.company}) via Portal ${paymentMethod}`,
        amount: activeInvoiceForPayment.amount
      };
      
      onAddBookkeeping(newBookkeepingEntry);
      setPaymentStep("success");
    }, 1800);
  };

  if (!isLoggedIn || !simulatedClient) {
    return (
      <div className="space-y-6" id="portal-login-view">
        {/* Top Banner Control Simulator info */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="portal-banner">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-extrabold block leading-none mb-1.5">Simulation Sandboxed Environment</span>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> Portal Pelanggan Mandiri (SLA Gateway)
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Simulasikan bagaimana klien Anda masuk ke portal, memeriksa tagihan SLA monitoring bulanan mereka, serta melakukan checkout instan dengan dynamic QRIS interaktif yang langsung terintegrasi dengan pembukuan real-time.
            </p>
          </div>
        </div>

        {/* Login Card Grid */}
        {isVerifyingOtp && pendingClient ? (
          <div className="max-w-md mx-auto bg-white dark:bg-[#111827] rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-5 animate-in fade-in zoom-in duration-300" id="otp-panel">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 flex items-center justify-center mx-auto text-lg font-extrabold shadow-xs">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[9px] font-mono font-extrabold text-[#2563eb] dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded border border-blue-100 inline-block">
                Two-Factor Security Verified
              </span>
              <h2 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wider">Verifikasi OTP SMS & WA</h2>
              <p className="text-xs text-slate-400 leading-normal font-medium">
                Sandi sekali pakai dikirim ke kontak terdaftar mitra <strong className="text-slate-800 dark:text-slate-200">{pendingClient.company}</strong> untuk perlindungan basis data tagihan SLA.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customerLockoutTime > 0) return;
                
                if (otpCode === activeOtpCode) {
                  setSelectedClientId(pendingClient.id);
                  setIsLoggedIn(true);
                  setIsVerifyingOtp(false);
                  setPendingClient(null);
                  setCustomerFailedAttempts(0);
                  setOtpCode("");
                  setLoginError("");
                  notify(`Verifikasi 2FA Sukses! Selamat datang kembali, ${pendingClient.company}.`, "success");
                } else {
                  const nextAttempts = customerFailedAttempts + 1;
                  setCustomerFailedAttempts(nextAttempts);
                  if (nextAttempts >= 3) {
                    setCustomerLockoutTime(30);
                    setCustomerFailedAttempts(0);
                    setIsVerifyingOtp(false);
                    setPendingClient(null);
                    setLoginError("Batas toleransi OTP terlampaui. Portal dikunci selama 30 detik untuk keamanan.");
                    notify("Gagal OTP berulang. Otorisasi sesi ditolak.", "error");
                  } else {
                    notify(`Kode OTP tidak sesuai! Sisa toleransi: ${3 - nextAttempts}`, "error");
                  }
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5 text-center">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">
                  Kode OTP 6-Digit
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full tracking-[1.58em] pl-[1.58em] font-mono text-center text-xl font-black py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>

              {/* Simulation instruction alert box */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60 rounded-xl leading-normal text-[10.5px] text-blue-700 dark:text-blue-300">
                <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5 leading-none">💬 SIMULATOR GATEWAY</span>
                Untuk simulasi pengetesan, masukkan OTP WhatsApp berikut: <strong className="font-mono text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 font-extrabold">{activeOtpCode}</strong>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsVerifyingOtp(false);
                    setPendingClient(null);
                    setOtpCode("");
                    setLoginError("");
                    notify("Sesi autentikasi dibatalkan.", "info");
                  }}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold uppercase tracking-wider text-[10px]"
                >
                  Verifikasi OTP
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={otpCountdown > 0}
                  onClick={() => {
                    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
                    setActiveOtpCode(randomCode);
                    setOtpCountdown(30);
                    notify("Kode verifikasi OTP baru telah dikirim!", "success");

                    // Resend the code via the API
                    const targetPhone = pendingClient?.phone || "081234567890";
                    const formattedMessage = `🔑 *VERIFIKASI OTP MULTI-FACTOR NOC*\n\nHalo *${pendingClient?.name || "Klien NYA"}*,\n\nKode verifikasi rahasia baru Anda untuk masuk ke Portal Pelanggan NOC Nusantara adalah:\n\n👉 *${randomCode}*\n\nKode berlaku selama 5 menit. Harap jaga kerahasiaan sandi sekali pakai ini.\n\n_System security monitoring powered by NOC Nusantara_`;
                    
                    fetch("/api/whatsapp/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        to: targetPhone,
                        text: formattedMessage
                      })
                    })
                      .then(res => res.json())
                      .then(result => {
                        if (result.success) {
                          console.log(`[OTP Resend Success via ${result.mode}]: code ${randomCode}`);
                        }
                      })
                      .catch(err => {
                        console.warn("OTP Gateway delivery bypassed:", err.message);
                      });
                  }}
                  className="text-[10px] text-blue-650 dark:text-blue-400 font-bold hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer bg-transparent border-0"
                >
                  Kirim Ulang OTP {otpCountdown > 0 ? `(${otpCountdown}s)` : ""}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white dark:bg-[#111827] rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-5" id="login-panel">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-lg font-extrabold shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wider">Login Portal Layanan</h2>
              <p className="text-xs text-slate-400 font-medium">Masuk secara instan menggunakan data yang terdaftar di sistem.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {loginError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-350 border border-red-100 dark:border-red-900/60 font-semibold" id="login-err-msg">
                  ⚠ {loginError}
                </div>
              )}

              {customerLockoutTime > 0 ? (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-rose-700 dark:text-rose-455 rounded-xl font-bold font-mono text-center mb-2">
                  🔒 PORTAL TERKUNCI • {customerLockoutTime}s COOLDOWN
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Data Identifikasi Pelanggan
                    </label>
                    <input
                      type="text"
                      required
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder="No HP, Nama Klien, ID Pelanggan atau Email..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-805 rounded-lg text-slate-900 dark:text-white font-semibold focus:outline-blue-500 text-xs"
                      id="login-field-input"
                    />
                    <span className="text-[10px] text-slate-400 block leading-relaxed mt-1">
                      💡 Anda bisa memasukkan salah satu info berikut:<br />
                      - **No HP** (misalnya: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-normal text-rose-500 font-mono">0812</code>)<br />
                      - **Nama Klien** (misalnya: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-normal text-blue-500">Aero</code> atau <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-normal text-blue-500">Satelindo</code>)<br />
                      - **ID Pelanggan** (misalnya: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-normal text-emerald-500 font-mono">CLI-102</code>)<br />
                      - **Email** (misalnya: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-normal text-purple-500">finance@</code>)
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    id="submit-portal-login"
                  >
                    {bizProfile?.otpAuthenticationEnabled === false 
                      ? "Masuk Ke Portal Instan" 
                      : "Minta Kode Keamanan OTP"
                    }
                  </button>
                </>
              )}
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="customer-portal-view">
      
      {/* Top Banner Control Simulator info */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="portal-banner">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-extrabold block leading-none mb-1.5 font-mono">Simulation Sandboxed Environment</span>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" /> Portal Pelanggan Mandiri (SLA Gateway)
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Sesi portal pelanggan Anda aktif. Di sini pelanggan dapat mengontrol tagihan, melihat latency SLA jaringan, dan membayar via dynamic QRIS.
          </p>
        </div>

        {/* Dynamic authenticated session display with logout */}
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg w-full md:w-auto shrink-0 flex items-center justify-between gap-4 font-sans text-xs">
          <div className="space-y-0.5">
            <span className="block text-[9px] font-extrabold text-blue-400 uppercase tracking-widest font-mono">Pelanggan Aktif:</span>
            <p className="text-xs font-bold text-white max-w-[150px] truncate">{simulatedClient.company}</p>
          </div>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              setSelectedClientId("");
              setActiveInvoiceForPayment(null);
              setPaymentStep("idle");
              notify("Keluar dari Sesi Portal Klien sukses.", "info");
            }}
            className="text-[11px] font-extrabold bg-rose-600 hover:bg-rose-700 text-white border-transparent px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            Selesai / Logout
          </button>
        </div>
      </div>

      {simulatedClient ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="portal-core-grid">
          
          {/* LEFT COLUMN: Client Card Profile & SLA Coverage Details (5 cols) */}
          <div className="lg:col-span-5 space-y-5" id="portal-left-col">
            
            {/* SLA Coverage Overview */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden" id="portal-client-profile-card">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Informasi Layanan Aktif</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full block animate-ping"></span>
                  Link SLA Live
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Brand Title block representing client */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-snug">{simulatedClient.company}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">PIC: {simulatedClient.name}</p>
                  </div>
                </div>

                {/* Subscribed Plan highlight */}
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block font-mono">Tingkatan Kontrak SLA</span>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">{simulatedClient.serviceType}</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">{formatIDR(simulatedClient.monthlyFee)}/bln</span>
                  </div>
                </div>

                {/* Detailed contact lists */}
                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email Utama:</span>
                    <span className="font-semibold text-slate-800">{simulatedClient.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. WhatsApp:</span>
                    <span className="font-semibold text-slate-800 font-mono">{simulatedClient.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Preferensi Kontak:</span>
                    <span className="font-semibold text-slate-800 uppercase text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                      {simulatedClient.communicationPreference === "whatsapp" ? "💬 WhatsApp" : "📧 Email (Relay)"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1.5">
                    <span className="text-slate-400">Alamat Pemasangan Jaringan / Office:</span>
                    <span className="text-slate-700 italic leading-relaxed text-[11px]">
                      {simulatedClient.address || "Belum diisi oleh administrator."}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special NOC Monitoring instructions instructions */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-2" id="portal-noc-notes">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-150">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Catatan Tim NOC (SLA Rules)</h3>
              </div>
              <p className="text-[11.5px] text-slate-500 leading-normal italic">
                "{simulatedClient.nocNotes || "Tidak ada rincian latency khusus. Layanan dipantau 24x7 standar sesuai panduan SLA global."}"
              </p>
            </div>

            {/* Simulated Live Customer Router Diagnostik Panel */}
            {(() => {
              const companySlug = simulatedClient.company.toLowerCase().replace(/[^a-z0-9]/g, "");
              const secretCount = simulatedClient.mtPppoeSecretCount || 10;
              const activeCount = simulatedClient.mtActivePppoeCount || 6;
              const offlineCount = Math.max(0, secretCount - activeCount);
              const hotspotCount = simulatedClient.mtActiveHotspotCount || 4;
 
              // Create simulated secrets
              const secrets = Array.from({ length: secretCount }).map((_, index) => {
                const isOnline = index < activeCount;
                return {
                  username: `${companySlug}_user_${index + 1}`,
                  service: "pppoe",
                  profile: index % 2 === 0 ? "SLA_Premium_50M" : "SLA_Standard_20M",
                  uptime: isOnline ? `${index + 2}j ${(index * 8) % 60}m 15d` : "-",
                  ipAddress: `10.50.${10 + (simulatedClient.id === "1" ? 1 : 2) * 5}.${100 + index}`,
                  mac: `00:0C:42:F1:C${index}:${10 + index}`,
                  status: isOnline ? "Active" : "Offline",
                  lastOof: isOnline ? "-" : `${index + 1} hari lalu`
                };
              });
 
              const hotspots = Array.from({ length: hotspotCount }).map((_, index) => {
                return {
                  username: `hs_guest_${index + 1}`,
                  ipAddress: `192.168.88.${50 + index}`,
                  mac: `B4:75:0E:C8:42:0${index}`,
                  uptime: `${index * 15 + 4}m 22s`,
                  bytesIn: `${((index + 1) * 3.4).toFixed(1)} MB`,
                  bytesOut: `${((index + 1) * 11.2).toFixed(1)} MB`
                };
              });
 
              return (
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-sans" id="portal-mikrotik-diagnostics">
                  {/* Brand & IP header */}
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                       <div>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Status Koneksi Core</span>
                         <h4 className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1">
                           🌐 Host IP: {simulatedClient.mikrotikIp || "10.50.24.15 (Simulasi)"}
                         </h4>
                       </div>
                    </div>
                    <span className="text-[9px] bg-indigo-500/15 text-indigo-300 font-extrabold px-2 py-0.5 rounded border border-indigo-500/25 uppercase tracking-wide">
                      {simulatedClient.mikrotikIp ? "Router Terhubung" : "Mode Simulasi Aktif"}
                    </span>
                  </div>

                  {/* Simulated Hardware Ports layout */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8.5px] font-mono text-slate-500 font-bold uppercase tracking-wider">🖥 Panel Port Routerboard</span>
                      <span className="text-[8.5px] font-mono text-indigo-400">Model: CCR-1009-8G</span>
                    </div>

                    {/* RJ45 Port mockups and blinking LEDs */}
                    <div className="grid grid-cols-6 gap-1 pt-1">
                      {/* Port 1 - WAN */}
                      <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center justify-between h-11 relative">
                        <span className="text-[7px] text-slate-500 font-mono">P1 (WAN)</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-1 right-1"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1"></div>
                        <span className="text-[6.5px] font-bold text-emerald-400">1 Gbps</span>
                      </div>

                      {/* Port 2 - PPPoE Active */}
                      <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center justify-between h-11 relative">
                        <span className="text-[7px] text-slate-500 font-mono">P2 (PPPoE)</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-555 bg-emerald-400 animate-pulse absolute top-1 right-1"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1"></div>
                        <span className="text-[6.5px] font-bold text-emerald-400">UP</span>
                      </div>

                      {/* Port 3 - Hotspot */}
                      <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center justify-between h-11 relative">
                        <span className="text-[7px] text-slate-500 font-mono">P3 (VLAN)</span>
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse absolute top-1 right-1"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1"></div>
                        <span className="text-[6.5px] font-bold text-amber-400">UP</span>
                      </div>

                      {/* Port 4 - Standby */}
                      <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center justify-between h-11">
                        <span className="text-[7px] text-slate-500 font-mono">P4 (STBY)</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                        <span className="text-[6.5px] font-bold text-slate-600">OFF</span>
                      </div>

                      {/* Port 5 - Backup */}
                      <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center justify-between h-11">
                        <span className="text-[7px] text-slate-500 font-mono">P5 (FO)</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                        <span className="text-[6.5px] font-bold text-slate-600">OFF</span>
                      </div>

                      {/* Port 6 - SFP+ */}
                      <div className="bg-slate-900 border border-slate-800 rounded p-1 flex flex-col items-center justify-between h-11 relative">
                        <span className="text-[7px] text-slate-500 font-mono">SFP+</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse absolute top-1 right-1"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1"></div>
                        <span className="text-[6.5px] font-bold text-blue-400">10G</span>
                      </div>
                    </div>
                  </div>

                  {/* Vitals row */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-850 p-2 rounded-lg border border-slate-800/80">
                      <div className="text-slate-400 text-[8px] font-mono uppercase font-bold tracking-wider mb-0.5">📉 BEBAN CPU</div>
                      <div className="font-extrabold text-indigo-300 font-mono text-[11px] flex justify-center items-center gap-1">
                        <span>8%</span>
                        <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="w-[8%] h-full bg-indigo-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-850 p-2 rounded-lg border border-slate-800/80">
                      <div className="text-slate-400 text-[8px] font-mono uppercase font-bold tracking-wider mb-0.5">🌡 TEMPERATUR</div>
                      <div className="font-extrabold text-rose-300 font-mono text-[11px]">41°C</div>
                    </div>
                    <div className="bg-slate-850 p-2 rounded-lg border border-slate-800/80">
                      <div className="text-slate-400 text-[8px] font-mono uppercase font-bold tracking-wider mb-0.5">⏱ ROUTER UPTIME</div>
                      <div className="font-extrabold text-emerald-355 text-emerald-300 font-mono text-[10px] truncate">15 Hari 4 Jam</div>
                    </div>
                  </div>

                  {/* Main Counters Grid row */}
                  <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                    <div className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      activeCoreTab === "pppoe_active" 
                        ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-405 shadow-inner" 
                        : "bg-slate-850 border-slate-800/80 text-slate-350 hover:bg-slate-800"
                    }`} onClick={() => setActiveCoreTab("pppoe_active")}>
                      <div className="text-[15px] font-extrabold text-emerald-400">{activeCount}</div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">PPPoE Aktif</div>
                    </div>
                    <div className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      activeCoreTab === "pppoe_offline" 
                        ? "bg-rose-500/10 border-rose-500/50 text-rose-350 shadow-inner" 
                        : "bg-slate-850 border-slate-800/80 text-slate-350 hover:bg-slate-800"
                    }`} onClick={() => setActiveCoreTab("pppoe_offline")}>
                      <div className="text-[15px] font-extrabold text-rose-450">{offlineCount}</div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">PPPoE Off</div>
                    </div>
                    <div className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      activeCoreTab === "hotspot" 
                        ? "bg-amber-500/10 border-amber-500/55 text-amber-350 shadow-inner" 
                        : "bg-slate-850 border-slate-800/80 text-slate-350 hover:bg-slate-800"
                    }`} onClick={() => setActiveCoreTab("hotspot")}>
                      <div className="text-[15px] font-extrabold text-amber-400">{hotspotCount}</div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Hotspot</div>
                    </div>
                  </div>

                  {/* Content List of Secrets / Hotspot (Sleek dark layout) */}
                  <div className="overflow-y-auto max-h-[160px] border border-slate-800 bg-slate-950 rounded-xl p-2 space-y-1.5 custom-scrollbar">
                    {activeCoreTab === "pppoe_active" && (
                      secrets.filter(s => s.status === "Active").map((item) => (
                        <div key={item.username} className="flex items-center justify-between p-2 py-1.5 text-[9.5px] bg-slate-900 border border-slate-850 rounded-lg shadow-xs hover:border-emerald-500/30 transition-all font-mono">
                          <div>
                            <div className="font-extrabold text-slate-100 flex items-center gap-1.5 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              {item.username}
                            </div>
                            <span className="text-slate-400 block text-[8px] mt-0.5">IP: {item.ipAddress} • {item.profile}</span>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="inline-block px-1 bg-emerald-500/10 text-emerald-400 rounded text-[7.5px] font-extrabold border border-emerald-500/20">
                              ⚡ 50 Mbps
                            </span>
                            <span className="block text-slate-500 text-[7px]">Up: {item.uptime}</span>
                          </div>
                        </div>
                      ))
                    )}

                    {activeCoreTab === "pppoe_offline" && (
                      secrets.filter(s => s.status === "Offline").length === 0 ? (
                        <div className="text-slate-550 text-center py-5 italic text-[9.5px] font-mono">Semua Client PPPoE Berhasil Terkoneksi.</div>
                      ) : (
                        secrets.filter(s => s.status === "Offline").map((item) => (
                          <div key={item.username} className="flex items-center justify-between p-2 py-1.5 text-[9.5px] bg-slate-900 border border-slate-850 rounded-lg shadow-xs hover:border-rose-500/30 transition-all font-mono">
                            <div>
                              <div className="font-extrabold text-slate-100 flex items-center gap-1.5 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                {item.username}
                              </div>
                              <span className="text-slate-400 block text-[8px] mt-0.5">MAC: {item.mac}</span>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="inline-block px-1 bg-rose-550/10 text-rose-450 rounded text-[7.5px] font-bold border border-rose-500/20">
                                OFFLINE
                              </span>
                              <span className="block text-slate-500 text-[7px]">{item.lastOof}</span>
                            </div>
                          </div>
                        ))
                      )
                    )}

                    {activeCoreTab === "hotspot" && (
                      hotspots.map((item) => (
                        <div key={item.username} className="flex items-center justify-between p-2 py-1.5 text-[9.5px] bg-slate-900 border border-slate-850 rounded-lg shadow-xs hover:border-amber-500/30 transition-all font-mono">
                          <div>
                            <div className="font-extrabold text-slate-100 flex items-center gap-1.5 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              {item.username}
                            </div>
                            <span className="text-slate-400 block text-[8px] mt-0.5">IP: {item.ipAddress} • {item.uptime}</span>
                          </div>
                          <div className="text-right space-y-0.5">
                            <span className="inline-block px-1 bg-amber-500/10 text-amber-300 rounded text-[7.5px] font-bold border border-amber-500/20">
                              HOTSPOT ACTIVE
                            </span>
                            <div className="text-[7.5px] text-indigo-400 font-extrabold flex items-center justify-end gap-1">
                              <span>⇅ {item.bytesIn} / {item.bytesOut}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Transaction overview metrics */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3" id="portal-metrics-overview">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Akumulasi Pembayaran Klien</h3>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-xs text-emerald-800 font-medium">Total Kontribusi (Lunas)</span>
                <span className="text-sm font-extrabold text-emerald-950 font-mono">{formatIDR(totalPaidTransactions)}</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Actionable billing & Dynamic Checkout simulator (7 cols) */}
          <div className="lg:col-span-7 space-y-6" id="portal-right-col">
            
            {/* Active Payment Panel if user clicked Pay */}
            {activeInvoiceForPayment && paymentStep !== "idle" && (
              <div className="bg-white rounded-xl border-2 border-blue-500 shadow-md overflow-hidden animate-in zoom-in duration-200" id="portal-qris-payment-panel">
                
                {/* Header checkout */}
                <div className="p-4 bg-blue-600 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-white" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest">Secure Dynamic QRIS Checkout</h4>
                      <p className="text-[10px] text-blue-100 font-mono">Invoice Ref: {activeInvoiceForPayment.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setPaymentStep("idle");
                      setActiveInvoiceForPayment(null);
                    }}
                    className="text-xs bg-blue-800 hover:bg-blue-900 border border-blue-500 px-2.5 py-1 rounded-lg text-white cursor-pointer transition-colors"
                  >
                    Batal
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Step 1: Review billing amounts */}
                  {paymentStep === "review" && (
                    <div className="space-y-4" id="p-step-review">
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Biaya Monitoring SLA ({activeInvoiceForPayment.billingMonth}):</span>
                          <span className="font-mono font-semibold text-slate-800">{formatIDR(activeInvoiceForPayment.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">PPN Pajak Perangkat (11%):</span>
                          <span className="font-mono font-semibold text-slate-800 text-emerald-600">+{formatIDR(activeInvoiceForPayment.amount * 0.11)}</span>
                        </div>
                        <hr className="border-slate-200 border-dashed" />
                        <div className="flex justify-between items-center pt-1">
                          <span className="font-bold text-slate-900 text-xs uppercase">Total Pembayaran Terisi Otomatis:</span>
                          <span className="font-extrabold text-blue-600 font-mono text-base">{formatIDR(activeInvoiceForPayment.amount * 1.11)}</span>
                        </div>
                      </div>

                      {/* Choose method */}
                      <div className="space-y-2 text-xs">
                        <label className="block text-slate-500 font-semibold">Pilih Gerbang Metode Pembayaran:</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("QRIS")}
                            className={`p-3 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                              paymentMethod === "QRIS"
                                ? "border-blue-600 bg-blue-50/50 text-blue-700"
                                : "border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            ⭐ Scan QRIS {bizProfile?.staticQrisUrl ? "Statis" : "Dinamis"}
                          </button>

                          {/* Custom active payment methods */}
                          {bizProfile?.customPaymentMethods?.filter(pm => pm.active).map((pm) => (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPaymentMethod(pm.id as any)}
                              className={`p-3 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                                paymentMethod === pm.id
                                  ? "border-blue-600 bg-blue-50/50 text-blue-700"
                                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              💳 {pm.name}
                            </button>
                          ))}

                          {/* Hardcoded fallback methods if profile doesn't have custom ones */}
                          {(!bizProfile?.customPaymentMethods || bizProfile.customPaymentMethods.filter(pm => pm.active).length === 0) && (
                            <>
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("VA_MANDIRI")}
                                className={`p-3 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                                  paymentMethod === "VA_MANDIRI"
                                    ? "border-blue-600 bg-blue-50/50 text-blue-700"
                                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                Mandiri VA
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentMethod("VA_BCA")}
                                className={`p-3 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                                  paymentMethod === "VA_BCA"
                                    ? "border-blue-600 bg-blue-50/50 text-blue-700"
                                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                BCA VA
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPaymentStep("scanning")}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold text-xs cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2"
                      >
                        Berikutnya: Ambil Kode Pembayaran <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Step 2: Scanning dynamic QR code or VA details */}
                  {paymentStep === "scanning" && (
                    <div className="space-y-4 flex flex-col items-center text-center py-2" id="p-step-scan">
                      {paymentMethod === "QRIS" ? (
                        <>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 relative shadow-inner">
                            {bizProfile?.staticQrisUrl ? (
                              /* Visual Uploaded Static QRIS */
                              <div className="w-44 h-44 bg-white p-1 border border-slate-200 rounded flex items-center justify-center relative overflow-hidden">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={bizProfile.staticQrisUrl}
                                  className="w-full h-full object-contain"
                                  alt="Static QRIS"
                                />
                                {/* Glowing scanner line animation simulating real camera search */}
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 top-1/2 -translate-y-1/2 shadow-lg animate-bounce"></div>
                              </div>
                            ) : (
                              /* Visual Dynamic QR Simulator */
                              <div className="w-44 h-44 bg-white p-2 border border-slate-200 rounded flex items-center justify-center relative">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" className="opacity-95">
                                  <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                                  <rect x="5" y="5" width="20" height="20" fill="#1e293b" />
                                  <rect x="8" y="8" width="14" height="14" fill="#fff" />
                                  <rect x="11" y="11" width="8" height="8" fill="#1e293b" />

                                  <rect x="75" y="5" width="20" height="20" fill="#1e293b" />
                                  <rect x="78" y="8" width="14" height="14" fill="#fff" />
                                  <rect x="81" y="11" width="8" height="8" fill="#1e293b" />

                                  <rect x="5" y="75" width="20" height="20" fill="#1e293b" />
                                  <rect x="8" y="78" width="14" height="14" fill="#fff" />
                                  <rect x="11" y="81" width="8" height="8" fill="#1e293b" />

                                  <rect x="35" y="12" width="15" height="12" fill="#1e293b" />
                                  <rect x="42" y="55" width="18" height="10" fill="#1e293b" />
                                  <rect x="65" y="32" width="25" height="15" fill="#1e293b" />
                                  <rect x="30" y="70" width="25" height="18" fill="#1e293b" />
                                  <rect x="65" y="65" width="15" height="15" fill="#1e293b" />

                                  <rect x="42" y="42" width="16" height="16" fill="#10b981" rx="2.5" />
                                  <text x="50" y="52" fill="#fff" fontSize="7" textAnchor="middle" fontWeight="extrabold">NOC</text>
                                </svg>
                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 top-1/2 -translate-y-1/2 shadow-lg animate-bounce"></div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5 max-w-sm">
                            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                              {bizProfile?.staticQrisUrl ? "STATIC QRIS PAYLOAD STRING:" : "DYNAMIC QRIS PAYLOAD STR:"}
                            </span>
                            <p className="text-[9.5px] font-mono text-slate-500 bg-slate-100 p-2 rounded max-h-16 overflow-y-auto break-all select-all leading-normal text-center">
                              {bizProfile?.staticQrisPayload || dynamicQrisPayload}
                            </p>
                            <span className="text-[10px] text-emerald-600 font-bold block">
                              ✨ Merchant Name: {bizProfile?.pdfTitle || "SLA NOC BILLING"}
                            </span>
                            <span className="text-lg font-mono font-extrabold text-slate-900 block mt-2">
                              {formatIDR(activeInvoiceForPayment.amount * 1.11)}
                            </span>
                          </div>
                        </>
                      ) : (() => {
                        const customPm = bizProfile?.customPaymentMethods?.find(pm => pm.id === paymentMethod);
                        const isMandiri = paymentMethod === "VA_MANDIRI";
                        const name = customPm ? customPm.name : (isMandiri ? "Mandiri Virtual Account" : "BCA Virtual Account");
                        const accNo = customPm ? customPm.accountNumber : (isMandiri ? "88991200000002" : "7711230000003");
                        const accHolder = customPm ? (customPm.accountHolder || simulatedClient.company) : "SLA NOC BILLING";

                        return (
                          <div className="w-full space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-sm font-sans">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                              <span className="text-xs font-semibold text-slate-400">Metode:</span>
                              <span className="text-xs font-bold text-indigo-600 uppercase font-mono">
                                {name}
                              </span>
                            </div>
                            
                            <div className="text-left space-y-0.5">
                              <span className="text-[10px] text-slate-400 block font-semibold">Nama Pemilik / Atas Nama:</span>
                              <span className="text-xs font-bold text-slate-800 font-mono block uppercase">{accHolder}</span>
                            </div>

                            <div className="text-left space-y-1">
                              <span className="text-[10px] text-slate-400 block font-semibold">Nomor Rekening / VA:</span>
                              <div className="text-base font-mono font-bold text-slate-900 bg-white border p-2 rounded-lg flex justify-between items-center shadow-xs">
                                <span>{accNo}</span>
                                <span className="text-[10px] uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-extrabold cursor-pointer hover:bg-blue-100 transition-colors">Copy</span>
                              </div>
                            </div>

                            <div className="text-left space-y-1 pt-1.5 border-t border-dashed border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-semibold">Total Tagihan Pelunasan (PPN 11%):</span>
                              <span className="text-sm font-mono font-bold text-slate-800">{formatIDR(activeInvoiceForPayment.amount * 1.11)}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Instructions for Sandbox Real-time integration */}
                      <div className="text-xs text-slate-500 max-w-sm mt-3 bg-blue-50/50 border border-blue-100 p-3 rounded-lg leading-relaxed">
                        👉 <span className="font-semibold text-slate-800">Uji Coba Sinkronisasi Real-Time:</span> Di dunia nyata, gateway QRIS akan menembakkan callback IPN. Klik tombol simulasi di bawah untuk menguji webhook rekonsiliasi yang sesungguhnya.
                      </div>

                      <button
                        type="button"
                        onClick={handleSimulateWebhookNotification}
                        className="w-full max-w-sm py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="w-4 h-4" /> [Simulasi] Konfirmasi Notifikasi Webhook Berhasil (Gateway QRIS)
                      </button>
                    </div>
                  )}

                  {/* Step 3: Webhook receiving and processing */}
                  {paymentStep === "processing" && (
                    <div className="py-8 space-y-4 flex flex-col items-center justify-center" id="p-step-processing">
                      <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 text-center">Menyeleraskan Callback Real-Time...</h4>
                        <p className="text-xs text-slate-400 text-center mt-1">Sistem menyimulasikan sinkronisasi pembayaran port Gateway.</p>
                      </div>

                      {/* Webhook Live Logs */}
                      <div className="w-full max-w-md bg-slate-950 text-[10px] font-mono text-slate-200 p-4 rounded-xl space-y-1.5 shadow-inner leading-relaxed text-left h-36 overflow-y-auto">
                        {reconciliationLog.map((log, index) => (
                          <div key={index} className="animate-fade-in">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Success confirmation */}
                  {paymentStep === "success" && (
                    <div className="py-6 space-y-5 flex flex-col items-center text-center animate-in zoom-in duration-200" id="p-step-success">
                      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                        <Check className="w-8 h-8" />
                      </div>
                      
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Pembayaran SLA Berhasil Diterima!</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                          Gateway QRIS/VA telah menembakkan callback server IPN. Transaksi Anda aman dan status billing telah terrekonsiliasi otomatis.
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl w-full max-w-xs text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-600">
                          <span>Ref Transaksi:</span>
                          <span className="font-semibold font-mono text-slate-800">TXN-NOC-{activeInvoiceForPayment.id}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Status:</span>
                          <span className="font-extrabold text-emerald-700">LUNAS (AUTO RECON)</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SLA Monitoring:</span>
                          <span className="font-semibold text-slate-800">🟢 BERJALAN AKTIF</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentStep("idle");
                          setActiveInvoiceForPayment(null);
                        }}
                        className="px-6 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Kembali ke Rincian Tagihan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoices List panel for client */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden" id="portal-invoices-panel">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Daftar Tagihan Monitoring Saya ({clientInvoices.length})</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Simulasi Client View</span>
              </div>

              {clientInvoices.length === 0 ? (
                <div className="p-12 text-center" id="empty-client-invoices">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs italic">Tidak ada invoice diterbitkan untuk instansi pembayaran ini.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 text-xs" id="invoice-items-list">
                  {clientInvoices.map((inv) => {
                    const isUnpaid = inv.status === "Unpaid" || inv.status === "Overdue";
                    return (
                      <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors" key={inv.id} id={`portal-inv-${inv.id}`}>
                        
                        {/* Meta information */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{inv.id}</span>
                            {inv.status === "Paid" ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Lunas ({inv.paymentMethod})</span>
                            ) : inv.status === "Overdue" ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">Menunggak (Overdue)</span>
                            ) : inv.status === "Unpaid" ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">Menunggu Pelunasan</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">Draft</span>
                            )}
                          </div>
                          
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div><span className="font-semibold text-slate-400">Periode Layanan:</span> {inv.billingMonth}</div>
                            <div><span className="font-semibold text-slate-400">Jatuh Tempo:</span> {inv.dueDate}</div>
                          </div>
                        </div>

                        {/* Amount & action button */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-start w-full sm:w-auto gap-4 sm:gap-2">
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] text-slate-400 block font-mono">Nilai Tagihan + PPN 11%</span>
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {formatIDR(inv.amount * 1.11)}
                            </span>
                          </div>

                          {isUnpaid ? (
                            <button
                              onClick={() => handleInitiatePayment(inv)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer inline-flex items-center gap-1 shrink-0 transition-colors"
                              id={`portal-pay-btn-${inv.id}`}
                            >
                              <QrCode className="w-3.5 h-3.5" /> Bayar Tagihan (QRIS)
                            </button>
                          ) : inv.status === "Paid" ? (
                            <div className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded inline-flex items-center gap-1">
                              ✔ Lunas pada {inv.paymentDate || "-"}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Draft tagihan monitor</span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Live Real-time Customer Core SLA Bandwidth Monitor */}
        <div className="mt-6 border-t border-slate-200/60 dark:border-slate-800 pt-6">
          <TrafficMonitor 
            title={`Live SLA Traffic Monitoring`}
            isAdmin={false}
            clients={clients}
            clientName={`${simulatedClient.company} (${simulatedClient.name})`}
          />
        </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white border rounded-xl" id="portal-no-clients">
          <p className="text-slate-400 text-sm">Tidak ada pelanggan aktif yang terdaftar untuk simulasi.</p>
        </div>
      )}

    </div>
  );
}
