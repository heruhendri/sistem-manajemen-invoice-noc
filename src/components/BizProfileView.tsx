import React, { useState } from "react";
import { BizProfile, CustomPaymentMethod } from "../types";
import { 
  Building2, 
  Image as ImageIcon, 
  CreditCard, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle,
  Save, 
  Sparkles,
  Link as LinkIcon,
  Palette,
  QrCode,
  Upload,
  Plus,
  Trash2,
  Check
} from "lucide-react";

interface BizProfileViewProps {
  bizProfile: BizProfile;
  onUpdateProfile: (profile: BizProfile) => void;
  triggerToast?: (message: string, type?: "success" | "warning" | "error" | "info") => void;
}

export default function BizProfileView({
  bizProfile,
  onUpdateProfile,
  triggerToast
}: BizProfileViewProps) {
  // Tabs for the profile control panel
  const [activeSubTab, setActiveSubTab] = useState<"identity" | "pdf_template" | "payments">("identity");

  // Initializing state with defaults if missing
  const [form, setForm] = useState<BizProfile>(() => {
    const copy = { ...bizProfile };
    if (!copy.pdfTitle) copy.pdfTitle = "INVOICE UTAMA SLA";
    if (!copy.pdfSubTitle) copy.pdfSubTitle = "SLA PROACTIVE MONITORING INFRASTRUCTURE";
    if (!copy.pdfColorPrimary) copy.pdfColorPrimary = "#0d9488";
    if (!copy.pdfColorSecondary) copy.pdfColorSecondary = "#475569";
    if (!copy.pdfCustomNote) copy.pdfCustomNote = "Pesan ini digenerate secara otomatis oleh Billing NOC System dengan pembukuan real-time terintegrasi.";
    if (!copy.staticQrisPayload) copy.staticQrisPayload = "00020101021226380010ID.CO.QRIS.WWW011893600002000010000303035204481155026263045A95";
    if (!copy.customPaymentMethods) {
      copy.customPaymentMethods = [
        { id: "pm-1", name: "Bank Mandiri VA", accountNumber: "8899120000002", accountHolder: "PT NOC NET NUSANTARA", active: true },
        { id: "pm-2", name: "Bank BCA VA", accountNumber: "7711230000003", accountHolder: "PT NOC NET NUSANTARA", active: true },
        { id: "pm-3", name: "Kirim Bukti QRIS Manual (Statis)", accountNumber: "QRIS Online", accountHolder: "PT NOC NET NUSANTARA", active: true }
      ];
    }
    return copy;
  });

  const [isSaving, setIsSaving] = useState(false);

  // New Custom Payment Method creation helper states
  const [newPayName, setNewPayName] = useState("");
  const [newPayAccountNumber, setNewPayAccountNumber] = useState("");
  const [newPayAccountHolder, setNewPayAccountHolder] = useState("");

  const notify = (msg: string, type: "success" | "warning" | "error" | "info" = "info") => {
    if (triggerToast) {
      triggerToast(msg, type);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Convert uploaded logo/file to Base64 (supports png/jpg)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notify("Ukuran logo maksimal adalah 2MB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Str = event.target?.result as string;
        setForm(prev => ({
          ...prev,
          logoUrl: base64Str
        }));
        notify("Logo biling berhasil diunggah!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert uploaded static QRIS print to Base64 (supports png/jpg)
  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notify("Ukuran QRIS maksimal adalah 2MB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Str = event.target?.result as string;
        setForm(prev => ({
          ...prev,
          staticQrisUrl: base64Str
        }));
        notify("Kertas QRIS Statis berhasil diunggah!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      onUpdateProfile(form);
      setIsSaving(false);
      notify("Semua perubahan profil usaha, pembayaraan & templat PDF berhasil disimpan!", "success");
    }, 600);
  };

  const handleReset = () => {
    setForm({ ...bizProfile });
    notify("Formulir diset kembali ke konfigurasi aktif.", "info");
  };

  // Add a brand new payment channel
  const handleAddPaymentMethod = () => {
    if (!newPayName || !newPayAccountNumber) {
      notify("Nama Metode & Nomor Rekening wajib diisi.", "warning");
      return;
    }
    const newMethod: CustomPaymentMethod = {
      id: "pm-" + Date.now(),
      name: newPayName,
      accountNumber: newPayAccountNumber,
      accountHolder: newPayAccountHolder || form.companyName,
      active: true
    };
    setForm(prev => ({
      ...prev,
      customPaymentMethods: [...(prev.customPaymentMethods || []), newMethod]
    }));
    setNewPayName("");
    setNewPayAccountNumber("");
    setNewPayAccountHolder("");
    notify("Metode pembayaran baru berhasil ditambahkan ke draft local!", "success");
  };

  // Toggle active status of a payment channel
  const handleTogglePaymentMethod = (id: string) => {
    setForm(prev => ({
      ...prev,
      customPaymentMethods: (prev.customPaymentMethods || []).map(pm => {
        if (pm.id === id) {
          return { ...pm, active: !pm.active };
        }
        return pm;
      })
    }));
  };

  // Delete a custom payment method
  const handleDeletePaymentMethod = (id: string) => {
    setForm(prev => ({
      ...prev,
      customPaymentMethods: (prev.customPaymentMethods || []).filter(pm => pm.id !== id)
    }));
    notify("Metode pembayaran dihapus.", "info");
  };

  return (
    <div className="space-y-6" id="biz-profile-container">
      {/* Introduction Header banner */}
      <div className="bg-gradient-to-r from-teal-700 to-indigo-800 text-white p-5 rounded-2xl shadow-sm space-y-2 relative overflow-hidden" id="biz-intro-banner">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Building2 className="w-40 h-40" />
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-200" />
          <span className="text-[10px] tracking-wider uppercase font-extrabold text-teal-200">Konfigurasi Inti Usaha</span>
        </div>
        <h2 className="text-lg font-bold tracking-tight">Kustomisasi Profil, Templat PDF & QRIS Statis</h2>
        <p className="text-xs text-teal-100 max-w-xl">
          Melalui menu ini, Anda memiliki kontrol penuh atas visual tagihan. Unggah logo JPG/PNG, sunting templat tajuk PDF, kelola rekening bank, serta unggah QRIS statis untuk kemudahan pembayaran pelanggan.
        </p>
      </div>

      {/* Sub tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-slate-200 dark:border-slate-800 pb-px text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab("identity")}
          className={`px-4 py-2.5 font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === "identity"
              ? "border-teal-600 bg-white dark:bg-slate-900 text-teal-650 dark:text-teal-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          1. Profil Usaha & Logo Billing
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("pdf_template")}
          className={`px-4 py-2.5 font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === "pdf_template"
              ? "border-indigo-600 bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4" />
          2. Desain Templat PDF Custom
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("payments")}
          className={`px-4 py-2.5 font-bold rounded-t-xl flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === "payments"
              ? "border-amber-600 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          3. Pilihan Metode Pembayaran & QRIS Statis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Editor based on submenu */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-xs" id="biz-profile-form">
          
          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-extrabold text-slate-850 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {activeSubTab === "identity" && "SUNTING IDENTITAS & LOGO USAHA"}
              {activeSubTab === "pdf_template" && "KUSTOMISASI WARNA & FIELD TEMPLAT PDF"}
              {activeSubTab === "payments" && "SUNTING CHANNELS BANK & UPLOAD QRIS STATIS"}
            </h3>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-rose-500 hover:text-rose-700 cursor-pointer underline font-semibold"
            >
              Ulangi Perubahan
            </button>
          </div>

          {/* TAB 1: IDENTITY DETAILS */}
          {activeSubTab === "identity" && (
            <div className="space-y-4 text-xs" id="subtab-identity-inputs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nama Resmi Lembaga / Usaha NOC
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={form.companyName}
                      onChange={handleChange}
                      placeholder="Contoh: NOC Net Nusantara"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-semibold focus:outline-teal-505"
                    />
                  </div>
                </div>

                {/* Billing Name */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sub-Nama Layanan / Judul Sistem Billing
                  </label>
                  <input
                    type="text"
                    name="billingName"
                    required
                    value={form.billingName}
                    onChange={handleChange}
                    placeholder="Contoh: Billing SLA NOC & Multi-router Core Plan"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-semibold focus:outline-teal-505"
                  />
                </div>

                {/* Logo Image Source (Upload / Paste Link) */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-teal-650" />
                      Logo Billing Usaha (JPG, PNG atau Link)
                    </label>
                    <span className="text-[9.5px] font-semibold text-teal-605">Direkomendasikan rasio 1:1</span>
                  </div>

                  {/* 1. File Upload button */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-lg flex flex-col items-center justify-center text-center space-y-1.5">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-semibold">Upload file JPG atau PNG</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleLogoUpload}
                        className="text-[9.5px] text-slate-400 cursor-pointer block file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-teal-50 file:text-teal-700"
                      />
                    </div>

                    {/* 2. Public Link String */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 block font-bold">Atau masukkan Link Gambar HTTPS:</span>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          name="logoUrl"
                          value={form.logoUrl}
                          onChange={handleChange}
                          placeholder="https://gbr-hosting.id/logo.png"
                          className="w-full pl-8 pr-2.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-mono text-[10px] focus:outline-teal-500"
                        />
                      </div>
                      
                      {/* Logo Preview box inside component */}
                      <div className="mt-2 flex items-center gap-2 p-1.5 bg-white dark:bg-slate-950 rounded border border-slate-200/50">
                        {form.logoUrl ? (
                          <img 
                            src={form.logoUrl} 
                            alt="Preview Logo" 
                            className="w-10 h-10 object-cover rounded border"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400 font-bold">No img</div>
                        )}
                        <div className="text-[9px] text-slate-500 leading-snug">
                          <span className="font-bold block text-slate-800 dark:text-slate-200">Logo Aktif</span>
                          Tipe data: {form.logoUrl.startsWith("data:") ? "Base64 (Diunggah)" : "Tautan URL"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Customer SLA and WhatsApp Support */}
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Surel Resmi (Contact Support)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="sales@nocnet.co.id"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-medium focus:outline-teal-505"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nomor WhatsApp Center Usaha
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+62 812-3456-789"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-semibold font-mono focus:outline-teal-505"
                    />
                  </div>
                </div>

                {/* QRIS Merchant Name for reference */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nama Merchant QRIS (Maks 25 Karakter)
                  </label>
                  <input
                    type="text"
                    name="qrisMerchantName"
                    required
                    maxLength={25}
                    value={form.qrisMerchantName}
                    onChange={handleChange}
                    placeholder="Contoh: NOC NET NUSANTARA CO"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-bold uppercase tracking-wider focus:outline-teal-505"
                  />
                </div>

                {/* Address Txt */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Alamat Fisik Gudang / Kantor NOC
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={2}
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Gedung Cyber Cyber Lantai 1, Jakarta Selatan..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-medium focus:outline-teal-505"
                  />
                </div>

                {/* Footer Text info */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Catatan Bawah / Teks Syarat & Ketentuan SLA Footer
                  </label>
                  <input
                    type="text"
                    name="footerText"
                    required
                    value={form.footerText}
                    onChange={handleChange}
                    placeholder="NOC SLA Guaranteed 99.9% uptime - No Refund Policy."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-medium focus:outline-teal-505"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PDF TEMPLATE CUSTOMS */}
          {activeSubTab === "pdf_template" && (
            <div className="space-y-4 text-xs" id="subtab-pdf-template-inputs">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-150 text-[11px] leading-relaxed text-indigo-750 dark:text-indigo-400 font-medium">
                🛡️ <strong>Kustomisasi PDF Template Builder:</strong> Atur judul, warna primer biling, warna teks meta, and catatan khusus yang akan langsung diinject oleh sistem `jsPDF` pas ekspor invoice pelanggan.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PDF Title */}
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Judul Utama PDF (Top Right)
                  </label>
                  <input
                    type="text"
                    name="pdfTitle"
                    required
                    value={form.pdfTitle}
                    onChange={handleChange}
                    placeholder="INVOICE UTAMA SLA"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-bold focus:outline-indigo-505"
                  />
                </div>

                {/* PDF Subtitle */}
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Slogan / Sub-Judul Header
                  </label>
                  <input
                    type="text"
                    name="pdfSubTitle"
                    required
                    value={form.pdfSubTitle}
                    onChange={handleChange}
                    placeholder="SLA PROACTIVE SERVICES"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-medium focus:outline-indigo-505"
                  />
                </div>

                {/* Color primary PDF */}
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Warna Utama PDF (Primary Hex)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="pdfColorPrimary"
                      value={form.pdfColorPrimary}
                      onChange={handleChange}
                      className="w-10 h-8 p-0 border border-slate-200 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="pdfColorPrimary"
                      value={form.pdfColorPrimary}
                      onChange={handleChange}
                      placeholder="#0d9488"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg font-mono text-[11px] text-slate-905 dark:text-white focus:outline-indigo-505 font-bold"
                    />
                  </div>
                  {/* Preset Colors */}
                  <div className="flex gap-1.5 pt-1">
                    {["#0d9488", "#4f46e5", "#0ea5e9", "#e11d48", "#16a34a", "#1e293b"].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setForm(p => ({ ...p, pdfColorPrimary: c }))}
                        className="w-4 h-4 rounded-full border border-slate-350 cursor-pointer shadow-xs"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Color secondary PDF */}
                <div className="space-y-1.5">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Warna Menengah PDF (Secondary Hex)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="pdfColorSecondary"
                      value={form.pdfColorSecondary}
                      onChange={handleChange}
                      className="w-10 h-8 p-0 border border-slate-200 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="pdfColorSecondary"
                      value={form.pdfColorSecondary}
                      onChange={handleChange}
                      placeholder="#475569"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg font-mono text-[11px] text-slate-905 dark:text-white focus:outline-indigo-550 font-bold"
                    />
                  </div>
                  {/* Preset Colors */}
                  <div className="flex gap-1.5 pt-1">
                    {["#475569", "#708090", "#000000", "#7c4700", "#334155"].map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setForm(p => ({ ...p, pdfColorSecondary: c }))}
                        className="w-4 h-4 rounded-full border border-slate-350 cursor-pointer shadow-xs"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Note/Instruction PDF */}
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="block text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Instruksi Khusus / Ketentuan Pembayaran (Muncul di Bawah Table PDF)
                  </label>
                  <textarea
                    name="pdfCustomNote"
                    rows={3}
                    required
                    value={form.pdfCustomNote}
                    onChange={handleChange}
                    placeholder="Syarat & instruksi transfer bank, batas auto lunas QRIS..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-lg text-slate-905 dark:text-white font-medium focus:outline-indigo-505"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT METHODS & STATIC QRIS */}
          {activeSubTab === "payments" && (
            <div className="space-y-6 text-xs" id="subtab-payments-inputs">
              
              {/* Part A: Static QRIS Code Upload & Payload Configuration */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">GERBANG QRIS STATIS</h4>
                </div>
                
                <p className="text-[10.5px] text-slate-500 leading-normal">
                  Sistem mendukung scan QRIS mandiri bagi pelanggan. Anda dapat mengunggah lembar print QRIS Statis Anda (bisa didapatkan dari ShopeePay, m-Banking, atau QRIS DANA/OVO/GoPay bank Anda) dan mengisi kode teks raw payload di bawah.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* QRIS File Upload */}
                  <div className="border border-slate-200 bg-white dark:bg-slate-950 p-3 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                    <Upload className="w-6 h-6 text-slate-450" />
                    <span className="text-[10px] font-bold text-slate-705">Unggah QRIS Statis (JPG/PNG)</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleQrisUpload}
                      className="text-[9px] text-slate-400 block file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-amber-50 file:text-amber-700 cursor-pointer"
                    />

                    {/* QRIS Preview image */}
                    {form.staticQrisUrl ? (
                      <div className="mt-2 text-center">
                        <img 
                          src={form.staticQrisUrl} 
                          alt="Statis QRIS Code" 
                          className="w-24 h-24 object-contain mx-auto border rounded p-1 shadow-sm bg-white"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[8.5px] text-emerald-600 font-extrabold block mt-1">✔ Lembaran QRIS Aktif (Base64)</span>
                      </div>
                    ) : (
                      <div className="border border-slate-100 w-20 h-20 flex items-center justify-center text-[9px] text-slate-450 rounded bg-slate-50 italic">
                        QRIS kosong
                      </div>
                    )}
                  </div>

                  {/* QRIS Payload Code String */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-650 dark:text-slate-400 uppercase tracking-widest">
                      Raw QRIS EMVCo Payload (Kode Teks)
                    </label>
                    <textarea
                      name="staticQrisPayload"
                      rows={4}
                      value={form.staticQrisPayload || ""}
                      onChange={handleChange}
                      placeholder="Contoh: 00020101021126380010ID.CO.QRIS.WWW..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-mono leading-normal text-slate-800 dark:text-slate-350 focus:outline-teal-500 break-all"
                    />
                    <span className="text-[9px] text-slate-450 block leading-snug">
                      💡 Kode EMVCo payload teks digunakan sistem kustomisasi dynamic barcode billing jika QRIS fisik asli tidak diupload.
                    </span>
                  </div>
                </div>
              </div>

              {/* Part B: Manage Custom Virtual Accounts / Banks */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    SALURAN REKENING TRANSFER / VA CUSTOM ({form.customPaymentMethods?.length || 0})
                  </span>
                </div>

                {/* List current payment options */}
                <div className="space-y-2">
                  {(form.customPaymentMethods || []).map((pm) => (
                    <div 
                      key={pm.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border-2 text-[10.5px] transition-all bg-white dark:bg-slate-950 ${
                        pm.active 
                          ? "border-emerald-500/25 dark:border-emerald-950" 
                          : "border-slate-200/50 dark:border-slate-850 opacity-60"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-850 dark:text-white font-sans">{pm.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            pm.active ? "bg-emerald-100 text-emerald-850" : "bg-slate-100 text-slate-500"
                          }`}>
                            {pm.active ? "Aktif" : "Non-Aktif"}
                          </span>
                        </div>
                        <div className="font-mono text-slate-500 leading-none">
                          No. Rek / VA: <span className="font-bold text-indigo-650 dark:text-indigo-400">{pm.accountNumber}</span> | A.N: {pm.accountHolder}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentMethod(pm.id)}
                          className={`px-2 py-1 rounded text-[9px] font-bold cursor-pointer hover:opacity-85 ${
                            pm.active ? "bg-slate-100 text-slate-700" : "bg-emerald-600 text-white"
                          }`}
                        >
                          {pm.active ? "Sembunyikan" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="p-1 px-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                          title="Hapus saluran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new payment option */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="block text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest">+ TAMBAH REKENING / METODE BARU</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] block text-slate-400 font-bold mb-1">Nama Metode / Bank:</span>
                      <input
                        type="text"
                        value={newPayName}
                        onChange={(e) => setNewPayName(e.target.value)}
                        placeholder="Contoh: Bank BCA VA"
                        className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white font-semibold"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] block text-slate-400 font-bold mb-1">Nomor Rekening / Kode VA:</span>
                      <input
                        type="text"
                        value={newPayAccountNumber}
                        onChange={(e) => setNewPayAccountNumber(e.target.value)}
                        placeholder="Contoh: 70138637990"
                        className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg font-mono font-bold text-slate-805 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] block text-slate-400 font-bold mb-1">Nama Atas Nama (A.N):</span>
                      <input
                        type="text"
                        value={newPayAccountHolder}
                        onChange={(e) => setNewPayAccountHolder(e.target.value)}
                        placeholder={form.companyName}
                        className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-705 dark:text-white font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPaymentMethod}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-[11px] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambahkan ke Pilihan Transfer Bank
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-teal-650 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm text-xs uppercase tracking-wider"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Semua Konfigurasi Profil
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live Header / Dynamic Invoice Design PDF Mockup Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6" id="biz-preview-pane">
          
          {/* Header Preview card */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-widest font-mono">
              Pratinjau Live Merek Header Utama:
            </span>

            {/* Virtual Header simulation element */}
            <div className="border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between gap-3 overflow-hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200/80 shadow-xs flex items-center justify-center">
                  {form.logoUrl ? (
                    <img 
                      src={form.logoUrl} 
                      alt="Brand Logo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100";
                      }}
                    />
                  ) : (
                    <Building2 className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-extrabold block leading-none font-mono">
                    Control Panel
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-850 dark:text-white truncate mt-1">
                    {form.companyName || "NOC Net Nusantara"}
                  </h4>
                </div>
              </div>

              <div className="text-[8.5px] font-mono p-1 rounded bg-teal-50 text-teal-700 shrink-0 font-bold border border-teal-100">
                Live OK
              </div>
            </div>
          </div>

          {/* SLA Invoice Header mockup */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-widest font-mono">
              Pratinjau LIVE Cetak PDF / Detail Pembayaran:
            </span>

            {/* Mini invoice box mockup */}
            <div className="border border-slate-250 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950 space-y-4 font-sans text-[11px] text-slate-700 dark:text-slate-300 relative overflow-hidden">
              
              {/* Customizable Top Primary Banner background representation */}
              <div 
                className="h-2.5 -mx-4 -mt-4 mb-3" 
                style={{ backgroundColor: form.pdfColorPrimary || "#0d9488" }}
              />

              {/* Header inside billing */}
              <div className="flex justify-between items-start border-b border-dashed border-slate-200 dark:border-slate-800 pb-3 gap-2">
                <div className="space-y-1">
                  <h5 className="font-extrabold text-[12px] leading-tight uppercase" style={{ color: form.pdfColorPrimary || "#0a9488" }}>
                    {form.pdfTitle || "INVOICE UTAMA SLA"}
                  </h5>
                  <p className="text-[9px] font-bold font-mono" style={{ color: form.pdfColorSecondary || "#475569" }}>
                    {form.pdfSubTitle || "SLA PROACTIVE SERVICES"}
                  </p>
                </div>
                {form.logoUrl && (
                  <img 
                    src={form.logoUrl} 
                    alt="Logo Mini" 
                    className="w-8 h-8 object-cover rounded border bg-white"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Company Info section */}
              <div className="space-y-1 text-[10px] text-slate-500">
                <div className="font-bold text-slate-700 dark:text-slate-300">Diterbitkan Oleh:</div>
                <div className="font-extrabold text-slate-800 dark:text-slate-200 text-[10.5px]">
                  {form.companyName}
                </div>
                <div>📞 WA SLA Support: {form.phone}</div>
                <div>✉ Surel: {form.email}</div>
                <div className="leading-snug truncate">📍 Alamat: {form.address}</div>
              </div>

              {/* Table header simulation */}
              <div className="space-y-1.5 pt-1.5">
                <div className="bg-slate-50 dark:bg-slate-900 px-2 py-1 flex justify-between font-bold text-[9px] uppercase font-mono border border-slate-200/50">
                  <span style={{ color: form.pdfColorSecondary }}>Penjelasan Jasa SLA</span>
                  <span style={{ color: form.pdfColorSecondary }}>Total</span>
                </div>
                <div className="px-2 flex justify-between font-semibold text-[10px]">
                  <span>Layanan Monitoring Proaktif Router SLA</span>
                  <span>100% SLA OK</span>
                </div>
              </div>

              {/* QRIS / VA visual representation indicator */}
              <div className="mt-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-center font-mono space-y-2">
                <div className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold">
                  Pilihan Pembayaran Aktif:
                </div>
                
                {form.staticQrisUrl && (
                  <div className="space-y-1">
                    <img src={form.staticQrisUrl} className="w-16 h-16 mx-auto object-contain bg-white rounded p-0.5 border" alt="Mini QRIS" />
                    <span className="block text-[8.5px] font-extrabold text-indigo-650 dark:text-indigo-400 font-mono">✔ SCAN QRIS STATIS AKTIF</span>
                  </div>
                )}

                <div className="space-y-1 text-left text-[9px]">
                  {form.customPaymentMethods?.filter(p => p.active).map(p => (
                    <div key={p.id} className="border-b border-slate-200/40 dark:border-slate-800/60 pb-1 flex justify-between">
                      <span className="font-bold text-slate-650 dark:text-slate-300">{p.name}:</span>
                      <span className="font-semibold text-slate-905 dark:text-indigo-350">{p.accountNumber}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SLA Footer policy display */}
              <div className="border-t border-dashed border-slate-250 dark:border-slate-800 pt-2 text-center text-[9px] text-slate-400 font-semibold leading-normal italic">
                "{form.pdfCustomNote}"
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
