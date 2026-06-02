import { Client, Invoice, NotificationTemplate, BookkeepingRecord, ServiceCategory } from "./types";

// Initial Service Categories
export const INITIAL_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "SVC-001",
    name: "NOC Basic 8x5",
    basePrice: 3000000,
    type: "Fixed",
    billingType: "fixed",
    description: "Pemantauan network basic jam kerja kantor 8x5 dengan alert telegram.",
    icon: "Activity"
  },
  {
    id: "SVC-002",
    name: "NOC Standard 24x7",
    basePrice: 5500000,
    type: "Fixed",
    billingType: "fixed",
    description: "Pemantauan proaktif server dan link backup 24x7 non-stop.",
    icon: "Activity"
  },
  {
    id: "SVC-003",
    name: "NOC Enterprise High-Availability",
    basePrice: 12000000,
    type: "Fixed",
    billingType: "fixed",
    description: "Pemantauan multi-site high availability SLA 99.9% dan recovery backup.",
    icon: "ShieldAlert"
  },
  {
    id: "SVC-004",
    name: "SLA Gold Monitoring 24x7",
    basePrice: 7500000,
    type: "Fixed",
    billingType: "fixed",
    description: "Paket proaktif monitoring gold terintegrasi ticketing ticketing SLA NOC.",
    icon: "Tv"
  },
  {
    id: "SVC-005",
    name: "VPN IPSec Tunneling & Firewall",
    basePrice: 2000000,
    type: "Fixed",
    billingType: "fixed",
    description: "Instalasi dan penyewaan tunnel VPN aman terenkripsi antar cabang.",
    icon: "Lock"
  },
  {
    id: "SVC-006",
    name: "SD-WAN Dedicated Monitoring",
    basePrice: 4500000,
    type: "Fixed",
    billingType: "fixed",
    description: "Penyediaan router SD-WAN dan pemrosesan trafik internet failover.",
    icon: "Cpu"
  },
  {
    id: "SVC-007",
    name: "Monitoring Node SNMP & Ping",
    basePrice: 1500000,
    type: "Fixed",
    billingType: "fixed",
    description: "Sistem polling snmp terdistribusi ke 50 sensor internal NOC.",
    icon: "Activity"
  },
  {
    id: "SVC-008",
    name: "NOC & Cloud Managed Service",
    basePrice: 8000000,
    type: "Fixed",
    billingType: "fixed",
    description: "Pemeliharaan resources cloud, AWS VPC, billing optimization, dan alarm.",
    icon: "Tv"
  },
  {
    id: "SVC-MT-01",
    name: "Mikrotik SLA PPPoE Monitoring",
    basePrice: 5000,
    type: "Mikrotik_Dynamic",
    billingType: "per_pppoe_active",
    description: "Sistem penagihan dinamis berbasis jumlah user PPPoE aktif pada router MikroTik Anda (IDR 5,000 / active user).",
    icon: "Wifi"
  }
];

// Initial Clients
export const INITIAL_CLIENTS: Client[] = [
  {
    id: "CLI-001",
    name: "Budi Hartono",
    company: "IndoNet Solusindo",
    email: "budi.hartono@indonet.net.id",
    phone: "081234567890",
    address: "Jl. HR Rasuna Said No. 12, Jakarta Selatan",
    nocNotes: "Server bandwidth utama sering spike di atas 90% pada pukul 12:00-14:00. Kirimkan log ping tambahan.",
    communicationPreference: "whatsapp",
    serviceType: "NOC Standard 24x7",
    monthlyFee: 5500000,
    status: "Active",
    createdAt: "2026-01-15",
    selectedServices: ["SVC-002"]
  },
  {
    id: "CLI-002",
    name: "Ratna Sari",
    company: "PT Citra Global ISP",
    email: "ratna.sari@citraglobal.net",
    phone: "081987654321",
    address: "Gedung Cyber LT 4, Kuningan, Jakarta Selatan",
    nocNotes: "Sangat sensitif terhadap SLA Latency. Butuh alert telegram/WA detik itu juga jika link backup terindikasi flapping.",
    communicationPreference: "whatsapp",
    serviceType: "NOC Enterprise High-Availability",
    monthlyFee: 12150000, // combined: fixed (12.000.000) + Mikrotik (30 active * 5000 = 150.000)
    status: "Active",
    createdAt: "2026-01-20",
    selectedServices: ["SVC-003", "SVC-MT-01"],
    mikrotikIp: "103.124.99.2",
    mikrotikPort: 8728,
    mikrotikUser: "noc_monitor",
    mikrotikPassword: "SuperSecurePassword123",
    mtActivePppoeCount: 30,
    mtActiveHotspotCount: 88,
    mtPppoeSecretCount: 154,
    mtRouterModel: "MikroTik CCR2004-16G-2S+",
    mtUptime: "45d 12h 04m",
    mtLastSync: "2026-06-02 10:45:11",
    customPricePerPppoe: 5000,
    useManualMikrotikCounts: false
  },
  {
    id: "CLI-003",
    name: "Agus Wijaya",
    company: "Techno Sinergi Corp",
    email: "agus.wijaya@tsm.co.id",
    phone: "085699442211",
    address: "Kawasan Industri MM2100 Blok C-3, Cibitung",
    nocNotes: "Monitoring berjalan lancar. Hubungi PIC lokal bapak Edi jika backup link BGP down.",
    communicationPreference: "email",
    serviceType: "NOC Basic 8x5",
    monthlyFee: 3000000,
    status: "Active",
    createdAt: "2026-02-10",
    selectedServices: ["SVC-001"]
  },
  {
    id: "CLI-004",
    name: "Maria Lestari",
    company: "Aero Global Hosting",
    email: "billing@aeroglobal.id",
    phone: "087755331122",
    address: "Komp. Ruko Balikpapan Super Block No. B-2, Balikpapan",
    nocNotes: "Pelanggan hosting korporat. Melakukan pemeliharaan rutin UPS switchboard setiap hari Minggu pagi.",
    communicationPreference: "email",
    serviceType: "SLA Gold Monitoring 24x7",
    monthlyFee: 7500000,
    status: "Active",
    createdAt: "2026-03-01",
    selectedServices: ["SVC-004"]
  },
  {
    id: "CLI-005",
    name: "Wahyu Pratama",
    company: "Sinarindo Security",
    email: "wahyu@sinarindo.co.id",
    phone: "082122334455",
    address: "Jl. Jend. Sudirman Kav 52-53, Jakarta",
    nocNotes: "Kontrak ditangguhkan sementara karena relokasi kantor utama.",
    communicationPreference: "whatsapp",
    serviceType: "NOC Standard 24x7",
    monthlyFee: 5500000,
    status: "Inactive",
    createdAt: "2026-01-05",
    selectedServices: ["SVC-002"]
  }
];

// Initial Invoices spanning March, April, May, and June 2026
export const INITIAL_INVOICES: Invoice[] = [
  // March 2026
  {
    id: "INV-2026-001",
    clientId: "CLI-002",
    clientName: "Ratna Sari",
    clientCompany: "PT Citra Global ISP",
    amount: 12000000,
    billingMonth: "2026-03",
    issuedDate: "2026-03-01",
    dueDate: "2026-03-10",
    status: "Paid",
    reminderSentCount: 1,
    paymentMethod: "Bank Transfer",
    paymentDate: "2026-03-05",
    bankAccountDetails: "Bank Mandiri VA: 8899120000002",
    qrisPayload: "00020101021226380010ID.CO.QRIS.WWW011893600002000010000303035204481155026263045A95"
  },
  {
    id: "INV-2026-002",
    clientId: "CLI-001",
    clientName: "Budi Hartono",
    clientCompany: "IndoNet Solusindo",
    amount: 5500000,
    billingMonth: "2026-03",
    issuedDate: "2026-03-01",
    dueDate: "2026-03-10",
    status: "Paid",
    reminderSentCount: 0,
    paymentMethod: "QRIS",
    paymentDate: "2026-03-04",
    bankAccountDetails: "",
    qrisPayload: "00020101021226380010ID.CO.QRIS.WWW011893600002000010000303035204481155026263045A95"
  },
  // April 2026
  {
    id: "INV-2026-003",
    clientId: "CLI-002",
    clientName: "Ratna Sari",
    clientCompany: "PT Citra Global ISP",
    amount: 12000000,
    billingMonth: "2026-04",
    issuedDate: "2026-04-01",
    dueDate: "2026-04-10",
    status: "Paid",
    reminderSentCount: 1,
    paymentMethod: "Bank Transfer",
    paymentDate: "2026-04-05",
    bankAccountDetails: "Bank Mandiri VA: 8899120000002",
    qrisPayload: "00020101021226380010ID.CO.QRIS.WWW011893600002000010000303035204481155026263045A95"
  },
  {
    id: "INV-2026-004",
    clientId: "CLI-001",
    clientName: "Budi Hartono",
    clientCompany: "IndoNet Solusindo",
    amount: 5500000,
    billingMonth: "2026-04",
    issuedDate: "2026-04-01",
    dueDate: "2026-04-10",
    status: "Paid",
    reminderSentCount: 0,
    paymentMethod: "QRIS",
    paymentDate: "2026-04-06",
    bankAccountDetails: "",
    qrisPayload: "00020101021226380010ID.CO.QRIS.WWW011893600002000010000303035204481155026263045A95"
  },
  {
    id: "INV-2026-005",
    clientId: "CLI-003",
    clientName: "Agus Wijaya",
    clientCompany: "Techno Sinergi Corp",
    amount: 3000000,
    billingMonth: "2026-04",
    issuedDate: "2026-04-01",
    dueDate: "2026-04-10",
    status: "Paid",
    reminderSentCount: 2,
    paymentMethod: "Bank Transfer",
    paymentDate: "2026-04-09",
    bankAccountDetails: "Bank BCA VA: 7711230000003"
  },
  // May 2026
  {
    id: "INV-2026-006",
    clientId: "CLI-002",
    clientName: "Ratna Sari",
    clientCompany: "PT Citra Global ISP",
    amount: 12000000,
    billingMonth: "2026-05",
    issuedDate: "2026-05-01",
    dueDate: "2026-05-10",
    status: "Paid",
    reminderSentCount: 0,
    paymentMethod: "Bank Transfer",
    paymentDate: "2026-05-05",
    bankAccountDetails: "Bank Mandiri VA: 8899120000002"
  },
  {
    id: "INV-2026-007",
    clientId: "CLI-001",
    clientName: "Budi Hartono",
    clientCompany: "IndoNet Solusindo",
    amount: 5500000,
    billingMonth: "2026-05",
    issuedDate: "2026-05-01",
    dueDate: "2026-05-10",
    status: "Paid",
    reminderSentCount: 3,
    paymentMethod: "QRIS",
    paymentDate: "2026-05-09",
    bankAccountDetails: ""
  },
  {
    id: "INV-2026-008",
    clientId: "CLI-004",
    clientName: "Maria Lestari",
    clientCompany: "Aero Global Hosting",
    amount: 7500000,
    billingMonth: "2026-05",
    issuedDate: "2026-05-01",
    dueDate: "2026-05-25", // Overdue now
    status: "Overdue",
    reminderSentCount: 3,
    paymentMethod: "",
    paymentDate: null
  },
  {
    id: "INV-2026-009",
    clientId: "CLI-003",
    clientName: "Agus Wijaya",
    clientCompany: "Techno Sinergi Corp",
    amount: 3000000,
    billingMonth: "2026-05",
    issuedDate: "2026-05-01",
    dueDate: "2026-05-10",
    status: "Paid",
    reminderSentCount: 1,
    paymentMethod: "Bank Transfer",
    paymentDate: "2026-05-08"
  },
  // June 2026 (Active/Unpaid tagihan - current month)
  {
    id: "INV-2026-010",
    clientId: "CLI-002",
    clientName: "Ratna Sari",
    clientCompany: "PT Citra Global ISP",
    amount: 12000000,
    billingMonth: "2026-06",
    issuedDate: "2026-06-01",
    dueDate: "2026-06-10",
    status: "Unpaid",
    reminderSentCount: 0,
    paymentMethod: "",
    paymentDate: null
  },
  {
    id: "INV-2026-011",
    clientId: "CLI-001",
    clientName: "Budi Hartono",
    clientCompany: "IndoNet Solusindo",
    amount: 5500000,
    billingMonth: "2026-06",
    issuedDate: "2026-06-01",
    dueDate: "2026-06-10",
    status: "Unpaid",
    reminderSentCount: 0,
    paymentMethod: "",
    paymentDate: null
  },
  {
    id: "INV-2026-012",
    clientId: "CLI-003",
    clientName: "Agus Wijaya",
    clientCompany: "Techno Sinergi Corp",
    amount: 3000000,
    billingMonth: "2026-06",
    issuedDate: "2026-06-01",
    dueDate: "2026-06-15",
    status: "Draft",
    reminderSentCount: 0,
    paymentMethod: "",
    paymentDate: null
  }
];

// Initial Bookkeeping (Log Kas)
export const INITIAL_BOOKKEEPING: BookkeepingRecord[] = [
  // Pendapatan Maret
  {
    id: "EXP-01",
    date: "2026-03-01",
    type: "Expense",
    category: "Lisensi Software Monitoring",
    description: "Lisensi PRTG Core Monitor & VM Pro",
    amount: 2200000
  },
  {
    id: "EXP-02",
    date: "2026-03-02",
    type: "Expense",
    category: "Sewa Server & Cloud",
    description: "Sewa VPS Monitoring Utama AWS & Cloudflare CDN",
    amount: 1500000
  },
  {
    id: "EXP-03",
    date: "2026-03-25",
    type: "Expense",
    category: "Gaji Karyawan",
    description: "Sallary 2 Shift Network Engineers",
    amount: 6000000
  },
  {
    id: "INC-01",
    date: "2026-03-04",
    type: "Income",
    category: "Pendapatan Jasa NOC",
    invoiceId: "INV-2026-002",
    description: "Pembayaran Layanan NOC - IndoNet Solusindo",
    amount: 5500000
  },
  {
    id: "INC-02",
    date: "2026-03-05",
    type: "Income",
    category: "Pendapatan Jasa NOC",
    invoiceId: "INV-2026-001",
    description: "Pembayaran Layanan NOC - PT Citra Global ISP",
    amount: 12000000
  },

  // April 2026
  {
    id: "EXP-04",
    date: "2026-04-01",
    type: "Expense",
    category: "Lisensi Software Monitoring",
    description: "Lisensi PRTG Core Monitor & VM Pro",
    amount: 2200000
  },
  {
    id: "EXP-05",
    date: "2026-04-02",
    type: "Expense",
    category: "Sewa Server & Cloud",
    description: "Sewa VPS Monitoring Utama AWS & Cloudflare CDN",
    amount: 1500000
  },
  {
    id: "EXP-06",
    date: "2026-04-05",
    type: "Expense",
    category: "Internet & Listrik",
    description: "Pembayaran Internet Fiber Backup NOC & Listrik Kantor Utama",
    amount: 800000
  },
  {
    id: "EXP-07",
    date: "2026-04-25",
    type: "Expense",
    category: "Gaji Karyawan",
    description: "Sallary 2 Shift Network Engineers",
    amount: 6000000
  },
  {
    id: "INC-03",
    date: "2026-04-05",
    type: "Income",
    category: "Pendapatan Jasa NOC",
    invoiceId: "INV-2026-003",
    description: "Pembayaran Layanan NOC - PT Citra Global ISP",
    amount: 12000000
  },
  {
    id: "INC-04",
    date: "2026-04-06",
    type: "Income",
    category: "Pendapatan Jasa NOC",
    invoiceId: "INV-2026-004",
    description: "Pembayaran Layanan NOC - IndoNet Solusindo",
    amount: 5500000
  },
  {
    id: "INC-05",
    date: "2026-04-09",
    type: "Income",
    category: "Pendapatan Jasa NOC",
    invoiceId: "INV-2026-005",
    description: "Pembayaran Layanan NOC - Techno Sinergi Corp",
    amount: 3000000
  },

  // Mei 2026
  {
    id: "EXP-08",
    date: "2026-05-01",
    type: "Expense",
    category: "Lisensi Software Monitoring",
    description: "Lisensi PRTG Core Monitor & VM Pro (Upgraded nodes)",
    amount: 2500000
  },
  {
    id: "EXP-09",
    date: "2026-05-02",
    type: "Expense",
    category: "Sewa Server & Cloud",
    description: "Sewa VPS Monitoring Utama AWS & Cloudflare CDN",
    amount: 1700000
  },
  {
    id: "EXP-10",
    date: "2026-05-05",
    type: "Expense",
    category: "Internet & Listrik",
    description: "Pembayaran Internet Fiber Backup NOC & Listrik Kantor Utama",
    amount: 900000
  },
  {
    id: "EXP-11",
    date: "2026-05-25",
    type: "Expense",
    category: "Gaji Karyawan",
    description: "Sallary 2 Shift Network Engineers",
    amount: 6000000
  },
  {
    id: "EXP-12",
    date: "2026-05-28",
    type: "Expense",
    category: "Operasional Kantor",
    description: "Pembelian ATK dan snack ruangan NOC",
    amount: 400000
  },
  {
    id: "INC-06",
    date: "2026-05-05",
    type: "Income",
    category: "Pendapatan Jasa NOC",
    invoiceId: "INV-2026-006",
    description: "Pembayaran Layanan NOC - PT Citra Global ISP",
    amount: 12000000
  },
  {
    id: "INC-07",
    date: "2026-05-08",
    type: "Income",
    category: "Pendapatan Jasa NOC",
    invoiceId: "INV-2026-009",
    description: "Pembayaran Layanan NOC - Techno Sinergi Corp",
    amount: 3000000
  },
  {
    id: "INC-08",
    date: "2026-05-09",
    type: "Income",
    category: "Pendapatan Jasa NOC",
    invoiceId: "INV-2026-007",
    description: "Pembayaran Layanan NOC - IndoNet Solusindo",
    amount: 5500000
  }
];

// Initial Customizable Templates
export const INITIAL_TEMPLATES: NotificationTemplate[] = [
  {
    id: "tpl-wa-soon",
    name: "Pengingat Dekat Jatuh Tempo (WA)",
    channel: "whatsapp",
    triggerType: "due_soon",
    content: "Halo *{nama_klien}*,\n\nIni pengingat otomatis dari *Layanan Monitoring NOC*. Tagihan monitoring proaktif Anda dengan Kode *{no_invoice}* sebesar *Rp {jumlah_tagihan}* akan jatuh tempo pada *{jatuh_tempo}*.\n\nSangat penting untuk menjaga kestabilan SLA pemantauan infrastruktur Anda tanpa putus. Lakukan pelunasan instan cepat via QRIS atau Transfer Bank manual pada url berikut:\n🔗 {link_pembayaran}\n\nTerima kasih atas kerja samanya!\n- Billing Administration NOC"
  },
  {
    id: "tpl-wa-due",
    name: "Hari H Jatuh Tempo (WA)",
    channel: "whatsapp",
    triggerType: "on_due_date",
    content: "⚠️ *PEMBERITAHUAN JATUH TEMPO BILA JASA NOC - {no_invoice}* ⚠️\n\nHalo *{nama_klien}*,\n\nKami menginfokan bahwa tagihan internet/NOC monitoring Anda sebesar *Rp {jumlah_tagihan}* jatuh tempo *HARI INI* ({jatuh_tempo}). \n\nLakukan scan QRIS otomatis atau transfer VA Bank untuk mempercepat rekonsiliasi pembukuan di:\n👉 {link_pembayaran}\n\nJika telah melakukan pembayaran, sistem kami akan langsung melakukan sinkronisasi otomatis dalam 5 menit. Hubungi admin NOC jika butuh kendala."
  },
  {
    id: "tpl-wa-overdue",
    name: "Peringatan Menunggak Overdue (WA)",
    channel: "whatsapp",
    triggerType: "overdue",
    content: "🚨 *PERINGATAN LAYANAN TERANCAM DIKUNCI / OFF* 🚨\n\nYth. *{nama_klien}* ( {perusahaan_klien} ),\n\nTagihan Anda *{no_invoice}* sebesar *Rp {jumlah_tagihan}* dinyatakan *MENUNGGAK* melewati batas ({jatuh_tempo}).\n\nUntuk menghindari pemutusan dashboard pelaporan dan alert alarm proaktif NOC secara otomatis oleh sistem, mohon untuk segera menyelesaikan pembayaran di:\n👉 {link_pembayaran}\n\nKami mengapresiasi perhatian cepat Anda pada pesan otomatis ini."
  },
  {
    id: "tpl-email-new",
    name: "Pengiriman Invoice Baru (Email)",
    channel: "email",
    triggerType: "due_soon",
    subject: "Tagihan Layanan NOC Monitoring Baru - {no_invoice} - {perusahaan_klien}",
    content: "Kepada Yth,\nBapak/Ibu {nama_klien}\nPerwakilan {perusahaan_klien}\n\nDengan hormat,\n\nKami sampaikan bahwa kami telah menerbitkan tagihan baru untuk jasa monitoring infrastruktur NOC periode berjalan ({bulan_tagihan}), dengan rincian administrasi sebagai berikut:\n\n- Nomor Invoice: {no_invoice}\n- Jenis SLA Layanan: {layanan}\n- Nilai Tagihan: Rp {jumlah_tagihan}\n- Batas Jatuh Tempo: {jatuh_tempo}\n\nAnda dapat meninjau rincian biaya, mengunduh salinan resmi, serta melakukan pembayaran langsung melalui portal pembayaran digital terintegrasi (mendukung QRIS Statis & Virtual Bank Transfer dengan rekonsiliasi otomatis) di tautan berikut:\n{link_pembayaran}\n\nTerima kasih atas kepercayaan berkelanjutan yang Anda berikan pada layanan monitoring operasional kami.\n\nSalam hangat,\nFinance & Accounting Division\nSLA Monitoring NOC Network"
  },
  {
    id: "tpl-email-overdue",
    name: "Email Teguran Overdue Menunggak",
    channel: "email",
    triggerType: "overdue",
    subject: "[PERINGATAN JATUH TEMPO] Invoice Menunggak Layanan NOC - {no_invoice}",
    content: "Yth. Perwakilan {perusahaan_klien}\nBapak/Ibu {nama_klien},\n\nMelalui surat elektronik otomatis ini, Departemen Keuangan SLA NOC menginformasikan bahwa tagihan nomor {no_invoice} senilai Rp {jumlah_tagihan} saat ini berstatus TERLAMBAT BAYAR (Overdue).\n\nTagihan tersebut seharusnya diselesaikan paling lambat pada {jatuh_tempo}.\n\nKami sangat mengharapkan kerja sama Bapak/Ibu untuk segera menyelesaikan kewajiban ini agar operasional monitoring server, jaringan, maupun reporting berkala dashboard NOC Anda tetap berjalan responsif tanpa penyesuaian fungsional.\n\nLakukan pelunasan instan secara aman di:\n{link_pembayaran}\n\nJika pembayaran telah dilakukan, mohon hubungi admin chat kami atau lampirkan bukti transfer untuk validasi manual, atau tunggu proses sinkronisasi bank otomatis.\n\nTerima kasih,\nBilling Head Officer"
  }
];

// LocalStorage helpers
const KEY_CLIENTS = "noc_billing_clients";
const KEY_INVOICES = "noc_billing_invoices";
const KEY_BOOKKEEPING = "noc_billing_bookkeeping";
const KEY_TEMPLATES = "noc_billing_templates";
const KEY_SERVICE_CATEGORIES = "noc_billing_service_categories";

export const loadData = () => {
  let clientsStr = localStorage.getItem(KEY_CLIENTS);
  let invoicesStr = localStorage.getItem(KEY_INVOICES);
  let bookkeepingStr = localStorage.getItem(KEY_BOOKKEEPING);
  let templatesStr = localStorage.getItem(KEY_TEMPLATES);
  let svcStr = localStorage.getItem(KEY_SERVICE_CATEGORIES);

  let clients: Client[] = clientsStr ? JSON.parse(clientsStr) : INITIAL_CLIENTS;
  let invoices: Invoice[] = invoicesStr ? JSON.parse(invoicesStr) : INITIAL_INVOICES;
  let bookkeeping: BookkeepingRecord[] = bookkeepingStr ? JSON.parse(bookkeepingStr) : INITIAL_BOOKKEEPING;
  let templates: NotificationTemplate[] = templatesStr ? JSON.parse(templatesStr) : INITIAL_TEMPLATES;
  let serviceCategories: ServiceCategory[] = svcStr ? JSON.parse(svcStr) : INITIAL_SERVICE_CATEGORIES;

  // Ensure older clients have selectedServices mapped to prevent blank arrays
  clients = clients.map(client => {
    if (!client.selectedServices || client.selectedServices.length === 0) {
      // Find matching categories or fallback
      const match = serviceCategories.find(s => s.name === client.serviceType);
      return {
        ...client,
        selectedServices: match ? [match.id] : ["SVC-002"]
      };
    }
    return client;
  });

  return { clients, invoices, bookkeeping, templates, serviceCategories };
};

export const saveData = (data: {
  clients: Client[];
  invoices: Invoice[];
  bookkeeping: BookkeepingRecord[];
  templates: NotificationTemplate[];
  serviceCategories: ServiceCategory[];
}) => {
  localStorage.setItem(KEY_CLIENTS, JSON.stringify(data.clients));
  localStorage.setItem(KEY_INVOICES, JSON.stringify(data.invoices));
  localStorage.setItem(KEY_BOOKKEEPING, JSON.stringify(data.bookkeeping));
  localStorage.setItem(KEY_TEMPLATES, JSON.stringify(data.templates));
  localStorage.setItem(KEY_SERVICE_CATEGORIES, JSON.stringify(data.serviceCategories));
};
