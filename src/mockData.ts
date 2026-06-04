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
export const INITIAL_CLIENTS: Client[] = [];

// Initial Invoices spanning March, April, May, and June 2026
export const INITIAL_INVOICES: Invoice[] = [];

// Initial Bookkeeping (Log Kas)
export const INITIAL_BOOKKEEPING: BookkeepingRecord[] = [];

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

  let clients: Client[] = clientsStr ? JSON.parse(clientsStr) : [];
  let invoices: Invoice[] = invoicesStr ? JSON.parse(invoicesStr) : [];
  let bookkeeping: BookkeepingRecord[] = bookkeepingStr ? JSON.parse(bookkeepingStr) : [];
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
