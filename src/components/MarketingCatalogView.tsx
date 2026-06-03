import React, { useState, useMemo } from "react";
import { 
  ShoppingBag, 
  Server, 
  Wifi, 
  Layers, 
  Lock, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  Search, 
  Sliders, 
  Database, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  Send, 
  Globe, 
  Users, 
  Cpu,
  Tv,
  QrCode,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatIDR } from "../utils/exportFiles";

interface MarketingCatalogViewProps {
  onNavigate: (tabId: string) => void;
  bizProfile: any;
  clients: any[];
}

export default function MarketingCatalogView({ onNavigate, bizProfile, clients }: MarketingCatalogViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "dedicated" | "broadband" | "voucher" | "cloud">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bandwidthSlider, setBandwidthSlider] = useState<number>(50); // in Mbps
  const [multiplier, setMultiplier] = useState<"1:1" | "1:4" | "1:10">("1:4");
  
  // Voucher simulated purchase state
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [voucherPaymentStep, setVoucherPaymentStep] = useState<"idle" | "payment" | "processing" | "success">("idle");
  const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "VA_BCA">("QRIS");
  const [generatedVoucherCode, setGeneratedVoucherCode] = useState("");
  const [checkoutStatusLogs, setCheckoutStatusLogs] = useState<string[]>([]);
  
  // Custom consulting modal state
  const [consultingModalOpen, setConsultingModalOpen] = useState(false);
  const [selectedProductForConsulting, setSelectedProductForConsulting] = useState<any | null>(null);
  const [consultingName, setConsultingName] = useState("");
  const [consultingCompany, setConsultingCompany] = useState("");
  const [consultingPhone, setConsultingPhone] = useState("");
  const [consultingNotes, setConsultingNotes] = useState("");
  const [consultingSuccess, setConsultingSuccess] = useState(false);

  // E-Catalog Products Data
  const catalogProducts = useMemo(() => {
    return [
      {
        id: "prod-sla-10",
        name: "Dedicated Business SLA Gold 10 Mbps",
        category: "dedicated",
        price: 2500000,
        bandwidth: "10 Mbps 1:1 Symmetric",
        description: "Internet dedicated khusus korporasi dengan jaminan ketersediaan link SLA 99.9%, IP Public Static /30, dan helpdesk NOC 24/7.",
        icon: ShieldCheck,
        features: ["Dedicated Public IPv4 /30", "SLA 99.9% Uptime Guarantee", "BGP Multihoming Ready", "Direct Peer to OpenIXP & IIX", "Dual-Last Mile Fiber Optic / Wireless"],
        badge: "POPULER BISNIS"
      },
      {
        id: "prod-sla-50",
        name: "Dedicated Business SLA Platinum 50 Mbps",
        category: "dedicated",
        price: 9500000,
        bandwidth: "50 Mbps 1:1 Symmetric",
        description: "Didesain untuk skala enterprise, e-commerce backend, atau hosting internal dengan transmisi stabil ultra-low latency.",
        icon: ShieldCheck,
        features: ["Dedicated Public IPv4 /29", "SLA 99.95% Uptime Guarantee", "Multi-Routerboard CCR Ready", "MRTG Graph Web Access Real-time", "Zero Packet Drop Tier-1 Routing"],
        badge: "TERBAIK ENTERPRISE"
      },
      {
        id: "prod-sla-100",
        name: "Dedicated Carrier SLA Premium 100 Mbps",
        category: "dedicated",
        price: 17500000,
        bandwidth: "100 Mbps 1:1 Symmetric",
        description: "Layanan link fiber optic redundant backbone untuk data center, universitas, atau ISP lokal berskala regional.",
        icon: Server,
        features: ["Subnet IP Public /28 Dedicated", "Premium International Routing Bandwidth", "Backbone Fiber Redundancy (Ring-Path)", "Prioritas Gangguan SLA < 1 Jam", "Sertifikasi SLA Bergaransi Tertulis"],
        badge: "PREMIUM CARRIER"
      },
      {
        id: "prod-soho-30",
        name: "Broadband Pro SOHO 30 Mbps",
        category: "broadband",
        price: 450000,
        bandwidth: "30 Mbps Up-To 1:4",
        description: "Internet cepat untuk usaha mikro Ruko, Cafe, Kantor Cabang, atau Coworking space dengan prioritas QoS traffic zoom & cloud.",
        icon: Wifi,
        features: ["Router RB750Gr3 Dipinjamkan Gratis", "Symmetric Download/Upload up to 1:4", "Unlimited Kuota No FUP", "Monitoring Link otomatis dari NOC", "Dukungan Teknis via Live Chat"],
        badge: "MURAH CAFE"
      },
      {
        id: "prod-soho-100",
        name: "Broadband Infinite Office 100 Mbps",
        category: "broadband",
        price: 1250000,
        bandwidth: "100 Mbps Up-To 1:4",
        description: "Broadband fiber optic super cepat untuk kantor sampai dengan 25 user aktif tanpa drop koneksi saat download besar.",
        icon: Wifi,
        features: ["MikroTik RB4011/hAP ac3 Gratis Sewa", "Prioritas Bandwidth Game & Cloud Meet", "SLA Layanan Monitoring 24/7", "Dynamic IP Public (Bridge Mode)", "Instant Setup SLA Kurang 24 Jam"],
        badge: "TERLARIS SOHO"
      },
      {
        id: "prod-coloc",
        name: "Routerboard MikroTik Cloud Hosted Core",
        category: "cloud",
        price: 350000,
        bandwidth: "1 Gbps Port Speed",
        description: "Cloud CHR MikroTik RouterOS Routerboard VPS berlisensi P1/Unlimited untuk kebutuhan tunneling, VPN aggregation, atau PPPoE concentrator.",
        icon: Cpu,
        features: ["Licence CHR Level P1 Ready", "Instalasi Lokasi SDK Jakarta (IDC 3D)", "Backup Harian Otomatis", "Terminal VNC & Webfig Akses Penuh", "Termasuk Tunnel Wireguard, L2TP, OVPN"],
        badge: "CLOUD VPS"
      },
      {
        id: "prod-vouch-daily",
        name: "Hotspot Voucher - Paket Combo Harian",
        category: "voucher",
        price: 5000,
        bandwidth: "Speed Max 5 Mbps",
        description: "Voucher internet prabayar hotspot unlimited kuota untuk pemakaian 1 hari penuh di seluruh Node RTRW-Net beraliansi NOC.",
        icon: Tv,
        features: ["Uptime Limit: 24 Jam Aktif", "Batas Kecepatan 5M/5M", "Tanpa Lemot / FUP Habis", "Bisa digunakan di Handphone, Laptop, TV", "Generate Instan via MikroTik API"],
        badge: "MURAHLAYAK"
      },
      {
        id: "prod-vouch-weekly",
        name: "Hotspot Voucher - Paket Express Mingguan",
        category: "voucher",
        price: 25000,
        bandwidth: "Speed Max 10 Mbps",
        description: "Voucher internet prabayar seminggu handal tanpa lag, cocok untuk siswa, mahasiswa, dan WFH rumahan hemat biaya.",
        icon: Tv,
        features: ["Uptime Limit: 7 Hari Full", "Kecepatan Stabil up to 10 Mbps", "Kompatibel Auto-Login Portal", "Security User Unik Mencegah Hack", "Gratis akses portal edukasi lokal"],
        badge: "MANTAP SEMINGGU"
      },
      {
        id: "prod-vouch-monthly",
        name: "Hotspot Voucher - Paket Gamer Bulanan",
        category: "voucher",
        price: 85000,
        bandwidth: "Speed Max 15 Mbps",
        description: "Koneksi Premium stabil bulanan sepuasnya tanpa batas kuota. Ping super stabil ke server MLBB, PUBG, dan FF.",
        icon: Sparkles,
        features: ["Uptime Limit: 30 Hari Full", "Prioritas QoS Gaming Routerboard", "Kecepatan up to 15 Mbps", "Multilink auto-reconnect", "Instant Support 15 Menit"],
        badge: "REKOMENDASI ATLET"
      }
    ];
  }, []);

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(p => {
      const matchCat = selectedCategory === "all" ? true : p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.bandwidth.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [catalogProducts, selectedCategory, searchQuery]);

  // Pricing Configurator Calculation
  const customEstimateResult = useMemo(() => {
    // Math logic: base price is IDR 8,000 per Mbps for 1:10 (Broadband), 
    // IDR 35,000 per Mbps for 1:4 (Dedicated Shared), and IDR 200,000 per Mbps for 1:1 Dedicated SLA.
    let ratePerMbps = 15000;
    if (multiplier === "1:4") ratePerMbps = 45000;
    if (multiplier === "1:1") ratePerMbps = 240000;

    let calPrice = bandwidthSlider * ratePerMbps;
    if (bandwidthSlider > 300) {
      calPrice = calPrice * 0.85; // bulk discount 15%
    } else if (bandwidthSlider > 100) {
      calPrice = calPrice * 0.92; // bundle discount 8%
    }

    // Recommended router based on throughput choice
    let recRouter = "hAP AC Lite / RB750Gr3 Hex (Hemat / SOHO)";
    let cpuSpec = "1 Core 880MHz, MIPSBE, RAM 256MB";
    if (bandwidthSlider > 350) {
      recRouter = "CCR2004-16G-2S+ Core Carrier Cloud Router";
      cpuSpec = "Quad-Core AL32400 1.7GHz, ARM 64bit, RAM 4GB";
    } else if (bandwidthSlider > 100) {
      recRouter = "RB4011iGS+RM / RB5009UG+S+IN Heavy Routerboard";
      cpuSpec = "Quad-Core AL21400 1.4GHz, ARM, RAM 1GB / 2GB";
    } else if (bandwidthSlider > 60) {
      recRouter = "hAP ac3 / hex S (Optimal Gigabit Office)";
      cpuSpec = "Quad-Core IPQ-4019 716MHz, ARM 32bit, RAM 256MB";
    }

    return {
      price: Math.round(calPrice / 1000) * 1000,
      recommendedRouter: recRouter,
      cpuSpecText: cpuSpec
    };
  }, [bandwidthSlider, multiplier]);

  // Trigger simulated purchase on interactive prepaid vouchers
  const handleStartVoucherPurchase = (product: any) => {
    setSelectedVoucher(product);
    setVoucherPaymentStep("payment");
    setPaymentMethod("QRIS");
    setGeneratedVoucherCode("");
    setCheckoutStatusLogs([]);
  };

  const handleSimulatePayment = () => {
    if (!selectedVoucher) return;
    setVoucherPaymentStep("processing");
    setCheckoutStatusLogs([
      "📡 [NOC CORE GATEWAY] Menginisiasi transaksi Virtual API...",
      `⚡ [PAYMENT SINK] Menunggu verifikasi pembayaran Rp ${selectedVoucher.price.toLocaleString("id-ID")} via ${paymentMethod}...`,
    ]);

    setTimeout(() => {
      setCheckoutStatusLogs(prev => [...prev, "🟢 [SUCCESS] Pembayaran terkonfirmasi sistem bank penyedia otomatis!"]);
      setTimeout(() => {
        setCheckoutStatusLogs(prev => [...prev, "🎯 [ROS API] Membuka socket API Routerboard & merequest voucher baru..."]);
        setTimeout(() => {
          // Generate a real looking Mikrotik Hotspot voucher code
          const code = `NOC-${selectedVoucher.price >= 85000 ? "BULANAN" : selectedVoucher.price >= 25000 ? "MINGGUAN" : "HARIAN"}-${Math.floor(Math.random() * 900000 + 100000)}`;
          setGeneratedVoucherCode(code);
          setCheckoutStatusLogs(prev => [...prev, `✅ [READY] Voucher Sukses terbentuk di user-manager: "${code}"`]);
          setVoucherPaymentStep("success");
        }, 800);
      }, 700);
    }, 1200);
  };

  const handleConsultingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultingName || !consultingPhone) return;
    setConsultingSuccess(true);
    setTimeout(() => {
      setConsultingSuccess(false);
      setConsultingModalOpen(false);
      setConsultingName("");
      setConsultingCompany("");
      setConsultingPhone("");
      setConsultingNotes("");
    }, 3500);
  };

  return (
    <div className="space-y-12 pb-16" id="marketing-fe-page">
      
      {/* 1. PROFESSIONAL HERO HEADER SECTION */}
      <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl border border-slate-900 shadow-2xl p-6 sm:p-10 lg:p-12" id="catalog-hero-box">
        {/* Visual background grids */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.18),transparent_50%)] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none" 
          style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        />
        
        <div className="max-w-4xl relative space-y-6" id="hero-content">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full" id="hero-badge">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse animate-duration-1000" />
            <span className="text-[10px] font-mono font-extrabold tracking-widest text-blue-400 uppercase">
              Carrier-Grade NOC Network Nusantara
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-sans leading-tight">
            Infrastruktur Internet <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Proaktif SLA 99.9%</span> & Layanan Mikrotik Cerdas
          </h1>

          <p className="text-sm text-slate-350 max-w-2xl leading-relaxed">
            Selamat datang di portal penjualan publik NOC Net Nusantara. Kami menyediakan koneksi Internet Dedicated SLA Simetris, Broadband prioritas SOHO, serta integrasi manajemen voucher/PPPoE terpusat langsung ke core routerboard Anda secara otomatis via REST API.
          </p>

          <div className="flex flex-wrap gap-3 pt-2" id="hero-actions">
            <a 
              href="#ecatalog-grid"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-lg shadow-blue-600/25 uppercase tracking-wider"
            >
              <ShoppingBag className="w-4 h-4" /> Buka E-Katalog Layanan
            </a>
            <button 
              onClick={() => onNavigate("customer-portal")}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-bold text-xs rounded-xl cursor-pointer border border-slate-800 transition-all inline-flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Users className="w-4 h-4 text-blue-400" /> Portal Pelanggan
            </button>
            <button 
              onClick={() => onNavigate("dashboard")}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-xl cursor-pointer border border-white/10 transition-all inline-flex items-center gap-1.5 uppercase tracking-wider"
            >
              <Server className="w-4 h-4 text-emerald-400" /> Secured Admin Console
            </button>
          </div>

          {/* Quick numbers tracker layout */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-900 pt-6 mt-6 max-w-xl text-left" id="hero-quick-stats">
            <div>
              <span className="text-xl font-mono font-extrabold text-white block">99.9%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Uptime SLA Guaranteed</span>
            </div>
            <div>
              <span className="text-xl font-mono font-extrabold text-white block">15 Menit</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Respon Gangguan NOC</span>
            </div>
            <div>
              <span className="text-xl font-mono font-extrabold text-white block">{(clients.length * 12 + 180)} Gbps</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Total Trafik Core</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC INTERACTIVE PRICING CALCULATOR & ROUTER RECOMMENDATION */}
      <section className="bg-white dark:bg-[#0d1527] p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6" id="pricing-selector-section">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800/85 pb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-sans">
                Kulator & Penyesuai Bandwidth Mandiri
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Slide kecepatan bandwidth untuk melihat taksiran harga & spesifikasi Routerboard MikroTik fisik yang sesuai.</p>
          </div>
          <span className="text-[9.5px] font-mono bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-extrabold py-1 px-3 rounded-full border border-blue-100 dark:border-blue-900/40 uppercase">
            Estimasi Real-time
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* SLIDER CONTROLS (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-350">Kecepatan Internet:</span>
                <span className="font-mono font-extrabold text-[#2563eb] text-lg bg-blue-50 dark:bg-indigo-950/20 px-3 py-1 rounded-xl">
                  {bandwidthSlider} Mbps
                </span>
              </div>
              
              <input 
                type="range" 
                min={10} 
                max={1000} 
                step={10}
                value={bandwidthSlider}
                onChange={(e) => setBandwidthSlider(Number(e.target.value))}
                className="w-full h-2 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono mt-1">
                <span>10 Mbps</span>
                <span>250 Mbps</span>
                <span>500 Mbps</span>
                <span>750 Mbps</span>
                <span>1000 Mbps (1 Gbps)</span>
              </div>
            </div>

            {/* Multiplying Shared Option check */}
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-3">Rasio Alokasi (Tipe Layanan):</span>
              <div className="grid grid-cols-3 gap-3" id="multiplier-select-grid">
                {[
                  { id: "1:10", label: "Broadband (1:10)", desc: "Sumbu trafik berbagi up to", multi: "1:10" },
                  { id: "1:4", label: "Broadband Pro (1:4)", desc: "Kantor & Soho Prioritas", multi: "1:4" },
                  { id: "1:1", label: "Dedicated SLA (1:1)", desc: "Symmetric Tanpa Berbagi", multi: "1:1" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMultiplier(item.id as any)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      multiplier === item.id 
                        ? "bg-blue-600 text-white border-transparent shadow-md" 
                        : "bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-250"
                    }`}
                  >
                    <span className="block text-xs font-bold leading-none">{item.label}</span>
                    <span className={`block text-[9.5px] mt-1.5 leading-tight ${multiplier === item.id ? "text-blue-100" : "text-slate-400"}`}>{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ESTIMATED PRICE BOX & RECOMMENDED MIKROTIK DEVICE (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-2xl p-5 space-y-4" id="pricing-recommendations-wrapper">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase font-mono block">Estimasi Tarif Bulanan:</span>
              <div className="flex items-baseline gap-1 text-slate-900 dark:text-white" id="pricing-calc">
                <span className="text-3xl font-extrabold tracking-tight text-[#16a34a] font-mono">
                  {formatIDR(customEstimateResult.price)}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ Bulan</span>
              </div>
              <span className="text-[10px] text-slate-400 block pt-0.5 italic">** Harga sewa belum termasuk PPN 11% & Instalasi fisik kabel FO.</span>
            </div>

            {/* MikroTik Routerboard suggestions box details */}
            <div className="p-3.5 bg-blue-50/50 dark:bg-indigo-950/20 border border-blue-100 dark:border-indigo-900/50 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-[#1e40af] dark:text-blue-400 uppercase tracking-widest font-mono flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" /> REKOMENDASI ROUTER MIKROTIK FISIK:
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                {customEstimateResult.recommendedRouter}
              </p>
              <div className="text-[10.5px] text-slate-500 font-mono flex flex-col gap-0.5">
                <span>⚡ CPU: <strong className="text-slate-700 dark:text-slate-350">{customEstimateResult.cpuSpecText}</strong></span>
                <span>📦 ROS: <strong className="text-slate-700 dark:text-slate-350">RouterOS v7 (Stable) API Enabled</strong></span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedProductForConsulting({
                  name: `Custom Kecepatan: ${bandwidthSlider} Mbps (${multiplier})`,
                  price: customEstimateResult.price,
                  description: `Pemilihan paket penyesuai kecepatan throughput internet sebesar ${bandwidthSlider} Mbps dengan rasio alokasi bandwidth ${multiplier}. Disandingkan dengan Router Fisik ${customEstimateResult.recommendedRouter}.`
                });
                setConsultingModalOpen(true);
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm uppercase tracking-wider"
              id="btn-trigger-custom-consult"
            >
              Ajukan Penawaran Resmi & SLA
            </button>
          </div>

        </div>
      </section>

      {/* 3. SEARCHABLE & TAB-FILTERED E-CATALOG LIST */}
      <section className="space-y-6" id="ecatalog-section">
        
        {/* Core Headers filters and search bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4" id="catalog-control-header">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white font-sans flex items-center gap-1.5">
              <ShoppingBag className="w-5 h-5 text-[#2563eb]" /> Katalog Layanan & Produk Aktif NOC (E-Catalog)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Mudah memilah seluruh paket sedia, VPN proxy, & pembelian instan voucher hotspot.</p>
          </div>

          <div className="relative w-full md:w-64" id="catalog-search-wrapper">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Cari paket internet (misal: SOHO, SLA)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-250 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-905 text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tab category segment horizontal bar */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1" id="cat-tabs-segment">
          {[
            { id: "all", label: "Semua Produk / Layanan", icon: Layers },
            { id: "dedicated", label: "Internet Dedicated SLA (1:1)", icon: ShieldCheck },
            { id: "broadband", label: "Broadband Prioritas SOHO", icon: Wifi },
            { id: "cloud", label: "MikroTik Cloud VPS & Tunnel", icon: Server },
            { id: "voucher", label: "Hotspot Vouchers Prabayar", icon: Tv }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                  isSelected 
                    ? "bg-blue-600 text-white shadow-sm font-extrabold" 
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-250"
                }`}
                id={`cat-btn-${tab.id}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white animate-pulse" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="ecatalog-grid">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-[#0d1527] p-12 text-center border border-slate-200 dark:border-slate-800 rounded-2xl text-xs italic text-slate-400">
              Tidak ada produk atau paket internet yang cocok dengan filter penelusuran Anda.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const Icon = product.icon;
              const isVoucher = product.category === "voucher";
              return (
                <div 
                  key={product.id} 
                  className="bg-white dark:bg-[#0d1527] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-blue-300 dark:hover:border-indigo-900/50 hover:shadow-md transition-all relative overflow-hidden"
                  id={`product-card-${product.id}`}
                >
                  {/* Category upper badge overlay */}
                  <span className="absolute top-4 right-4 text-[8.5px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-extrabold font-mono tracking-widest">
                    {product.category}
                  </span>

                  <div className="space-y-4">
                    {/* Header section icon + titles */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-[#2563eb] shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        {product.badge && (
                          <span className="text-[7.5px] bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                            {product.badge}
                          </span>
                        )}
                        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight mt-1 truncate max-w-[170px]" title={product.name}>
                          {product.name}
                        </h3>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-3 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Bandwidth display label banner */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/80 text-[10.5px] font-mono flex items-center justify-between text-slate-700 dark:text-slate-300">
                      <span>Kapasitas:</span>
                      <strong className="text-blue-600 dark:text-blue-400">{product.bandwidth}</strong>
                    </div>

                    {/* Technical details list checkboxes */}
                    <ul className="text-[10px] space-y-1 text-slate-550 dark:text-slate-400">
                      {product.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing and checkout action bar */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 mt-5 pt-4 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[8.5px] text-slate-400 uppercase tracking-widest font-mono block">Mulai Dari:</span>
                      <strong className="text-sm font-mono font-extrabold text-[#111827] dark:text-slate-100 block">
                        {formatIDR(product.price)}
                      </strong>
                    </div>

                    {isVoucher ? (
                      <button
                        onClick={() => handleStartVoucherPurchase(product)}
                        className="px-3.5 py-1.5 bg-[#128c7e] hover:bg-[#075e54] text-white font-bold text-[10px] rounded-xl cursor-pointer transition-colors uppercase font-mono"
                      >
                        Beli Voucher
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedProductForConsulting(product);
                          setConsultingModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-xl cursor-pointer transition-colors uppercase tracking-wider"
                      >
                        Ajukan Sewa
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </section>

      {/* 4. MODALS AND CHECKOUT WORK FLOWS (Hotspot Voucher Instant Purchase) */}
      <AnimatePresence>
        {selectedVoucher && voucherPaymentStep !== "idle" && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" id="voucher-checkout-modal animate-enter">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#0d1527] border border-slate-205 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Checkout Voucher Hotspot</h3>
                    <span className="text-[9px] font-mono text-slate-400">ROS User Manager RouterOS API Sync</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedVoucher(null);
                    setVoucherPaymentStep("idle");
                  }} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded p-1 cursor-pointer"
                >
                  ✖
                </button>
              </div>

              {/* FLOW 1: PAYMENT FORM */}
              {voucherPaymentStep === "payment" && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1 block p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150">
                    <span className="text-[10px] font-bold text-slate-450 uppercase font-mono block">Paket Pilihan:</span>
                    <strong className="text-xs text-slate-800 dark:text-white font-bold block">{selectedVoucher.name}</strong>
                    <span className="text-[10.5px] text-blue-600 font-mono font-bold block">{selectedVoucher.bandwidth}</span>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
                      <span className="font-semibold text-slate-500">Harga Voucher:</span>
                      <strong className="text-[#15803d] font-mono font-extrabold text-sm">{formatIDR(selectedVoucher.price)}</strong>
                    </div>
                  </div>

                  {/* Payment selection */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-bold text-slate-400 uppercase">Metode Pembayaran Instan:</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod("QRIS")}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                          paymentMethod === "QRIS" 
                            ? "border-emerald-500/80 bg-emerald-500/5 text-slate-900 dark:text-white font-semibold" 
                            : "border-slate-205 dark:border-slate-800 text-slate-500 bg-white dark:bg-slate-905"
                        }`}
                      >
                        <span className="text-xs leading-none">QRIS QR Generator</span>
                        <QrCode className="w-4 h-4 text-emerald-500" />
                      </button>
                      <button
                        onClick={() => setPaymentMethod("VA_BCA")}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                          paymentMethod === "VA_BCA" 
                            ? "border-emerald-500/80 bg-emerald-500/5 text-slate-900 dark:text-white font-semibold" 
                            : "border-slate-205 dark:border-slate-800 text-slate-500 bg-white dark:bg-slate-905"
                        }`}
                      >
                        <span className="text-xs leading-none">BCA Virtual Account</span>
                        <DollarSign className="w-4 h-4 text-blue-500" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulatePayment}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm uppercase tracking-wider block"
                  >
                    Bayar & Generate Voucher Sekarang
                  </button>
                </div>
              )}

              {/* FLOW 2: PROCESSING LOADER */}
              {voucherPaymentStep === "processing" && (
                <div className="py-6 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#128c7e]" />
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">Menghubungkan ke API...</span>
                  <div className="w-full max-w-xs bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 space-y-1">
                    {checkoutStatusLogs.map((log, idx) => (
                      <p key={idx} className="leading-relaxed">{log}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* FLOW 3: SUCCESS CODE DISPLAY */}
              {voucherPaymentStep === "success" && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase">Voucher ID Berhasil Aktif!</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      API Routerboard telah berhasil diklarifikasi. Masukkan username di bawah ke halaman login portal wifi Hotspot di lokasi Anda.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-800 space-y-1 text-center">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">KODE VOUCHER ANDA:</span>
                    <strong className="text-xl font-mono text-[#075e54] dark:text-emerald-400 tracking-wider font-extrabold block">
                      {generatedVoucherCode}
                    </strong>
                    <span className="text-[10px] text-slate-400 block pt-1 leading-normal font-mono">
                      Quota Limit: Unlimited • Limit: {selectedVoucher.bandwidth}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedVoucher(null);
                      setVoucherPaymentStep("idle");
                    }}
                    className="w-full py-2 bg-[#075e54] hover:bg-[#075e54]/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Selesai & Tutup Jendela
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CONSULTING CUSTOM REQUEST Penyangga MODAL */}
      <AnimatePresence>
        {consultingModalOpen && selectedProductForConsulting && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#0d1527] border border-slate-205 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 relative overflow-hidden"
              id="consulting-modal"
            >
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-indigo-900/20 text-[#2563eb] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase leading-none">Formulir Pesanan & Konsultasi</h3>
                    <span className="text-[9.5px] text-slate-400 font-mono mt-1 block">Prioritas Respon Tim NOC &lt; 15 Menit</span>
                  </div>
                </div>
                <button 
                  onClick={() => setConsultingModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded p-1 cursor-pointer text-xs"
                >
                  ✖
                </button>
              </div>

              {consultingSuccess ? (
                <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase">Permintaan Berhasil Dikirim!</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                      Sistem sedang menjadwalkan PIC NOC untuk menghubungi nomor telepon Anda via WhatsApp. Penawaran resmi SLA dalam format PDF akan dikirimkan langsung.
                    </p>
                  </div>
                  <span className="inline-block text-[10.5px] font-mono text-[#075e54] font-bold bg-emerald-50 dark:bg-emerald-950/20 py-1 px-3 border border-emerald-100 dark:border-emerald-900/40 rounded-lg animate-pulse">
                    TIM NOC MENYIAPKAN SOCKET CHAT...
                  </span>
                </div>
              ) : (
                <form onSubmit={handleConsultingSubmit} className="space-y-4 text-xs" id="custom-consult-form">
                  {/* Selected product card summary overlay */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1">
                    <span className="text-[9px] font-bold text-slate-405 uppercase font-mono block">Layanan Terpilih:</span>
                    <strong className="text-xs text-slate-900 dark:text-white block font-bold">{selectedProductForConsulting.name}</strong>
                    <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">{selectedProductForConsulting.description}</p>
                    <div className="flex justify-between text-[11px] font-mono pt-1.5 border-t border-slate-200 dark:border-slate-800 mt-1.5 text-slate-700 dark:text-slate-350">
                      <span>Harga/Tarif Bulanan:</span>
                      <strong className="text-blue-600 dark:text-blue-400">{formatIDR(selectedProductForConsulting.price)}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase">Nama Lengkap PIC *</label>
                      <input 
                        type="text" 
                        required
                        value={consultingName}
                        onChange={(e) => setConsultingName(e.target.value)}
                        placeholder="Contoh: Heru Prasetyo"
                        className="w-full text-xs p-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-905 rounded-lg text-slate-800 dark:text-white focus:outline-blue-500"
                        id="consulting-pic-name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-400 uppercase">Nama Perusahaan / Organisasi</label>
                      <input 
                        type="text" 
                        value={consultingCompany}
                        onChange={(e) => setConsultingCompany(e.target.value)}
                        placeholder="Contoh: PT Nusantara Cyber ISP"
                        className="w-full text-xs p-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-905 rounded-lg text-slate-800 dark:text-white focus:outline-blue-500"
                        id="consulting-comp"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase">No. Handphone / WhatsApp Aktif *</label>
                    <input 
                      type="text" 
                      required
                      value={consultingPhone}
                      onChange={(e) => setConsultingPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Contoh: 081299887766"
                      className="w-full text-xs p-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-905 rounded-lg text-slate-800 dark:text-white focus:outline-blue-500 font-mono font-bold"
                      id="consulting-phone-inp"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-bold text-slate-400 uppercase">Catatan Tambahan (Bandwidth khusus, Alamat pemasangan dll)</label>
                    <textarea 
                      rows={2}
                      value={consultingNotes}
                      onChange={(e) => setConsultingNotes(e.target.value)}
                      placeholder="Mohon estimasikan penarikan kabel fiber-optic sejauh 2 KM..."
                      className="w-full text-xs p-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-905 rounded-lg text-slate-800 dark:text-white focus:outline-blue-500"
                      id="consulting-notes-text"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm uppercase tracking-wider inline-flex items-center justify-center gap-1"
                    id="btn-send-consult-request"
                  >
                    Kirim Permintaan Konsultasi <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
