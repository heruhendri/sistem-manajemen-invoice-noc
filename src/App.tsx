import React, { useState, useEffect } from "react";
import { Client, Invoice, NotificationTemplate, BookkeepingRecord, ServiceCategory, BizProfile } from "./types";
import { loadData, saveData } from "./mockData";
import DashboardView from "./components/DashboardView";
import ClientsView from "./components/ClientsView";
import InvoicesView from "./components/InvoicesView";
import IntegrationView from "./components/IntegrationView";
import BookkeepingView from "./components/BookkeepingView";
import CustomerPortalView from "./components/CustomerPortalView";
import ServiceCategoriesView from "./components/ServiceCategoriesView";
import BizProfileView from "./components/BizProfileView";
import NetworkMonitoringView from "./components/NetworkMonitoringView";
import MarketingCatalogView from "./components/MarketingCatalogView";

import { 
  Building2, 
  Users, 
  FileText, 
  Cpu, 
  Settings, 
  LayoutDashboard, 
  Tv, 
  Activity,
  UserCheck2,
  Lock,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Database,
  Wifi,
  Server,
  LogOut,
  Eye,
  EyeOff,
  Globe,
  ShoppingBag,
  Home
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Default to marketing-ecatalog (E-Catalog)
  const [activeTab, _setActiveTab] = useState<string>(() => {
    const path = (window.location.pathname + window.location.hash).toLowerCase();
    if (path.includes("admin")) {
      return "dashboard";
    }
    if (path.includes("pelanggan") || path.includes("customer")) {
      return "customer-portal";
    }
    return "marketing-ecatalog";
  });

  const setActiveTab = (tabName: string | ((prev: string) => string)) => {
    _setActiveTab((prevValue) => {
      const nextValue = typeof tabName === "function" ? tabName(prevValue) : tabName;
      
      let targetPath = "/";
      if (nextValue === "customer-portal") {
        targetPath = "/pelanggan";
      } else if (nextValue === "marketing-ecatalog") {
        targetPath = "/";
      } else {
        // Any admin panel tab
        targetPath = "/admin";
      }

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: nextValue }, "", targetPath);
      }
      return nextValue;
    });
  };

  // Sync browser back/forward buttons with custom path states
  useEffect(() => {
    const handlePopState = () => {
      const path = (window.location.pathname + window.location.hash).toLowerCase();
      if (path.includes("admin")) {
        _setActiveTab((prev) => {
          // If already in an admin tab, keep it, otherwise default to dashboard
          if (["marketing-ecatalog", "customer-portal"].includes(prev)) {
            return "dashboard";
          }
          return prev;
        });
      } else if (path.includes("pelanggan") || path.includes("customer")) {
        _setActiveTab("customer-portal");
      } else {
        _setActiveTab("marketing-ecatalog");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("noc_billing_dark_mode") === "true";
  });

  // Admin credentials state loaded from localStorage
  const [adminUsername, setAdminUsername] = useState<string>(() => {
    return localStorage.getItem("noc_admin_username") || "admin";
  });
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem("noc_admin_password") || "admin";
  });

  // Admin login states
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("noc_admin_logged_in") === "true";
  });
  const [adminInputUser, setAdminInputUser] = useState("");
  const [adminInputPass, setAdminInputPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminFailedAttempts, setAdminFailedAttempts] = useState(0);
  const [adminLockoutTime, setAdminLockoutTime] = useState(0);

  // Cooldown countdown timer for Admin Login Barrier
  useEffect(() => {
    if (adminLockoutTime <= 0) return;
    const interval = setInterval(() => {
      setAdminLockoutTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [adminLockoutTime]);

  // States
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [bookkeeping, setBookkeeping] = useState<BookkeepingRecord[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);

  // Business profile state (Logo, Usaha Name, Billing name, etc.)
  const [bizProfile, setBizProfile] = useState<BizProfile>(() => {
    const saved = localStorage.getItem("noc_billing_biz_profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure default customPaymentMethods and pdf fields are populated if missing
        if (!parsed.customPaymentMethods) {
          parsed.customPaymentMethods = [
            { id: "pm-1", name: "Bank Mandiri VA", accountNumber: "8899120000002", accountHolder: "PT NOC NET NUSANTARA", active: true },
            { id: "pm-2", name: "Bank BCA VA", accountNumber: "7711230000003", accountHolder: "PT NOC NET NUSANTARA", active: true },
            { id: "pm-3", name: "Kirim Bukti QRIS Manual (Statis)", accountNumber: "QRIS Online", accountHolder: "PT NOC NET NUSANTARA", active: true }
          ];
        }
        if (!parsed.pdfTitle) parsed.pdfTitle = "INVOICE UTAMA SLA";
        if (!parsed.pdfSubTitle) parsed.pdfSubTitle = "SLA PROACTIVE MONITORING INFRASTRUCTURE";
        if (!parsed.pdfColorPrimary) parsed.pdfColorPrimary = "#0d9488";
        if (!parsed.pdfColorSecondary) parsed.pdfColorSecondary = "#475569";
        if (!parsed.pdfCustomNote) parsed.pdfCustomNote = "Pesan ini digenerate secara otomatis oleh Billing NOC System dengan pembukuan real-time terintegrasi.";
        if (!parsed.staticQrisPayload) parsed.staticQrisPayload = "00020101021226380010ID.CO.QRIS.WWW011893600002000010000303035204481155026263045A95";
        if (parsed.otpAuthenticationEnabled === undefined) parsed.otpAuthenticationEnabled = true;
        return parsed;
      } catch (e) {}
    }
    return {
      companyName: "NOC Net Nusantara",
      billingName: "Billing SLA NOC & Monitoring",
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      email: "finance@nocnet.id",
      phone: "+62 811-9988-7711",
      address: "Cyber Building 1st Floor, Kuningan Barat, Jakarta, Indonesia",
      footerText: "NOC Net Nusantara - SLA Monitoring Guarantee 99.9%",
      qrisMerchantName: "NOC NET NUSANTARA CO",
      otpAuthenticationEnabled: true,
      
      pdfTitle: "INVOICE UTAMA SLA",
      pdfSubTitle: "SLA PROACTIVE MONITORING INFRASTRUCTURE",
      pdfColorPrimary: "#0d9488",
      pdfColorSecondary: "#475569",
      pdfCustomNote: "Pesan ini digenerate secara otomatis oleh Billing NOC System dengan pembukuan real-time terintegrasi.",
      staticQrisPayload: "00020101021226380010ID.CO.QRIS.WWW011893600002000010000303035204481155026263045A95",
      customPaymentMethods: [
        { id: "pm-1", name: "Bank Mandiri VA", accountNumber: "8899120000002", accountHolder: "PT NOC NET NUSANTARA", active: true },
        { id: "pm-2", name: "Bank BCA VA", accountNumber: "7711230000003", accountHolder: "PT NOC NET NUSANTARA", active: true },
        { id: "pm-3", name: "Kirim Bukti QRIS Manual (Statis)", accountNumber: "QRIS Online", accountHolder: "PT NOC NET NUSANTARA", active: true }
      ]
    };
  });

  const handleUpdateBizProfile = (updated: BizProfile) => {
    setBizProfile(updated);
    localStorage.setItem("noc_billing_biz_profile", JSON.stringify(updated));
  };

  // Android WebView-safe custom toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "warning" | "error" | "info";
  } | null>(null);

  const triggerToast = (
    message: string,
    type: "success" | "warning" | "error" | "info" = "info"
  ) => {
    setToast({ message, type });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    const local = loadData();
    
    // Purge any residual simulated / dummy records automatically from local storage
    const cleanClients = local.clients.filter(c => c.id !== "CLI-001" && c.name !== "Budi Hartono");
    const cleanInvoices = local.invoices.filter(i => i.id !== "INV-2026-001" && i.clientCompany !== "PT Citra Global ISP");
    const cleanBookkeeping = local.bookkeeping.filter(b => !b.description.includes("PT Citra Global ISP"));
    
    // Attempt to download the latest state from the backend database persistence
    fetch("/api/sync/db")
      .then(res => res.json())
      .then(backend => {
        if (backend && backend.clients && backend.clients.length > 0) {
          setClients(backend.clients);
          setInvoices(backend.invoices || []);
          setBookkeeping(backend.bookkeeping || []);
          setTemplates(backend.templates || local.templates);
          setServiceCategories(backend.serviceCategories || local.serviceCategories);
        } else {
          // Initialize server database with client state
          const baselineData = {
            clients: cleanClients,
            invoices: cleanInvoices,
            bookkeeping: cleanBookkeeping,
            templates: local.templates,
            serviceCategories: local.serviceCategories
          };
          setClients(cleanClients);
          setInvoices(cleanInvoices);
          setBookkeeping(cleanBookkeeping);
          setTemplates(local.templates);
          setServiceCategories(local.serviceCategories);

          fetch("/api/sync/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(baselineData)
          }).catch(err => console.error("Initial database handshake push failed:", err));
        }
      })
      .catch(() => {
        // Fallback to local storage if API backend is launching
        setClients(cleanClients);
        setInvoices(cleanInvoices);
        setBookkeeping(cleanBookkeeping);
        setTemplates(local.templates);
        setServiceCategories(local.serviceCategories);
      });

    // Load WhatsApp connection status from the server
    fetch("/api/whatsapp/status")
      .then(res => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        throw new Error("unreachable state");
      })
      .then(data => {
        const isConnected = data.status === "completed";
        setWhatsappConnected(isConnected);
        localStorage.setItem("noc_billing_whatsapp_connected", String(isConnected));
      })
      .catch(() => {
        const waSynced = localStorage.getItem("noc_billing_whatsapp_connected") === "true";
        setWhatsappConnected(waSynced);
      });

    setLoading(false);
  }, []);

  // Sync dark mode class to HTML document body roots
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("noc_billing_dark_mode", String(darkMode));
  }, [darkMode]);

  // Sync to local storage and push to backend on any change
  const syncState = (
    updatedClients: Client[],
    updatedInvoices: Invoice[],
    updatedBookkeeping: BookkeepingRecord[],
    updatedTemplates: NotificationTemplate[],
    updatedCategories: ServiceCategory[] = serviceCategories
  ) => {
    const dataToSync = {
      clients: updatedClients,
      invoices: updatedInvoices,
      bookkeeping: updatedBookkeeping,
      templates: updatedTemplates,
      serviceCategories: updatedCategories
    };

    saveData(dataToSync);

    // Push state updates asynchronously to the production Express server
    fetch("/api/sync/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSync)
    }).catch(err => console.error("Async state push to backend server failed:", err));
  };

  // Client mutations
  const handleAddClient = (client: Client) => {
    const updated = [client, ...clients];
    setClients(updated);
    syncState(updated, invoices, bookkeeping, templates);
  };

  const handleUpdateClient = (client: Client) => {
    const updated = clients.map(c => c.id === client.id ? client : c);
    setClients(updated);
    // Also Cascade updates to clientName or clientCompany in invoices if needed
    const updatedInvoices = invoices.map(inv => {
      if (inv.clientId === client.id) {
        return {
          ...inv,
          clientName: client.name,
          clientCompany: client.company
        };
      }
      return inv;
    });
    setInvoices(updatedInvoices);
    syncState(updated, updatedInvoices, bookkeeping, templates);
  };

  const handleDeleteClient = (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const updated = clients.filter(c => !ids.includes(c.id));
    setClients(updated);
    syncState(updated, invoices, bookkeeping, templates);
  };

  // Service Category mutations
  const handleAddServiceCategory = (category: ServiceCategory) => {
    const updated = [...serviceCategories, category];
    setServiceCategories(updated);
    syncState(clients, invoices, bookkeeping, templates, updated);
  };

  const handleUpdateServiceCategory = (category: ServiceCategory) => {
    const updated = serviceCategories.map(s => s.id === category.id ? category : s);
    setServiceCategories(updated);
    syncState(clients, invoices, bookkeeping, templates, updated);
  };

  const handleDeleteServiceCategory = (id: string) => {
    const updated = serviceCategories.filter(s => s.id !== id);
    setServiceCategories(updated);
    syncState(clients, invoices, bookkeeping, templates, updated);
  };

  // 2. Invoice mutations
  const handleChangeInvoices = (newInvoices: Invoice[]) => {
    setInvoices(newInvoices);
    syncState(clients, newInvoices, bookkeeping, templates);
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: "Paid", method: "QRIS" | "Bank Transfer") => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status,
          paymentMethod: method,
          paymentDate: new Date().toISOString().split("T")[0]
        };
      }
      return inv;
    });
    setInvoices(updated);
    syncState(clients, updated, bookkeeping, templates);
  };

  // 3. Bookkeeping mutations
  const handleAddBookkeeping = (record: BookkeepingRecord) => {
    const updated = [record, ...bookkeeping];
    setBookkeeping(updated);
    syncState(clients, invoices, updated, templates);
  };

  const handleDeleteBookkeeping = (idOrIds: string | string[]) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const updated = bookkeeping.filter(b => !ids.includes(b.id));
    setBookkeeping(updated);
    syncState(clients, invoices, updated, templates);
  };

  // 4. Template mutations
  const handleUpdateTemplate = (template: NotificationTemplate) => {
    const updated = templates.map(t => t.id === template.id ? template : t);
    setTemplates(updated);
    syncState(clients, invoices, bookkeeping, updated);
  };

  // 5. WhatsApp connection status mutated
  const handleSetWhatsappConnected = (connected: boolean) => {
    setWhatsappConnected(connected);
    localStorage.setItem("noc_billing_whatsapp_connected", String(connected));
  };

  const handleResetToEmpty = () => {
    setClients([]);
    setInvoices([]);
    setBookkeeping([]);
    syncState([], [], [], templates);
    triggerToast("Database simulasi berhasil dibersihkan! Sistem beralih ke mode operasi riil.", "success");
  };

  const handleRestoreFullDb = (imported: any) => {
    const rC = imported.clients || [];
    const rI = imported.invoices || [];
    const rB = imported.bookkeeping || [];
    const rT = imported.templates || templates;

    setClients(rC);
    setInvoices(rI);
    setBookkeeping(rB);
    if (imported.templates) setTemplates(rT);

    syncState(rC, rI, rB, rT);
    triggerToast("Database SLA NOC berhasil dipulihkan dari file backup JSON!", "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-blue-500 font-mono space-y-2">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs uppercase tracking-widest text-[#a0a0a0]">Memuat Database Keuangan NOC...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-[#090d16] text-white" : "bg-slate-50 text-slate-800"} flex flex-col font-sans antialiased`} id="main-app">
      
      {/* Top Professional Global Header bar: Sticky of 16 (h-16) */}
      <header className="bg-white dark:bg-[#0d1527] border-b border-slate-200 dark:border-slate-800 text-slate-950 dark:text-white shrink-0 shadow-xs sticky top-0 z-50 transition-colors" id="global-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4" id="header-content-wrap">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5 shrink-0" id="brand-area">
            <div className="w-9 h-9 overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-lg shrink-0 flex items-center justify-center font-bold border border-slate-200 dark:border-slate-800 shadow-xs" id="brand-logo">
              {bizProfile.logoUrl ? (
                <img 
                  src={bizProfile.logoUrl} 
                  alt="Usaha Logo" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
                  }}
                />
              ) : (
                <Tv className="w-5 h-5 text-blue-600 shrink-0" />
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-extrabold block leading-none font-sans">
                {bizProfile.companyName}
              </span>
              <h1 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate max-w-[120px] sm:max-w-[200px]" id="brand-title">
                {bizProfile.billingName}
              </h1>
            </div>
          </div>

          {/* NEW: Clean, Integrated Navigation Menu */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#070b13] border border-slate-200 dark:border-slate-800/80 p-0.5 rounded-xl text-xs font-bold uppercase tracking-wider" id="header-navigation-tabs">
            <button
              onClick={() => {
                setActiveTab("marketing-ecatalog");
                triggerToast("Menuju Katalog Pelayanan Utama Usaha", "info");
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === "marketing-ecatalog"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-550 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
              id="header-nav-btn-home"
            >
              🏠 <span className="hidden sm:inline">Katalog</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("customer-portal");
                triggerToast("Menuju Portal Pelayanan Pelanggan", "info");
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                activeTab === "customer-portal"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-550 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
              id="header-nav-btn-cust"
            >
              👤 <span className="hidden sm:inline">Portal Pelanggan</span>
            </button>
            <button
              onClick={() => {
                const targetTab = ["marketing-ecatalog", "customer-portal"].includes(activeTab) ? "dashboard" : activeTab;
                setActiveTab(targetTab);
                triggerToast("Menuju Console Enkripsi Admin NOC", "info");
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                !["marketing-ecatalog", "customer-portal"].includes(activeTab)
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-550 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
              id="header-nav-btn-admin"
            >
              🔐 <span className="hidden sm:inline">Secure Admin</span>
            </button>
          </div>

          {/* Connected health monitor badge label */}
          <div className="flex items-center gap-2 shrink-0" id="telemetry-badge-area">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 px-2.5 border border-slate-200 dark:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5 focus:outline-none bg-white dark:bg-slate-900"
              title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              id="theme-toggler-btn"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
              <span className="text-[9.5px] font-bold uppercase tracking-wider hidden md:inline-block">
                {darkMode ? "Light" : "Dark"}
              </span>
            </button>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 font-mono">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full block animate-ping"></span>
              NOC-SLA Link OK
            </span>
            <div className="text-right hidden md:block">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">Keuangan Terkunci</div>
              <span className="text-[10.5px] text-blue-600 font-mono font-bold block mt-0.5 font-semibold">IDR SECURE AES</span>
            </div>
          </div>

        </div>
      </header>

      {/* ===============================================================
          MAIN RENDER INTERNALS: PUBLIC vs ADMINISTRATOR ROUTING 
          =============================================================== */}
      {(() => {
        const isPublicView = ["marketing-ecatalog", "customer-portal"].includes(activeTab);

        // PUBLIC ACCESS CANVAS LAYER (No Admin Sidebar, full screen modern visual canvas)
        if (isPublicView) {
          return (
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col" id="public-routing-canvas">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-6 flex-1 flex flex-col"
                >
                  {activeTab === "marketing-ecatalog" && (
                    <MarketingCatalogView 
                      onNavigate={setActiveTab} 
                      bizProfile={bizProfile} 
                      clients={clients} 
                    />
                  )}

                  {activeTab === "customer-portal" && (
                    <CustomerPortalView 
                      clients={clients}
                      invoices={invoices}
                      onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                      onAddBookkeeping={handleAddBookkeeping}
                      triggerToast={triggerToast}
                      bizProfile={bizProfile}
                      onUpdateClient={handleUpdateClient}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          );
        }

        // SECURED ADMIN LOGIN BARRIER
        if (!adminAuthenticated) {
          return (
            <div className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center py-12" id="admin-login-barrier">
              <div className="bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full shadow-2xl space-y-6 text-center select-none animate-in fade-in duration-300">
                
                {/* Header banner lock */}
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center text-[#2563eb] dark:text-blue-400 mx-auto border border-blue-100 dark:border-blue-900/40 animate-pulse">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-extrabold tracking-widest text-[#2563eb] dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded border border-blue-100 inline-block">
                      SECURITY PROTOCOL AES-256
                    </span>
                    <h2 className="text-md sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                      MASUK SECURE CONSOLE NOC
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
                      Masukkan kunci autentikasi administrator untuk mengakses dashboard utama, pembukuan keuangan laba-rugi, dan terminal API MikroTik.
                    </p>
                  </div>
                </div>

                {/* Login Form */}
                {adminLockoutTime > 0 ? (
                  <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900 rounded-2xl space-y-3 animate-in fade-in zoom-in duration-300">
                    <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
                    <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-rose-700 dark:text-rose-400">ADMIN CONSOLE LOCKED OUT</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      Sistem mendeteksi aktivitas brute-force berulang (5x percobaan tidak sah). Konsol utama dihentikan sementara demi mempertahankan integritas data SLA.
                    </p>
                    <div className="py-2.5 px-4 bg-rose-100 dark:bg-rose-950/40 rounded-xl inline-block">
                      <span className="text-[15px] font-mono font-black text-rose-650 dark:text-rose-400">
                        {adminLockoutTime} DETIK COOLDOWN
                      </span>
                    </div>
                    <span className="block text-[9px] text-slate-400 font-mono italic">
                      Security policy: Cooldown bertambah jika terus gagal.
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (adminLockoutTime > 0) return;
                      
                      if (adminInputUser === adminUsername && adminInputPass === adminPassword) {
                        setAdminAuthenticated(true);
                        setAdminFailedAttempts(0);
                        localStorage.setItem("noc_admin_logged_in", "true");
                        triggerToast("Autentikasi Sukses! Dekripsi database diizinkan.", "success");
                      } else {
                        const newAtt = adminFailedAttempts + 1;
                        setAdminFailedAttempts(newAtt);
                        if (newAtt >= 5) {
                          setAdminLockoutTime(30);
                          setAdminFailedAttempts(0);
                          triggerToast("Terlalu banyak percobaan gagal! Console dikunci selama 30 detik.", "error");
                        } else {
                          triggerToast(`Username atau Password Salah! Enkripsi ditolak. Sisa percobaan: ${5 - newAtt}`, "error");
                        }
                      }
                    }}
                    className="space-y-4 text-left text-xs"
                    id="admin-form-login"
                  >
                    {adminFailedAttempts > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-400 font-semibold leading-normal flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Sisa toleransi autentikasi: {5 - adminFailedAttempts} kali sebelum login diblokir.</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase font-mono tracking-wide">ID Username Admin</label>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan username admin"
                        value={adminInputUser}
                        onChange={(e) => setAdminInputUser(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl text-slate-800 dark:text-white focus:outline-blue-500 font-mono"
                        id="admin-login-usr"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase font-mono tracking-wide">Password Enkripsi</label>
                      <div className="relative">
                        <input
                          type={showAdminPass ? "text" : "password"}
                          required
                          placeholder="Masukkan password admin"
                          value={adminInputPass}
                          onChange={(e) => setAdminInputPass(e.target.value)}
                          className="w-full text-xs p-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-805 rounded-xl text-slate-800 dark:text-white focus:outline-blue-500 font-mono"
                          id="admin-login-pass"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPass(!showAdminPass)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0"
                          id="admin-pass-toggle"
                        >
                          {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-md uppercase tracking-wider font-mono inline-flex items-center justify-center gap-1.5 shadow-sm"
                      id="btn-admin-submit-auth"
                    >
                      <Lock className="w-3.5 h-3.5" /> Autentikasi Enkripsi Console
                    </button>
                  </form>
                )}

              </div>
            </div>
          );
        }

        // STANDARD FULL ADMINISTRATOR CONSOLE (With sidebar switcher tabs)
        return (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300" id="body-grid">
            
            {/* Navigation Left column */}
            <div className="lg:col-span-3 sticky top-[68px] lg:top-[124px] z-45 flex flex-col gap-4 self-start bg-transparent py-2 lg:py-0" id="sidebar-wrapper">
              <nav className="space-y-1.5 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible pb-1.5 lg:pb-0 scrollbar-none gap-2 lg:gap-0 select-none w-full border-b border-slate-200 lg:border-b-0 pb-2 lg:pb-0" id="sidebar-rail">
                {[
                  { id: "dashboard", label: "Dashboard & Laba Rugi", icon: LayoutDashboard },
                  { id: "clients", label: "Manajemen Pelanggan", icon: Users },
                  { id: "service-categories", label: "Kategori Layanan", icon: Database },
                  { id: "invoices", label: "Manajemen Invoice", icon: FileText },
                  { id: "integration", label: "Integrasi WA & Templat", icon: Settings },
                  { id: "bookkeeping", label: "Buku Kas & Rekonsiliasi", icon: Cpu },
                  { id: "router-monitoring", label: "Monitoring Klien (Router)", icon: Activity },
                  { id: "biz-profile", label: "Profil & Info Usaha NOC", icon: Building2 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-auto lg:w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2.5 shrink-0 cursor-pointer select-none whitespace-nowrap lg:whitespace-normal ${
                        isActive 
                          ? "bg-[#2563eb] text-white font-extrabold shadow-md border-transparent" 
                          : "bg-white dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      id={`sidebar-tab-${tab.id}`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Admin Profile Footer with interactive LOGOUT button */}
              <div className="hidden lg:flex p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 items-center justify-between gap-3 mt-auto shadow-xs animate-in slide-in-from-left duration-250" id="sidebar-profile">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                    AD
                  </div>
                  <div className="overflow-hidden bg-transparent">
                    <p className="text-xs font-semibold text-slate-850 dark:text-slate-250 truncate">Admin NOC</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate leading-none mt-0.5">Manager Plan</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAdminAuthenticated(false);
                    localStorage.setItem("noc_admin_logged_in", "false");
                    setActiveTab("marketing-ecatalog");
                    triggerToast("Sukses Logout dari Secure Console. Enkripsi Terdistribusi.", "info");
                  }}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded bg-transparent cursor-pointer transition-colors"
                  title="Logout Administrator Panel Securely"
                  id="admin-logout-btn"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>

            </div>

            {/* Main Tabs render space details */}
            <div className="lg:col-span-9" id="main-content-display">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {activeTab === "dashboard" && (
                    <DashboardView 
                      clients={clients} 
                      invoices={invoices} 
                      bookkeeping={bookkeeping} 
                      onNavigate={setActiveTab}
                      onResetData={handleResetToEmpty}
                      onUpdateClient={handleUpdateClient}
                    />
                  )}

                  {activeTab === "clients" && (
                    <ClientsView 
                      clients={clients} 
                      invoices={invoices}
                      serviceCategories={serviceCategories}
                      onAddClient={handleAddClient} 
                      onUpdateClient={handleUpdateClient} 
                      onDeleteClient={handleDeleteClient}
                      onAddCategory={handleAddServiceCategory}
                      triggerToast={triggerToast}
                    />
                  )}

                  {activeTab === "service-categories" && (
                    <ServiceCategoriesView 
                      serviceCategories={serviceCategories}
                      clients={clients}
                      onAddCategory={handleAddServiceCategory}
                      onUpdateCategory={handleUpdateServiceCategory}
                      onDeleteCategory={handleDeleteServiceCategory}
                      triggerToast={triggerToast}
                    />
                  )}

                  {activeTab === "invoices" && (
                    <InvoicesView 
                      clients={clients}
                      invoices={invoices}
                      templates={templates}
                      onChangeInvoices={handleChangeInvoices}
                      onAddBookkeeping={handleAddBookkeeping}
                      whatsappConnected={whatsappConnected}
                      onUpdateClient={handleUpdateClient}
                      triggerToast={triggerToast}
                      bizProfile={bizProfile}
                    />
                  )}

                  {activeTab === "integration" && (
                    <IntegrationView 
                      templates={templates}
                      onUpdateTemplate={handleUpdateTemplate}
                      whatsappConnected={whatsappConnected}
                      onSetWhatsappConnected={handleSetWhatsappConnected}
                      clients={clients}
                      invoices={invoices}
                      triggerToast={triggerToast}
                      onResetData={handleResetToEmpty}
                      onRestoreData={handleRestoreFullDb}
                    />
                  )}

                  {activeTab === "bookkeeping" && (
                    <BookkeepingView 
                      bookkeeping={bookkeeping}
                      invoices={invoices}
                      clients={clients}
                      onAddBookkeeping={handleAddBookkeeping}
                      onDeleteBookkeeping={handleDeleteBookkeeping}
                      onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                      triggerToast={triggerToast}
                    />
                  )}

                  {activeTab === "router-monitoring" && (
                    <NetworkMonitoringView 
                      clients={clients}
                      triggerToast={triggerToast}
                      onUpdateClient={handleUpdateClient}
                    />
                  )}

                  {activeTab === "biz-profile" && (
                    <BizProfileView 
                      bizProfile={bizProfile}
                      onUpdateProfile={handleUpdateBizProfile}
                      triggerToast={triggerToast}
                      onResetData={handleResetToEmpty}
                      onRestoreData={handleRestoreFullDb}
                      clients={clients}
                      invoices={invoices}
                      bookkeeping={bookkeeping}
                      templates={templates}
                      adminUsername={adminUsername}
                      adminPassword={adminPassword}
                      onUpdateAdminCredentials={(username, password) => {
                        localStorage.setItem("noc_admin_username", username);
                        localStorage.setItem("noc_admin_password", password);
                        setAdminUsername(username);
                        setAdminPassword(password);
                        triggerToast("Kredensial Admin berhasil diperbarui!", "success");
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        );
      })()}

      {/* Global Human-literal footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400 shrink-0 font-sans" id="global-footer">
        <p className="font-mono">Sistem Invoice & Pelanggan SLA Monitoring NOC © 2026. Keamanan Enkripsi Sandbox Terjamin.</p>
      </footer>

      {/* Premium custom animated float-in toast notification context (mobile-safe Android fallback) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 max-w-md w-11/12 sm:w-full bg-white dark:bg-[#151e2e] rounded-xl border border-slate-200 dark:border-slate-850 shadow-2xl p-4 flex gap-3 pointer-events-auto"
            id="toast-notification-banner"
          >
            <div className="shrink-0 pt-0.5" id="toast-icon-wrap">
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              )}
              {toast.type === "warning" && (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1" id="toast-text-wrap">
              <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                {toast.type === "success" ? "SUKSES" : toast.type === "warning" ? "PERINGATAN" : toast.type === "error" ? "KESALAHAN" : "INFORMASI"}
              </h5>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium mt-1 whitespace-pre-line leading-relaxed" id="toast-msg">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer self-start p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              id="close-toast-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
