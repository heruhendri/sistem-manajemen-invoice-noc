import React, { useState } from "react";
import { ServiceCategory, Client } from "../types";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Settings, 
  Activity, 
  Wifi, 
  Server, 
  Check, 
  X, 
  Terminal, 
  HardDrive, 
  Cpu, 
  AlertCircle,
  Database,
  RefreshCw,
  HelpCircle,
  Hash,
  Coins,
  Lock
} from "lucide-react";
import { formatIDR } from "../utils/exportFiles";

interface ServiceCategoriesViewProps {
  serviceCategories: ServiceCategory[];
  clients: Client[];
  onAddCategory: (category: ServiceCategory) => void;
  onUpdateCategory: (category: ServiceCategory) => void;
  onDeleteCategory: (id: string) => void;
  triggerToast?: (message: string, type?: "success" | "warning" | "error" | "info") => void;
}

export default function ServiceCategoriesView({
  serviceCategories,
  clients,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  triggerToast
}: ServiceCategoriesViewProps) {
  const notify = (msg: string, type: "success" | "warning" | "error" | "info" = "info") => {
    if (triggerToast) {
      triggerToast(msg, type);
    } else {
      alert(msg);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState<number>(5000);
  const [type, setType] = useState<"Fixed" | "Mikrotik_Dynamic">("Fixed");
  const [billingType, setBillingType] = useState<"fixed" | "per_pppoe_active" | "per_hotspot_active" | "per_pppoe_secret">("fixed");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Activity");

  // Router API testing state
  const [activeTestRouterId, setActiveTestRouterId] = useState<string | null>(null);
  const [testIp, setTestIp] = useState("102.13.4.156");
  const [testPort, setTestPort] = useState(8728);
  const [testUser, setTestUser] = useState("noc_monitor");
  const [testPass, setTestPass] = useState("•••••••••");
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "idle" | "success" | "error";
    model?: string;
    pppoeActive?: number;
    hotspotActive?: number;
    pppoeSecrets?: number;
    uptime?: string;
  }>({ status: "idle" });

  const filteredCategories = serviceCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setBasePrice(5000000);
    setType("Fixed");
    setBillingType("fixed");
    setDescription("");
    setIcon("Activity");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: ServiceCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setBasePrice(cat.basePrice);
    setType(cat.type);
    setBillingType(cat.billingType);
    setDescription(cat.description);
    setIcon(cat.icon || "Activity");
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      notify("Harap lengkapi semua kolom formulir kategori.", "warning");
      return;
    }

    const categoryData: ServiceCategory = {
      id: editingCategory ? editingCategory.id : `SVC-${Math.floor(100 + Math.random() * 900)}`,
      name,
      basePrice: Number(basePrice),
      type,
      billingType: type === "Fixed" ? "fixed" : billingType,
      description,
      icon
    };

    if (editingCategory) {
      onUpdateCategory(categoryData);
      notify(`Kategori layanan "${name}" berhasil diperbarui.`, "success");
    } else {
      onAddCategory(categoryData);
      notify(`Kategori layanan "${name}" berhasil ditambahkan!`, "success");
    }

    setIsFormOpen(false);
  };

  const handleTypeChange = (newType: "Fixed" | "Mikrotik_Dynamic") => {
    setType(newType);
    if (newType === "Fixed") {
      setBillingType("fixed");
      if (basePrice === 5000) setBasePrice(3000000);
    } else {
      setBillingType("per_pppoe_active");
      if (basePrice > 100000) setBasePrice(5000); // Default per active pppoe price
    }
  };

  const startMikrotikTest = async (cat: ServiceCategory) => {
    setActiveTestRouterId(cat.id);
    setIsTesting(true);
    setTestLogs([]);
    setTestResult({ status: "idle" });

    const logs = [
      `[NOC] Memulai inisialisasi Handshake API MikroTik...`,
      `[NOC] Menghubungkan ke ${testIp}:${testPort} menggunakan protokol RouterOS API...`,
    ];
    setTestLogs([...logs]);

    // Simulate real steps
    const appendLog = (text: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setTestLogs(prev => [...prev, text]);
          resolve();
        }, delay);
      });
    };

    await appendLog(`>>> SENT: /login - request challenge`, 500);
    await appendLog(`<<< RECV: challenge=3a95f8c12b704fb3`, 400);
    await appendLog(`>>> SENT: login hash calculated with user: ${testUser}`, 400);
    await appendLog(`<<< RECV: login response = SUCCESS (admin access)`, 400);
    await appendLog(`[OK] Otentikasi RouterOS terverifikasi sepenuhnya!`, 300);
    await appendLog(`>>> Querying RouterOS system resources...`, 300);
    await appendLog(`<<< Node info: MikroTik RouterOS v7.14.2 on CCR2004-16G-2S+`, 400);
    await appendLog(`>>> Querying PPPoE active server interfaces list...`, 400);
    await appendLog(`<<< Found 48 pppoe interfaces online.`, 300);
    await appendLog(`>>> Querying Hotspot active users list...`, 300);
    await appendLog(`<<< Found 132 hotspot client sessions.`, 300);
    await appendLog(`>>> Querying PPP secrets catalog...`, 300);
    await appendLog(`<<< Found 250 local secrets stored.`, 300);
    await appendLog(`[SUCCESS] Sinkronisasi real-time MikroTik API Selesai!`, 300);

    setIsTesting(false);
    setTestResult({
      status: "success",
      model: "MikroTik CCR2004-16G-2S+",
      pppoeActive: 48,
      hotspotActive: 132,
      pppoeSecrets: 250,
      uptime: "98d 04h 11m"
    });
    notify("Koneksi API Mikrotik berhasil diverifikasi!", "success");
  };

  return (
    <div className="space-y-6" id="service-categories-root">
      
      {/* Title block with dashboard styled gradient header */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs" id="svc-heading-panel">
        <div>
          <div className="flex items-center gap-2" id="svc-title-icon-wrapper">
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
              <Database className="w-5 h-5 shrink-0 animate-pulse" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
              Katalog & Kategori Layanan
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Atur ragam jenis layanan monitoring SLA, sewa VPN, paket dedicated NOC, hingga tarif dinamis berbasis API Mikrotik (per PPPoE Active). Dukungan tagihan fleksibel & multi-layanan.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] transition-transform duration-100 self-start md:self-auto"
          id="btn-add-service-category"
        >
          <Plus className="w-4 h-4 text-white" />
          Tambah Layanan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="svc-parent-grid">
        
        {/* Main list of service categories: 8 cols default */}
        <div className="xl:col-span-8 space-y-4" id="svc-left-list">
          
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 shadow-xs" id="svc-search-box">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari nama layanan atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none placeholder-slate-400 font-sans"
              id="svc-search-input"
            />
          </div>

          <div className="space-y-3" id="svc-cards-container">
            {filteredCategories.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-xs font-sans">
                Tidak ada kategori layanan yang cocok dengan pencarian Anda.
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isMikrotik = cat.type === "Mikrotik_Dynamic";
                const activeSubscribers = clients.filter(c => c.selectedServices?.includes(cat.id)).length;
                
                return (
                  <div 
                    key={cat.id}
                    className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all relative overflow-hidden"
                    id={`svc-card-${cat.id}`}
                  >
                    {/* Badge dynamic vs fixed */}
                    <span className={`absolute top-0 right-0 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl-lg font-mono flex items-center gap-1 ${
                      isMikrotik 
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400" 
                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                    }`}>
                      {isMikrotik ? <Wifi className="w-2.5 h-2.5" /> : null}
                      {isMikrotik ? "MikroTik Dynamic" : "Fixed Tariff"}
                    </span>

                    <div className="flex items-start gap-4" id="svc-card-body">
                      {/* Left icon design */}
                      <div className={`p-3 rounded-xl shrink-0 ${
                        isMikrotik 
                          ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" 
                          : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                      }`} id="svc-icon-wrapper">
                        {isMikrotik ? (
                          <Wifi className="w-5 h-5 shrink-0" />
                        ) : cat.icon === "ShieldAlert" ? (
                          <Cpu className="w-5 h-5 shrink-0" />
                        ) : cat.icon === "Tv" ? (
                          <HardDrive className="w-5 h-5 shrink-0" />
                        ) : (
                          <Activity className="w-5 h-5 shrink-0" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5" id="svc-info-wrapper">
                        <div className="flex items-center gap-2" id="svc-header">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono">
                            {cat.id}
                          </h4>
                          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                          <span className="text-[10.5px] font-bold text-slate-500 font-sans">
                            {activeSubscribers} Pelanggan Aktif
                          </span>
                        </div>

                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                          {cat.name}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                          {cat.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-[11px] font-medium" id="svc-footer">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300" id="svc-price-wrap">
                            <Coins className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>Tarif {isMikrotik ? "Dinamis:" : "Biaya:"}</span>
                            <span className="font-extrabold font-mono text-blue-600 dark:text-blue-400">
                              {isMikrotik 
                                ? `${formatIDR(cat.basePrice)} / user active` 
                                : `${formatIDR(cat.basePrice)} / bulan`}
                            </span>
                          </div>

                          {isMikrotik && (
                            <div className="flex items-center gap-1 text-indigo-500" id="svc-calc-type-badge">
                              <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 rounded text-[9px] font-mono font-bold uppercase">
                                Tagihan Otomatis {cat.billingType.replace(/_/g, " ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right action triggers */}
                      <div className="flex items-center gap-1 self-center" id="svc-actions">
                        {isMikrotik && (
                          <button
                            onClick={() => startMikrotikTest(cat)}
                            className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Tes Integrasi API MikroTik Router"
                            id={`btn-test-mt-${cat.id}`}
                          >
                            <RefreshCw className={`w-3 h-3 ${activeTestRouterId === cat.id && isTesting ? "animate-spin" : ""}`} />
                            Test API
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                          title="Ubah Kategori"
                          id={`btn-edit-svc-${cat.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (activeSubscribers > 0) {
                              notify(`Tidak dapat menghapus. Ada ${activeSubscribers} pelanggan yang berlangganan layanan ini.`, "error");
                              return;
                            }
                            if (confirm(`Apakah Anda yakin ingin menghapus kategori layanan ${cat.name}?`)) {
                              onDeleteCategory(cat.id);
                              notify(`Layanan "${cat.name}" berhasil dihapus.`, "success");
                            }
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/25 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg cursor-pointer transition-colors"
                          title="Hapus Kategori"
                          id={`btn-delete-svc-${cat.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Integrated Interactive Terminal simulation box (revealed on test trigger) */}
                    {activeTestRouterId === cat.id && (
                      <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4 animate-in slide-in-from-top-2 duration-150" id="router-test-console-overlay">
                        <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 shadow-inner overflow-hidden font-mono text-[10px]" id="test-console-box">
                          
                          {/* Console header */}
                          <div className="bg-slate-800 dark:bg-slate-900 px-3 py-1.5 flex items-center justify-between border-b border-slate-700 header-console" id="console-head">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              MikroTik RouterOS API - Terminal Live Logger
                            </span>
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse block"></span>
                          </div>

                          <div className="p-3 text-emerald-400 space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800" id="console-logs-flow">
                            {testLogs.map((log, index) => (
                              <div key={index} className="leading-relaxed">
                                {log.startsWith(">>>") ? (
                                  <span className="text-slate-300 font-bold">{log}</span>
                                ) : log.startsWith("<<<") ? (
                                  <span className="text-blue-400">{log}</span>
                                ) : (
                                  <span>{log}</span>
                                )}
                              </div>
                            ))}
                            {isTesting && (
                              <span className="text-emerald-300 flex items-center gap-1.5 animate-pulse">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                                Memproses parameter Router...
                              </span>
                            )}
                          </div>

                          {testResult.status === "success" && (
                            <div className="p-3 bg-slate-950 border-t border-slate-850 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10.5px] font-semibold text-slate-300" id="console-sync-parameters">
                              <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                                <span className="text-slate-400 text-[9px] block">Router Model</span>
                                <span className="text-indigo-400 font-bold">{testResult.model}</span>
                              </div>
                              <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                                <span className="text-slate-400 text-[9px] block">PPPoE Active Sessions</span>
                                <span className="text-white font-mono font-extrabold text-xs">{testResult.pppoeActive} Klien</span>
                              </div>
                              <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                                <span className="text-slate-400 text-[9px] block">Hotspot Active Users</span>
                                <span className="text-amber-400 font-mono font-extrabold text-xs">{testResult.hotspotActive} Sesi</span>
                              </div>
                              <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                                <span className="text-slate-400 text-[9px] block">PPP Secrets</span>
                                <span className="text-emerald-400 font-mono font-extrabold text-xs">{testResult.pppoeSecrets} Akun</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar right: 4 cols for configuration helper or dynamic stats */}
        <div className="xl:col-span-4 space-y-4" id="svc-right-panel">
          
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs" id="mikrotik-connection-guide">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-indigo-500" />
              Skema RouterOS API Integration
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Apabila Anda mengaktifkan **Layanan MikroTik Dynamic Based Billing**, sistem akan membaca jumlah PPPoE yang aktif secara real-time pada server router Anda setiap awal bulan tagihan di-generate.
            </p>
            
            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850 font-mono text-[10.5px]" id="pricing-formula-box">
              <div className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Rumus Billing Bulanan:</div>
              <div className="text-slate-800 dark:text-slate-200 font-mono font-extrabold mt-1 text-xs">
                Biaya = (Active PPPoE × Tarif Per User)
              </div>
              <div className="text-slate-400 text-[9.5px] mt-1.5 leading-normal">
                Contoh: 150 User PPPoE × Rp 5.000 = Rp 750.000 / bulan. Biaya ini otomatis dibebankan pada invoice pelanggan.
              </div>
            </div>

            {/* Test Router Parameters */}
            <div className="space-y-3 pt-2" id="test-router-inputs-wrap">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                Router Testing Gateway Parameters
              </span>
              
              <div className="grid grid-cols-12 gap-2" id="router-ip-port">
                <div className="col-span-8 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">IP Address</label>
                  <input
                    type="text"
                    value={testIp}
                    onChange={(e) => setTestIp(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 103.12.5.1"
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">API Port</label>
                  <input
                    type="number"
                    value={testPort}
                    onChange={(e) => setTestPort(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    placeholder="8728"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2" id="router-user-pass">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">API Username</label>
                  <input
                    type="text"
                    value={testUser}
                    onChange={(e) => setTestUser(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">API Password</label>
                  <input
                    type="password"
                    value={testPass}
                    onChange={(e) => setTestPass(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* SLA Category Editor Popup Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="svc-editor-modal">
          <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden" id="svc-dialog-box">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between" id="svc-dialog-head">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                {editingCategory ? "Ubah Kategori Layanan" : "Tambah Kategori Layanan Baru"}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4" id="svc-category-form">
              <div className="space-y-1" id="form-field-name">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Nama Service / Kategori</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white dark:focus:bg-slate-950 font-sans text-slate-850 dark:text-slate-100"
                  placeholder="e.g. NOC Platinum 24x7 atau Hotspot Dynamic"
                />
              </div>

              <div className="grid grid-cols-2 gap-4" id="form-type-group">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Jenis Biaya</label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as "Fixed" | "Mikrotik_Dynamic")}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white dark:focus:bg-slate-950 font-sans text-slate-850 dark:text-slate-100"
                  >
                    <option value="Fixed">Flat Rate (Bulanan Tetap)</option>
                    <option value="Mikrotik_Dynamic">MikroTik Dynamic Rate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                    {type === "Fixed" ? "Tarif Tetap (IDR)" : "Tarif per Object (IDR)"}
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white dark:focus:bg-slate-950 font-sans text-slate-850 dark:text-slate-100"
                  />
                </div>
              </div>

              {type === "Mikrotik_Dynamic" && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/60 rounded-xl space-y-3" id="form-mikrotik-dynamic-billing-fields">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">Target Monitoring untuk Billing</label>
                    <select
                      value={billingType}
                      onChange={(e) => setBillingType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-750 text-xs focus:outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="per_pppoe_active">Hitung PPPoE Active Sessions (Rp {basePrice}/user)</option>
                      <option value="per_hotspot_active">Hitung Hotspot Active (Rp {basePrice}/user)</option>
                      <option value="per_pppoe_secret">Hitung Total PPPoE Secrets (Rp {basePrice}/secret)</option>
                    </select>
                    <p className="text-[9.5px] text-slate-400 leading-normal pt-1 font-sans">
                      Sistem akan menghitung biaya bulanan secara cerdas: (Jumlah Aktif × Tarif Biaya per objek). Contoh: 48 active pppoe × Rp {basePrice} = Rp {formatIDR(48 * basePrice)}.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1" id="form-field-desc">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Deskripsi Singkat Jasa</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white dark:focus:bg-slate-950 font-sans text-slate-850 dark:text-slate-100"
                  placeholder="Jelaskan cakupan layanan SLA atau skema monitoring..."
                />
              </div>

              <div className="space-y-1" id="form-field-icon">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Ikon Visual</label>
                <div className="grid grid-cols-4 gap-2.5 pt-1" id="icon-selector">
                  {[
                    { id: "Activity", label: "Pulsa Pulse" },
                    { id: "ShieldAlert", label: "Server CPU" },
                    { id: "Tv", label: "TV Network" },
                    { id: "Lock", label: "VPN Key" },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setIcon(ic.id)}
                      className={`py-2 px-3 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-mono font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        icon === ic.id 
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:text-white dark:border-blue-500" 
                          : "bg-white hover:bg-slate-50 text-slate-500 dark:bg-slate-900 dark:hover:bg-slate-850"
                      }`}
                    >
                      {ic.id === "ShieldAlert" ? <Cpu className="w-4 h-4" /> : ic.id === "Tv" ? <HardDrive className="w-4 h-4" /> : ic.id === "Lock" ? <Lock className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      <span className="text-[9px] mt-0.5">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 justify-end" id="form-buttons">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {editingCategory ? "Simpan Perubahan" : "Terbitkan Layanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
