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
  Info,
  X,
  Database,
  Wifi,
  Server
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("noc_billing_dark_mode") === "true";
  });

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
    const data = loadData();
    setClients(data.clients);
    setInvoices(data.invoices);
    setTemplates(data.templates);
    setBookkeeping(data.bookkeeping);
    setServiceCategories(data.serviceCategories);

    const waSynced = localStorage.getItem("noc_billing_whatsapp_connected") === "true";
    setWhatsappConnected(waSynced);
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

  // Sync to local storage wrapper on any change
  const syncState = (
    updatedClients: Client[],
    updatedInvoices: Invoice[],
    updatedBookkeeping: BookkeepingRecord[],
    updatedTemplates: NotificationTemplate[],
    updatedCategories: ServiceCategory[] = serviceCategories
  ) => {
    saveData({
      clients: updatedClients,
      invoices: updatedInvoices,
      bookkeeping: updatedBookkeeping,
      templates: updatedTemplates,
      serviceCategories: updatedCategories
    });
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

  const handleDeleteClient = (id: string) => {
    const updated = clients.filter(c => c.id !== id);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" id="header-content-wrap">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5" id="brand-area">
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
              <h1 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1 truncate max-w-[160px] sm:max-w-[280px]" id="brand-title">
                {bizProfile.billingName}
              </h1>
            </div>
          </div>

          {/* Connected health monitor badge label */}
          <div className="flex items-center gap-3" id="telemetry-badge-area">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors duration-150 flex items-center justify-center gap-1.5 focus:outline-none bg-white dark:bg-slate-900"
              title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              id="theme-toggler-btn"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                {darkMode ? "Mode Terang" : "Mode Gelap"}
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

      {/* Main Responsive Grid Layout containing Side Navigation and tabs core views */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6" id="body-grid">
        
        {/* Navigation panel columns: 3/12 cols - Sticky Layout in Desktop and Mobile-friendly scroll */}
        <div className="lg:col-span-3 sticky top-[68px] lg:top-[88px] z-45 flex flex-col gap-4 self-start bg-slate-50 dark:bg-[#090d16] py-2 lg:py-0" id="sidebar-wrapper">
          <nav className="space-y-1.5 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible pb-1.5 lg:pb-0 scrollbar-none gap-2 lg:gap-0 select-none w-full border-b border-slate-200 lg:border-b-0 pb-2 lg:pb-0" id="sidebar-rail">
            {[
              { id: "dashboard", label: "Dashboard & Laba Rugi", icon: LayoutDashboard },
              { id: "clients", label: "Manajemen Pelanggan", icon: Users },
              { id: "service-categories", label: "Kategori Layanan", icon: Database },
              { id: "invoices", label: "Manajemen Invoice", icon: FileText },
              { id: "integration", label: "Integrasi WA & Templat", icon: Settings },
              { id: "bookkeeping", label: "Buku Kas & Rekonsiliasi", icon: Cpu },
              { id: "router-monitoring", label: "Monitoring Klien (Router)", icon: Activity },
              { id: "customer-portal", label: "Portal Pelanggan (Simulasi)", icon: UserCheck2 },
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
                      ? "bg-blue-600 text-white font-extrabold shadow-md border-transparent" 
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

          {/* Admin Profile Footer segment from design theme */}
          <div className="hidden lg:flex p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 items-center gap-3 mt-auto shadow-xs" id="sidebar-profile">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-250 truncate">Admin NOC</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">Manager Plan</p>
            </div>
          </div>
        </div>

        {/* View Switch core column with fluid transitions */}
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
                />
              )}

              {activeTab === "bookkeeping" && (
                <BookkeepingView 
                  bookkeeping={bookkeeping}
                  invoices={invoices}
                  clients={clients}
                  onAddBookkeeping={handleAddBookkeeping}
                  onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                  triggerToast={triggerToast}
                />
              )}

              {activeTab === "router-monitoring" && (
                <NetworkMonitoringView 
                  clients={clients}
                  triggerToast={triggerToast}
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
                />
              )}

              {activeTab === "biz-profile" && (
                <BizProfileView 
                  bizProfile={bizProfile}
                  onUpdateProfile={handleUpdateBizProfile}
                  triggerToast={triggerToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

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
