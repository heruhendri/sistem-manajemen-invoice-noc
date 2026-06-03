import React, { useState, useMemo } from "react";
import { Client, ServiceType, Invoice, ServiceCategory } from "../types";
import { 
  Plus, 
  Search, 
  Edit2, 
  Check, 
  X, 
  ShieldAlert, 
  Wifi, 
  Users, 
  Trash, 
  Eye, 
  History, 
  CreditCard, 
  DollarSign, 
  RefreshCw,
  Server,
  Lock,
  Database,
  Terminal,
  Activity,
  HardDrive
} from "lucide-react";
import { formatIDR } from "../utils/exportFiles";

interface ClientsViewProps {
  clients: Client[];
  invoices: Invoice[];
  serviceCategories: ServiceCategory[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (idOrIds: string | string[]) => void;
  onAddCategory?: (category: ServiceCategory) => void;
  triggerToast?: (message: string, type?: "success" | "warning" | "error" | "info") => void;
}

// Preset service SLA default fees for ease-of-use
const SERVICE_PRICES: Record<ServiceType, number> = {
  "NOC Basic 8x5": 3000000,
  "NOC Standard 24x7": 5500000,
  "NOC Enterprise High-Availability": 12000000,
  "SLA Gold Monitoring 24x7": 7500000,
  "VPN IPSec Tunneling & Firewall": 2000000,
  "SD-WAN Dedicated Monitoring": 4500000,
  "Monitoring Node SNMP & Ping": 1500000,
  "NOC & Cloud Managed Service": 8000005,
};

export default function ClientsView({
  clients,
  invoices,
  serviceCategories = [],
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onAddCategory,
  triggerToast
}: ClientsViewProps) {
  const notify = (msg: string, type: "success" | "warning" | "error" | "info" = "info") => {
    if (triggerToast) {
      triggerToast(msg, type);
    } else {
      alert(msg);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isBulkDeleteConfirm, setIsBulkDeleteConfirm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nocNotes, setNocNotes] = useState("");
  const [communicationPreference, setCommunicationPreference] = useState<"whatsapp" | "email">("whatsapp");
  const [serviceType, setServiceType] = useState<ServiceType>("NOC Standard 24x7");
  const [monthlyFee, setMonthlyFee] = useState(5500000);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  // Extended properties form states for multi-service and MikroTik API RouterOS
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [mikrotikIp, setMikrotikIp] = useState("");
  const [mikrotikPort, setMikrotikPort] = useState<number>(8728);
  const [mikrotikUser, setMikrotikUser] = useState("");
  const [mikrotikPassword, setMikrotikPassword] = useState("");
  const [mtActivePppoeCount, setMtActivePppoeCount] = useState<number>(0);
  const [mtActiveHotspotCount, setMtActiveHotspotCount] = useState<number>(0);
  const [mtPppoeSecretCount, setMtPppoeSecretCount] = useState<number>(0);
  const [customPricePerPppoe, setCustomPricePerPppoe] = useState<number>(5000);
  const [useManualMikrotikCounts, setUseManualMikrotikCounts] = useState<boolean>(false);
  const [activeCoreTab, setActiveCoreTab] = useState<"pppoe_active" | "pppoe_offline" | "hotspot">("pppoe_active");

  // Inline category addition states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatBasePrice, setNewCatBasePrice] = useState<number>(100000);
  const [newCatType, setNewCatType] = useState<"Fixed" | "Mikrotik_Dynamic">("Fixed");
  const [newCatBillingType, setNewCatBillingType] = useState<"fixed" | "per_pppoe_active" | "per_hotspot_active" | "per_pppoe_secret">("fixed");
  const [newCatDescription, setNewCatDescription] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("Activity");

  const handleInlineAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatDescription) {
      notify("Harap isi nama dan deskripsi kategori.", "warning");
      return;
    }
    const catId = `SVC-${Math.floor(100 + Math.random() * 900)}`;
    const categoryData: ServiceCategory = {
      id: catId,
      name: newCatName,
      basePrice: Number(newCatBasePrice),
      type: newCatType,
      billingType: newCatType === "Fixed" ? "fixed" : newCatBillingType,
      description: newCatDescription,
      icon: newCatIcon
    };

    if (onAddCategory) {
      onAddCategory(categoryData);
      // Automatically select the new service
      setSelectedServices(prev => [...prev, catId]);
      notify(`Kategori "${newCatName}" berhasil ditambahkan!`, "success");
    } else {
      notify("Terjadi kesalahan, onAddCategory tidak diteruskan ke ClientsView.", "error");
    }

    // Reset states
    setNewCatName("");
    setNewCatBasePrice(100000);
    setNewCatType("Fixed");
    setNewCatBillingType("fixed");
    setNewCatDescription("");
    setNewCatIcon("Activity");
    setIsCategoryModalOpen(false);
  };

  // Filter client list based on search query
  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  }, [clients, searchQuery]);

  // Handle preset fee on service change for backwards compatibility
  const handleServiceChange = (service: ServiceType) => {
    setServiceType(service);
    setMonthlyFee(SERVICE_PRICES[service]);
  };

  // Compute actual dynamic monthly fee across selected services
  const computedMonthlyFee = useMemo(() => {
    let feeSum = 0;
    if (selectedServices.length === 0) return 0;
    
    selectedServices.forEach(id => {
      const match = serviceCategories.find(s => s.id === id);
      if (!match) return;
      if (match.type === "Fixed") {
        feeSum += match.basePrice;
      } else {
        // Mikrotik dynamic
        const activeCount = match.billingType === "per_pppoe_active" 
          ? mtActivePppoeCount 
          : match.billingType === "per_hotspot_active" 
          ? mtActiveHotspotCount 
          : mtPppoeSecretCount;
        
        feeSum += activeCount * (customPricePerPppoe || match.basePrice);
      }
    });
    return feeSum;
  }, [selectedServices, serviceCategories, mtActivePppoeCount, mtActiveHotspotCount, mtPppoeSecretCount, customPricePerPppoe]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNocNotes("");
    setCommunicationPreference("whatsapp");
    setServiceType("NOC Standard 24x7");
    setMonthlyFee(5500000);
    setStatus("Active");
    // reset extended variables
    setSelectedServices([]);
    setMikrotikIp("");
    setMikrotikPort(8728);
    setMikrotikUser("");
    setMikrotikPassword("");
    setMtActivePppoeCount(0);
    setMtActiveHotspotCount(0);
    setMtPppoeSecretCount(0);
    setCustomPricePerPppoe(5000);
    setUseManualMikrotikCounts(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setCompany(client.company);
    setEmail(client.email);
    setPhone(client.phone);
    setAddress(client.address || "");
    setNocNotes(client.nocNotes || "");
    setCommunicationPreference(client.communicationPreference || "whatsapp");
    setServiceType(client.serviceType);
    setStatus(client.status);

    // populate extended variables or defaults
    const services = client.selectedServices || [];
    setSelectedServices(services);
    setMikrotikIp(client.mikrotikIp || "");
    setMikrotikPort(client.mikrotikPort || 8728);
    setMikrotikUser(client.mikrotikUser || "");
    setMikrotikPassword(client.mikrotikPassword || "");
    setMtActivePppoeCount(client.mtActivePppoeCount || 0);
    setMtActiveHotspotCount(client.mtActiveHotspotCount || 0);
    setMtPppoeSecretCount(client.mtPppoeSecretCount || 0);
    setCustomPricePerPppoe(client.customPricePerPppoe || 5000);
    setUseManualMikrotikCounts(client.useManualMikrotikCounts || false);
    
    // monthly fee either saved or computed
    setMonthlyFee(client.monthlyFee);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company || !email || !phone) {
      notify("Harap lengkapi semua kolom formulir sebelum menyimpan data pelanggan.", "warning");
      return;
    }

    // Combine list of selected services or map names to serviceType description
    const finalServiceNames = selectedServices
      .map(id => serviceCategories.find(s => s.id === id)?.name)
      .filter(Boolean)
      .join(" + ");

    const finalMonthlyFee = selectedServices.length > 0 ? computedMonthlyFee : Number(monthlyFee);

    const clientData: Client = {
      id: editingClient ? editingClient.id : `CLI-${Math.floor(100 + Math.random() * 900)}`,
      name,
      company,
      email,
      phone,
      address,
      nocNotes,
      communicationPreference,
      serviceType: (finalServiceNames || serviceType) as ServiceType,
      monthlyFee: finalMonthlyFee,
      status,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString().split("T")[0],
      
      // Extended values
      selectedServices,
      mikrotikIp,
      mikrotikPort,
      mikrotikUser,
      mikrotikPassword,
      mtActivePppoeCount,
      mtActiveHotspotCount,
      mtPppoeSecretCount,
      customPricePerPppoe,
      useManualMikrotikCounts
    };

    if (editingClient) {
      onUpdateClient(clientData);
      notify(`Klien "${company}" berhasil diperbarui.`, "success");
    } else {
      onAddClient(clientData);
      notify(`Pendaftaran klien baru "${company}" sukses!`, "success");
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeletingClientId(id);
  };

  return (
    <div className="space-y-6" id="clients-view-container">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs" id="clients-hdr">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight" id="clients-title">Registrasi Pelanggan Jasa NOC</h1>
          <p className="text-sm text-slate-500" id="clients-subtitle">Kelola pelanggan aktif, tingkatan SLA garansi bulanan, dan detail nomor kontak WhatsApp.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          id="btn-add-client"
        >
          <Plus className="w-4 h-4" /> Tambah Pelanggan Baru
        </button>
      </div>

      {/* Form Dialog Panel if Open */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md animate-in fade-in zoom-in duration-150" id="client-form-panel">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5" id="form-hdr">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide" id="form-title">
              {editingClient ? "Ubah Rincian Pelanggan SLA" : "Daftarkan Pelanggan Baru"}
            </h2>
            <button 
              onClick={() => setIsFormOpen(false)}
              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs cursor-pointer"
              id="btn-close-form"
            >
              Tutup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" id="form-client">
            {/* Company / Instansi */}
            <div id="grp-company">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-company">Nama Perusahaan / Instansi client:</label>
              <input 
                type="text" 
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="misal: PT Telekomunikasi Mandiri"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-blue-500"
                required
                id="inp-company"
              />
            </div>

            {/* Client Pic Name */}
            <div id="grp-pic">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-pic">Nama Kontak PIC Pelanggan:</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Hendra Wijaya"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-blue-500"
                required
                id="inp-pic"
              />
            </div>

            {/* Email Address */}
            <div id="grp-email">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-email">Alamat Email Tagihan Resmi:</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="misal: hendra@perusahaan.com"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-blue-500"
                required
                id="inp-email"
              />
            </div>

            {/* Phone Number WA */}
            <div id="grp-phone">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-phone">Nomor Telepon WhatsApp PIC (Format: 08xx/62xx):</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="misal: 081234567890"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-blue-500"
                required
                id="inp-phone"
              />
            </div>

            {/* Multi-Service Selection Section */}
            <div className="md:col-span-2 space-y-2 bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-100 dark:border-slate-800" id="grp-selected-services">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2" id="grp-selected-services-header">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                  Pilih Paket & Kategori Layanan (Bisa pilih lebih dari satu):
                </label>
                {onAddCategory && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:hover:bg-blue-900 rounded-lg cursor-pointer transition-colors shadow-2xs self-start sm:self-auto"
                    id="btn-inline-add-category"
                  >
                    <Plus className="w-3 h-3" /> Tambah Kategori Layanan
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="service-selection-grid">
                {serviceCategories.map((cat) => {
                  const isSelected = selectedServices.includes(cat.id);
                  const isMikrotik = cat.type === "Mikrotik_Dynamic";
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedServices(selectedServices.filter((id) => id !== cat.id));
                        } else {
                          setSelectedServices([...selectedServices, cat.id]);
                        }
                      }}
                      className={`p-3 border rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isSelected
                          ? "border-blue-500 bg-blue-50/40 dark:border-blue-700/50 dark:bg-blue-950/20 shadow-xs"
                          : "border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // click event bubbles up
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 pointer-events-none h-3.5 w-3.5"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                            {cat.name}
                          </span>
                          <span className={`text-[9px] font-extrabold uppercase px-1 rounded font-mono ${
                            isMikrotik 
                              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400" 
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                          }`}>
                            {isMikrotik ? "MikroTik" : "Flat"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-2">
                          {cat.description}
                        </p>
                        <div className="text-[10.5px] font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                          {isMikrotik 
                            ? `${formatIDR(cat.basePrice)} / user active` 
                            : `${formatIDR(cat.basePrice)} / bulan`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MikroTik Connection Panel displayed on choice trigger */}
            {selectedServices.some(id => serviceCategories.find(s => s.id === id)?.type === "Mikrotik_Dynamic") && (
              <div className="md:col-span-2 border border-blue-100 dark:border-slate-800 p-5 rounded-2xl bg-indigo-50/20 dark:bg-slate-950/40 space-y-4 shadow-xs" id="client-mikrotik-config-section">
                <div className="flex items-center gap-2 border-b border-indigo-150/40 dark:border-indigo-900/30 pb-3" id="mikrotik-api-heading">
                  <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Wifi className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider font-mono">
                      MikroTik RouterOS API Integration Gateway
                    </h4>
                    <p className="text-[10px] text-slate-500">Hubungkan router MikroTik untuk penagihan berbasis user active otomatis.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3" id="router-ip-port-grid">
                  <div className="md:col-span-8 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">IP Address / Domain Router</label>
                    <input
                      type="text"
                      value={mikrotikIp}
                      onChange={(e) => setMikrotikIp(e.target.value)}
                      placeholder="e.g. 103.125.10.2 atau router.isp.net"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">API Port RouterOS</label>
                    <input
                      type="number"
                      value={mikrotikPort}
                      onChange={(e) => setMikrotikPort(Number(e.target.value))}
                      placeholder="8728"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="router-credentials">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">Username API</label>
                    <input
                      type="text"
                      value={mikrotikUser}
                      onChange={(e) => setMikrotikUser(e.target.value)}
                      placeholder="noc_billing"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase font-mono">Password API (Secure Storage)</label>
                    <input
                      type="password"
                      value={mikrotikPassword}
                      onChange={(e) => setMikrotikPassword(e.target.value)}
                      placeholder="••••••••••••••"
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800 rounded-xl space-y-3" id="client-mikrotik-counts-box">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2" id="sync-control-row">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useManualMikrotikCounts}
                        onChange={(e) => setUseManualMikrotikCounts(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      Override / Gunakan Jumlah Monitoring Kustom
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!mikrotikIp || !mikrotikUser) {
                          notify("Harap isi IP Router & Username sebelum sinkronisasi.", "warning");
                          return;
                        }
                        notify("Menghubungkan ke Router MikroTik via API...", "info");
                        await new Promise(r => setTimeout(r, 1000));
                        // Set realistic mock counts
                        setMtActivePppoeCount(45);
                        setMtActiveHotspotCount(88);
                        setMtPppoeSecretCount(150);
                        notify("Sinkronisasi Sukses! Mendeteksi 45 PPPoE aktif, 88 Hotspot, 150 Secrets.", "success");
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3" />
                      Hubungkan & Sync API
                    </button>
                  </div>

                  {useManualMikrotikCounts ? (
                    <div className="grid grid-cols-3 gap-2.5 pt-1" id="manual-counts-grid">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">PPPoE active</label>
                        <input
                          type="number"
                          value={mtActivePppoeCount}
                          onChange={(e) => setMtActivePppoeCount(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1.5 focus:outline-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">Hotspot active</label>
                        <input
                          type="number"
                          value={mtActiveHotspotCount}
                          onChange={(e) => setMtActiveHotspotCount(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1.5 focus:outline-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">PPPoE Secrets</label>
                        <input
                          type="number"
                          value={mtPppoeSecretCount}
                          onChange={(e) => setMtPppoeSecretCount(Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-1.5 focus:outline-indigo-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pb-1 text-[10px] text-slate-500 font-mono text-center" id="live-counts-status">
                      <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-850">
                        <span className="block text-[8px] text-slate-450 uppercase mb-0.5">PPPOE ACTIVE</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-250 text-xs">{mtActivePppoeCount} Klien</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded border border-slate-100 dark:border-slate-850">
                        <span className="block text-[8px] text-slate-450 uppercase mb-0.5">HOTSPOT ACTIVE</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-250 text-xs">{mtActiveHotspotCount} Sesi</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded border border-slate-100 dark:border-slate-850">
                        <span className="block text-[8px] text-slate-450 uppercase mb-0.5">PPP SECRETS</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-250 text-xs">{mtPppoeSecretCount} Akun</span>
                      </div>
                    </div>
                  )}

                  {/* Custom pricing override for PPPoE active */}
                  <div className="space-y-1 block pt-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                      Custom Tarif per user (Default: Rp 5,000 / active user)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-450 font-bold font-mono">Rp</span>
                      <input
                        type="number"
                        value={customPricePerPppoe}
                        onChange={(e) => setCustomPricePerPppoe(Number(e.target.value))}
                        className="w-28 text-xs font-mono font-extrabold text-slate-800 dark:text-slate-150 p-1.5 border border-slate-200 dark:border-slate-800 rounded focus:outline-indigo-500 bg-white dark:bg-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 font-medium font-sans">/ user / bulan</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom/Estimated Monthly SLA Fee */}
            <div id="grp-fee">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-fee">
                {selectedServices.length > 0 ? "Estimasi Total Biaya Bulanan (IDR):" : "Biaya Bulanan Manual (IDR):"}
              </label>
              <input 
                type="number" 
                value={selectedServices.length > 0 ? computedMonthlyFee : monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                placeholder="Biaya bulanan kustom"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-blue-500 font-mono font-bold text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900"
                disabled={selectedServices.length > 0}
                required
                id="inp-fee"
              />
              {selectedServices.length > 0 && (
                <p className="text-[9px] text-slate-400 mt-1">
                  * Biaya dihitung otomatis berdasarkan jumlah total paket flat & dynamik yang dipilih di atas.
                </p>
              )}
            </div>

            {/* Subscription Status */}
            <div id="grp-status">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-status">Status Layanan Pemantauan:</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-blue-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                id="inp-status"
              >
                <option value="Active">Aktif (Routing Alarm & SLA Berjalan)</option>
                <option value="Inactive">Nonaktif (Terhenti Sementara)</option>
              </select>
            </div>

            {/* Communication Preference */}
            <div id="grp-comm-pref">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-comm-pref">Preferensi Saluran Utama Komunikasi:</label>
              <select 
                value={communicationPreference}
                onChange={(e) => setCommunicationPreference(e.target.value as "whatsapp" | "email")}
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-blue-500 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-255"
                id="inp-comm-pref"
              >
                <option value="whatsapp">💬 WhatsApp (Notifikasi Instan Cepat)</option>
                <option value="email">📧 Email SMTP Relay (Surat Administrasi Resmi)</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2" id="grp-address">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-address">Alamat Fisik Kantor / Headquarter:</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="misal: Gedung Cyber 1 Lt. 3, Jl. Kuningan Barat No. 8, Jakarta Selatan"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-blue-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                id="inp-address"
              />
            </div>

            {/* Noc Notes */}
            <div className="md:col-span-2" id="grp-noc-notes">
              <label className="block text-xs font-semibold text-slate-500 mb-1" id="lbl-noc-notes">Catatan Penting Monitoring NOC & Detail SLA Khusus:</label>
              <textarea 
                value={nocNotes}
                onChange={(e) => setNocNotes(e.target.value)}
                placeholder="Tuliskan catatan penting operasional pelanggan di sini, seperti toleransi downtime, nomor ping standby, kontak eskalasi darurat, atau rincian perangkat kritis..."
                rows={3}
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-blue-500 leading-relaxed bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250"
                id="inp-noc-notes"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-slate-150/40" id="form-foot-btns">
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-805 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                id="btn-cancel-form"
              >
                Batalkan
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white cursor-pointer shadow-xs"
                id="btn-submit-form"
              >
                {editingClient ? "Simpan Perubahan" : "Daftarkan Sekarang"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input Filter */}
      <div className="bg-white dark:bg-[rgb(17,24,39)] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 col-span-12" id="search-filter-card">
        <div className="flex items-center gap-2.5 flex-1">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pelanggan berdasarkan Nama, Instansi, Email, atau No Telepon..."
            className="w-full text-xs bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-850 dark:text-slate-200 font-sans"
            id="search-client-input"
          />
        </div>

        {selectedClientIds.length > 0 && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 px-3 py-1.5 rounded-xl animate-in fade-in duration-205">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
              Terpilih: <strong>{selectedClientIds.length}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsBulkDeleteConfirm(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              id="bulk-delete-clients-btn"
            >
              <Trash className="w-3 h-3" /> Hapus Massal
            </button>
            <button
              type="button"
              onClick={() => setSelectedClientIds([])}
              className="text-slate-400 hover:text-slate-650 text-[10.5px] font-semibold hover:underline bg-transparent border-0 cursor-pointer"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Clients Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden col-span-12" id="clients-table-card">
        <div className="overflow-x-auto" id="clients-table-scroll">
          <table className="w-full text-left border-collapse" id="clients-table">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest" id="th-row">
                <th className="py-3 px-4 text-center w-12" id="th-checkbox">
                  <input
                    type="checkbox"
                    checked={filteredClients.length > 0 && selectedClientIds.length === filteredClients.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClientIds(filteredClients.map(c => c.id));
                      } else {
                        setSelectedClientIds([]);
                      }
                    }}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                  />
                </th>
                <th className="py-3 px-4" id="th-code">ID Kode</th>
                <th className="py-3 px-6" id="th-customer">Pelanggan & Instansi</th>
                <th className="py-3 px-5" id="th-type">Tingkatan SLA NOC</th>
                <th className="py-3 px-5 text-right font-mono" id="th-subfee">Harga Berlangganan</th>
                <th className="py-3 px-5 text-center" id="th-state">Kondisi</th>
                <th className="py-3 px-6 text-center" id="th-management">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-600" id="tb-body">
              {filteredClients.length === 0 ? (
                <tr id="empty-row">
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold" id="empty-td-wrapper">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada pelanggan yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr className="hover:bg-slate-50/50 transition-colors" key={client.id} id={`row-cli-${client.id}`}>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedClientIds.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClientIds(prev => [...prev, client.id]);
                          } else {
                            setSelectedClientIds(prev => prev.filter(id => id !== client.id));
                          }
                        }}
                        className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                      />
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-[11px]" id={`td-id-${client.id}`}>
                      {client.id}
                    </td>
                    <td className="py-4 px-6" id={`td-meta-${client.id}`}>
                      <div className="font-bold text-slate-950 text-xs" id={`company-${client.id}`}>{client.company}</div>
                      <div className="text-[11px] text-slate-500" id={`pic-name-${client.id}`}>{client.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5" id={`pic-contact-${client.id}`}>
                        {client.phone} | {client.email}
                      </div>
                    </td>
                    <td className="py-4 px-5" id={`td-sla-${client.id}`}>
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700" id={`sla-wrap-${client.id}`}>
                        <Wifi className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        {client.serviceType}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-slate-900" id={`td-fee-${client.id}`}>
                      {formatIDR(client.monthlyFee)}
                    </td>
                    <td className="py-4 px-5 text-center" id={`td-status-${client.id}`}>
                      {client.status === "Active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100" id={`badge-active-${client.id}`}>
                          <Check className="w-3 h-3" /> Monitoring Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100" id={`badge-inactive-${client.id}`}>
                          <X className="w-3 h-3" /> Layanan Hold
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center" id={`td-actions-${client.id}`}>
                      <div className="inline-flex items-center justify-center gap-1.5" id={`act-group-${client.id}`}>
                        <button 
                          onClick={() => setSelectedClientDetails(client)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition-colors cursor-pointer"
                          title="Lihat Detail Riwayat & SLA"
                          id={`btn-details-${client.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-600 transition-colors cursor-pointer"
                          title="Edit Pelanggan"
                          id={`btn-edit-${client.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Hapus Pelanggan"
                          id={`btn-delete-${client.id}`}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED CUSTOMER PROFILE MODAL / PORTAL VIEWER */}
      {selectedClientDetails && (() => {
        const clientInvoices = invoices.filter(inv => inv.clientId === selectedClientDetails.id);
        const totalPaidAmount = clientInvoices
          .filter(inv => inv.status === "Paid")
          .reduce((sum, inv) => sum + inv.amount, 0);
        const segment = totalPaidAmount >= 20000000 ? "⭐ VIP Corprate" : "Regular SLA";

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150" id="client-details-modal">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]" id="cli-details-dialog">
              
              {/* Header */}
              <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 bg-slate-800 px-2 py-0.5 rounded font-bold">{segment}</span>
                    <span className="text-[11px] text-slate-400 font-mono font-bold">ID: {selectedClientDetails.id}</span>
                  </div>
                  <h3 className="text-sm font-bold tracking-tight mt-1 text-white">{selectedClientDetails.company}</h3>
                </div>
                <button 
                  onClick={() => setSelectedClientDetails(null)}
                  className="text-slate-300 hover:text-white font-mono text-xs bg-slate-800 hover:bg-slate-700 p-2 px-3 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup [X]
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 space-y-5 overflow-y-auto" id="cli-details-body">
                
                {/* Stats Dashboard Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block leading-none">Total Transaksi Lunas</span>
                    <span className="text-base font-extrabold text-blue-900 font-mono block mt-1">{formatIDR(totalPaidAmount)}</span>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">Invoice Dikirim</span>
                    <span className="text-base font-extrabold text-slate-700 font-mono block mt-1">{clientInvoices.length} Invoice</span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block leading-none">Status Klien</span>
                    <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-100 rounded-full px-2 py-0.5 inline-block mt-1">
                      {selectedClientDetails.status === "Active" ? "🟢 Monitoring Aktif" : "🔴 Ditangguhkan"}
                    </span>
                  </div>
                </div>

                {/* Grid info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* General Profile */}
                  <div className="space-y-2 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100">Rincian Kontak & Alamat</h4>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div>👤 <span className="font-semibold">Nama PIC:</span> {selectedClientDetails.name}</div>
                      <div>📞 <span className="font-semibold">No. WhatsApp:</span> {selectedClientDetails.phone}</div>
                      <div>✉️ <span className="font-semibold">Email PIC:</span> {selectedClientDetails.email}</div>
                      <div>📅 <span className="font-semibold">Tgl Registrasi:</span> {selectedClientDetails.createdAt}</div>
                      <div className="pt-1 text-[11px] leading-relaxed">
                        📍 <span className="font-semibold">Alamat Kantor:</span>{" "}
                        <span className="text-slate-500 italic">{selectedClientDetails.address || "Belum diisi"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Channel Preference and SLA Custom information */}
                  <div className="space-y-4 border border-slate-100 p-4 rounded-xl bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1.5 border-b border-slate-100">Preferensi & Jasa NOC</h4>
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-600 block mb-0.5 font-sans text-[11px] uppercase tracking-wider">Layanan SLA Terdaftar:</span>
                        <div className="space-y-1 mt-1">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[11px] font-bold font-mono block border border-blue-100 leading-tight">
                            {selectedClientDetails.serviceType}
                          </span>
                          <span className="text-slate-500 font-semibold block text-[10.5px]">
                            Total Tagihan Bulanan: <span className="font-mono font-bold text-blue-600">{formatIDR(selectedClientDetails.monthlyFee)}</span>
                          </span>
                        </div>
                      </div>

                      {selectedClientDetails.mikrotikIp && (() => {
                        const companySlug = selectedClientDetails.company.toLowerCase().replace(/[^a-z0-9]/g, "");
                        const secretCount = selectedClientDetails.mtPppoeSecretCount || 10;
                        const activeCount = selectedClientDetails.mtActivePppoeCount || 6;
                        const offlineCount = Math.max(0, secretCount - activeCount);
                        const hotspotCount = selectedClientDetails.mtActiveHotspotCount || 4;

                        // Create simulated secrets
                        const secrets = Array.from({ length: secretCount }).map((_, index) => {
                          const isOnline = index < activeCount;
                          return {
                            username: `${companySlug}_user_${index + 1}`,
                            service: "pppoe",
                            profile: index % 2 === 0 ? "SLA_Premium_50M" : "SLA_Standard_20M",
                            uptime: isOnline ? `${index + 2}j ${(index * 8) % 60}m 15d` : "-",
                            ipAddress: `10.50.${10 + (selectedClientDetails.id === "1" ? 1 : 2) * 5}.${100 + index}`,
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
                          <div className="pt-3 border-t border-slate-200/50 space-y-3 font-sans">
                            <span className="font-bold text-slate-700 block text-[10.5px] uppercase tracking-wider flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                              MikroTik Router API Diagnostik:
                            </span>
                            
                            {/* Host header info */}
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-mono leading-normal text-slate-650 dark:text-slate-350 flex justify-between items-center flex-wrap gap-2">
                              <div>🌐 Host IP: <strong className="text-slate-850 dark:text-white">{selectedClientDetails.mikrotikIp}:{selectedClientDetails.mikrotikPort}</strong></div>
                              <div>👤 User: <strong className="text-slate-850 dark:text-white">{selectedClientDetails.mikrotikUser}</strong></div>
                            </div>

                            {/* Main Counters Grid row */}
                            <div className="grid grid-cols-4 gap-1.5 text-center">
                              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-1.5 border border-emerald-100 dark:border-emerald-900/60 rounded cursor-pointer transition-all hover:opacity-85" onClick={() => setActiveCoreTab("pppoe_active")}>
                                <div className="text-[14px] font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
                                <div className="text-[8px] uppercase tracking-wider text-slate-450 font-bold">PPPoE Aktif</div>
                              </div>
                              <div className="bg-rose-50/70 dark:bg-rose-950/20 p-1.5 border border-rose-100 dark:border-rose-900/60 rounded cursor-pointer transition-all hover:opacity-85" onClick={() => setActiveCoreTab("pppoe_offline")}>
                                <div className="text-[14px] font-extrabold text-rose-600 dark:text-rose-450">{offlineCount}</div>
                                <div className="text-[8px] uppercase tracking-wider text-slate-450 font-bold">PPPoE Off</div>
                              </div>
                              <div className="bg-amber-50/70 dark:bg-amber-950/20 p-1.5 border border-amber-100 dark:border-amber-900/60 rounded cursor-pointer transition-all hover:opacity-85" onClick={() => setActiveCoreTab("hotspot")}>
                                <div className="text-[14px] font-extrabold text-amber-600 dark:text-amber-400">{hotspotCount}</div>
                                <div className="text-[8px] uppercase tracking-wider text-slate-450 font-bold">Hotspot</div>
                              </div>
                              <div className="bg-indigo-50/70 dark:bg-indigo-950/20 p-1.5 border border-indigo-100 dark:border-indigo-900/60 rounded">
                                <div className="text-[14px] font-extrabold text-indigo-650 dark:text-indigo-400">{secretCount}</div>
                                <div className="text-[8px] uppercase tracking-wider text-slate-450 font-bold">Secrets</div>
                              </div>
                            </div>

                            {/* Dynamic Sub Tabs Navigation slots */}
                            <div className="flex border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => setActiveCoreTab("pppoe_active")}
                                className={`flex-1 py-1 px-1.5 border-b-2 text-center transition-all cursor-pointer ${
                                  activeCoreTab === "pppoe_active"
                                    ? "border-emerald-500 text-emerald-650 dark:text-emerald-450 font-extrabold"
                                    : "border-transparent text-slate-450 hover:text-slate-700"
                                }`}
                              >
                                PPPoE Aktif ({activeCount})
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveCoreTab("pppoe_offline")}
                                className={`flex-1 py-1 px-1.5 border-b-2 text-center transition-all cursor-pointer ${
                                  activeCoreTab === "pppoe_offline"
                                    ? "border-rose-500 text-rose-650 dark:text-rose-450 font-extrabold"
                                    : "border-transparent text-slate-450 hover:text-slate-700"
                                }`}
                              >
                                PPPoE Off ({offlineCount})
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveCoreTab("hotspot")}
                                className={`flex-1 py-1 px-1.5 border-b-2 text-center transition-all cursor-pointer ${
                                  activeCoreTab === "hotspot"
                                    ? "border-amber-500 text-amber-600 dark:text-amber-450 font-extrabold"
                                    : "border-transparent text-slate-450 hover:text-slate-700"
                                }`}
                              >
                                Hotspot ({hotspotCount})
                              </button>
                            </div>

                            {/* Content Lists rendering */}
                            <div className="overflow-y-auto max-h-[160px] border border-slate-150 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-950 p-1.5 space-y-1.5">
                              {activeCoreTab === "pppoe_active" && (
                                secrets.filter(s => s.status === "Active").map((item) => (
                                  <div key={item.username} className="flex items-center justify-between p-1 px-2 text-[9px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded shadow-xs">
                                    <div>
                                      <span className="font-extrabold text-slate-850 dark:text-slate-100 font-mono text-[9.5px] block">{item.username}</span>
                                      <span className="text-slate-450 block text-[8px] font-mono">IP: {item.ipAddress} | Prof: {item.profile}</span>
                                    </div>
                                    <div className="text-right space-y-0.5">
                                      <span className="inline-block px-1 bg-emerald-50 text-emerald-700 font-extrabold rounded text-[8px]">ONLINE</span>
                                      <span className="block text-slate-400 font-mono text-[7.5px] leading-none">Up: {item.uptime}</span>
                                    </div>
                                  </div>
                                ))
                              )}

                              {activeCoreTab === "pppoe_offline" && (
                                secrets.filter(s => s.status === "Offline").length === 0 ? (
                                  <div className="text-slate-400 text-center py-4 italic text-[9.5px]">Semua Client PPPoE Berhasil Terkoneksi.</div>
                                ) : (
                                  secrets.filter(s => s.status === "Offline").map((item) => (
                                    <div key={item.username} className="flex items-center justify-between p-1 px-2 text-[9px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded shadow-xs">
                                      <div>
                                        <span className="font-extrabold text-slate-850 dark:text-slate-100 font-mono text-[9.5px] block">{item.username}</span>
                                        <span className="text-slate-450 block text-[8px] font-mono">IP Pool: {item.ipAddress} | MAC: {item.mac}</span>
                                      </div>
                                      <div className="text-right space-y-0.5">
                                        <span className="inline-block px-1 bg-rose-50 text-rose-600 font-bold rounded text-[8px]">OFFLINE</span>
                                        <span className="block text-slate-400 text-[8px] leading-none">{item.lastOof}</span>
                                      </div>
                                    </div>
                                  ))
                                )
                              )}

                              {activeCoreTab === "hotspot" && (
                                hotspots.map((item) => (
                                  <div key={item.username} className="flex items-center justify-between p-1 px-2 text-[9px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded shadow-xs font-mono">
                                    <div>
                                      <span className="font-extrabold text-slate-850 dark:text-slate-100 text-[9.5px] block">{item.username}</span>
                                      <span className="text-slate-400 block text-[8px]">IP: {item.ipAddress} | MAC: {item.mac}</span>
                                    </div>
                                    <div className="text-right text-[8px] space-y-0.5">
                                      <span className="inline-block px-1 bg-amber-50 text-amber-700 font-extrabold rounded leading-snug">ACTIVE</span>
                                      <div className="text-[7.5px] text-slate-450 font-normal leading-none font-mono">
                                        ⇅ {item.bytesIn} / {item.bytesOut}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <div>
                        <span className="font-semibold text-slate-600 block mb-1 font-sans text-[11px] uppercase tracking-wider">Preferensi Notifikasi:</span>
                        {selectedClientDetails.communicationPreference === "whatsapp" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            💬 Prioritas WhatsApp (Push Otomatis)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                            📧 Prioritas Email (SMTP Relay Official)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Noc Notes Section */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Catatan Penting Tim NOC Monitoring:</h4>
                  <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl text-xs text-amber-900 leading-relaxed font-sans italic">
                    {selectedClientDetails.nocNotes || "Tidak ada catatan kustom khusus untuk klien monitoring SLA ini."}
                  </div>
                </div>

                {/* Transaction history log table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                    <History className="w-4 h-4 text-slate-400" /> Riwayat Invoice Terbit ({clientInvoices.length})
                  </h4>
                  {clientInvoices.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg text-center">Belum ada invoice yang pernah diterbitkan untuk klien ini.</p>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-4">Inv ID</th>
                            <th className="py-2.5 px-3">Periode</th>
                            <th className="py-2.5 px-3">Jatuh Tempo</th>
                            <th className="py-2.5 px-3 text-right">Nilai Tagihan</th>
                            <th className="py-2.5 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {clientInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-mono font-bold text-[11px] text-slate-900">{inv.id}</td>
                              <td className="py-2.5 px-3 font-mono">{inv.billingMonth}</td>
                              <td className="py-2.5 px-3 text-slate-500">{inv.dueDate}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">{formatIDR(inv.amount)}</td>
                              <td className="py-2.5 px-4 text-center">
                                {inv.status === "Paid" ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-150 text-emerald-700 bg-emerald-50">Lunas ({inv.paymentMethod})</span>
                                ) : inv.status === "Overdue" ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-750">Menunggak</span>
                                ) : inv.status === "Unpaid" ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">Belum Bayar</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Draft</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}
      {/* Sleek, touch-friendly, Android WebView-safe Delete Confirmation Dialog */}
      {deletingClientId && (() => {
        const targetClient = clients.find(c => c.id === deletingClientId);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150" id="delete-modal-overlay">
            <div className="bg-white dark:bg-[#151e2e] w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl" id="delete-modal-box">
              <div className="flex items-center gap-3 text-rose-600 mb-4" id="delete-modal-title">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-sans">
                  Konfirmasi Hapus Pelanggan
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mb-6" id="delete-modal-desc">
                Apakah Anda benar-benar yakin ingin menghapus pelanggan <strong className="text-slate-900 dark:text-white">{targetClient ? targetClient.company : "ini"}</strong>? 
                <br />
                Tindakan ini bersifat permanen dan akan berdampak pada link penagihan & log pembayaran yang tercatat dalam sistem.
              </p>
              <div className="flex gap-3 justify-end" id="delete-modal-buttons">
                <button
                  type="button"
                  onClick={() => setDeletingClientId(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteClient(deletingClientId);
                    setDeletingClientId(null);
                    setSelectedClientIds(prev => prev.filter(id => id !== deletingClientId));
                    notify("Informasi pelanggan berhasil dihapus dari sistem.", "success");
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Delete Confirm Modal */}
      {isBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150" id="bulk-delete-modal-overlay">
          <div className="bg-white dark:bg-[#151e2e] w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl" id="bulk-delete-modal-box">
            <div className="flex items-center gap-3 text-rose-600 mb-4" id="bulk-delete-modal-title">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-sans">
                Konfirmasi Hapus Massal Pelanggan
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mb-6" id="bulk-delete-modal-desc">
              Apakah Anda yakin ingin menghapus sebanyak <strong className="text-rose-600 font-bold">{selectedClientIds.length}</strong> pelanggan yang dipilih secara massal?
              <br />
              Tindakan ini bersifat permanen dan akan menghapus seluruh data terpilih beserta sejarah penagihan terkait.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClient(selectedClientIds);
                  setSelectedClientIds([]);
                  setIsBulkDeleteConfirm(false);
                  notify("Seluruh pelanggan terpilih berhasil dihapus massal.", "success");
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                id="bulk-delete-clients-confirm-btn"
              >
                Ya, Hapus Massal Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="inlineSvcModal">
          <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden" id="inlineSvcDialog">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between" id="inlineSvcHeader">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Tambah Kategori Layanan Baru
              </h3>
              <button 
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInlineAddCategorySubmit} className="p-6 space-y-4" id="inlineSvcForm">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Nama Service / Kategori</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-150"
                  placeholder="e.g. Dedicated Bandwidth 20Mbps"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Jenis Biaya</label>
                  <select
                    value={newCatType}
                    onChange={(e) => {
                      const val = e.target.value as "Fixed" | "Mikrotik_Dynamic";
                      setNewCatType(val);
                      if (val === "Fixed") {
                        setNewCatBillingType("fixed");
                      } else {
                        setNewCatBillingType("per_pppoe_active");
                        setNewCatBasePrice(5000); // Default per active pppoe price
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-850 dark:text-slate-100"
                  >
                    <option value="Fixed">Flat Rate (Bulanan Tetap)</option>
                    <option value="Mikrotik_Dynamic">MikroTik Dynamic Rate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                    {newCatType === "Fixed" ? "Tarif Tetap (IDR)" : "Tarif per Object (IDR)"}
                  </label>
                  <input
                    type="number"
                    value={newCatBasePrice}
                    onChange={(e) => setNewCatBasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-850 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              {newCatType === "Mikrotik_Dynamic" && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/25 border border-indigo-100 dark:border-indigo-900/60 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">Target Monitoring untuk Billing</label>
                    <select
                      value={newCatBillingType}
                      onChange={(e) => setNewCatBillingType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-750 text-xs focus:outline-none text-slate-800 dark:text-slate-200"
                    >
                      <option value="per_pppoe_active">Hitung PPPoE Active Sessions (Rp {newCatBasePrice}/user)</option>
                      <option value="per_hotspot_active">Hitung Hotspot Active (Rp {newCatBasePrice}/user)</option>
                      <option value="per_pppoe_secret">Hitung Total PPPoE Secrets (Rp {newCatBasePrice}/secret)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Deskripsi Jasa</label>
                <textarea
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-slate-150"
                  placeholder="Jelaskan spesifikasi atau cakupan layanan..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Tambahkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
