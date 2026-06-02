export type ServiceType = 
  | "NOC Basic 8x5" 
  | "NOC Standard 24x7" 
  | "NOC Enterprise High-Availability" 
  | "SLA Gold Monitoring 24x7"
  | "VPN IPSec Tunneling & Firewall"
  | "SD-WAN Dedicated Monitoring"
  | "Monitoring Node SNMP & Ping"
  | "NOC & Cloud Managed Service";

export interface ServiceCategory {
  id: string;
  name: string;
  basePrice: number;
  type: "Fixed" | "Mikrotik_Dynamic";
  billingType: "fixed" | "per_pppoe_active" | "per_hotspot_active" | "per_pppoe_secret";
  description: string;
  icon?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
  nocNotes?: string;
  communicationPreference?: "whatsapp" | "email";
  serviceType: ServiceType; // Kept for backward compatibility
  monthlyFee: number;
  status: "Active" | "Inactive";
  createdAt: string;
  // Multi-service support
  selectedServices?: string[]; // Array of ServiceCategory IDs
  // Mikrotik Integration parameters
  mikrotikIp?: string;
  mikrotikPort?: number;
  mikrotikUser?: string;
  mikrotikPassword?: string;
  mtActivePppoeCount?: number;
  mtActiveHotspotCount?: number;
  mtPppoeSecretCount?: number;
  mtRouterModel?: string;
  mtUptime?: string;
  mtLastSync?: string;
  // Dynamic pricing custom overrides
  customPricePerPppoe?: number;
  customPricePerHotspot?: number;
  customPricePerSecret?: number;
  customPppoeCount?: number;
  customHotspotCount?: number;
  customSecretCount?: number;
  useManualMikrotikCounts?: boolean; // If true, manually override mikrotik counts, otherwise simulated / fetched counts are used
}

export type InvoiceStatus = "Paid" | "Unpaid" | "Overdue" | "Draft";

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  amount: number;
  billingMonth: string; // e.g. "2026-05" (Mei 2026)
  issuedDate: string;  // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
  status: InvoiceStatus;
  reminderSentCount: number;
  paymentMethod: "QRIS" | "Bank Transfer" | "Manual" | "";
  paymentDate: string | null;
  bankAccountDetails?: string; // Information about transfer
  qrisPayload?: string;        // Text representation of QRIS code
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: "whatsapp" | "email";
  triggerType: "due_soon" | "on_due_date" | "overdue";
  subject?: string; // For Email only
  content: string;  // Dynamic text containing {nama_klien}, {no_invoice}, {jumlah_tagihan}, {jatuh_tempo}, {link_pembayaran}
}

export interface BookkeepingRecord {
  id: string;
  date: string;       // YYYY-MM-DD
  type: "Income" | "Expense";
  category: "Pendapatan Jasa NOC" | "Lisensi Software Monitoring" | "Sewa Server & Cloud" | "Gaji Karyawan" | "Operasional Kantor" | "Internet & Listrik";
  invoiceId?: string; // linked if income and generated automatically
  description: string;
  amount: number;
}

export interface WhatsAppConnection {
  isConnected: boolean;
  phoneNumber?: string;
  qrcodeUrl?: string; // Mock QR Code scanning
  scanProgress: "none" | "rendering" | "ready" | "connecting" | "connected";
}

// Monthly profit and loss report structures
export interface ProfitLossReport {
  month: string; // YYYY-MM
  monthName: string; // Indonesian Month
  revenue: number;
  expenses: number;
  netProfit: number;
}

export interface CustomPaymentMethod {
  id: string;
  name: string; // e.g. "Bank Mandiri VA"
  accountNumber: string; // e.g. "8899120000002"
  accountHolder: string; // e.g. "PT NOC NET NUSANTARA"
  active: boolean;
}

export interface BizProfile {
  companyName: string;
  billingName: string;
  logoUrl: string; // Base64 data-URL or normal Link
  email: string;
  phone: string;
  address: string;
  footerText: string;
  qrisMerchantName: string;
  
  // Custom PDF Template Settings
  pdfTitle?: string; // default "INVOICE"
  pdfSubTitle?: string; // default "SLA PROACTIVE SERVICES"
  pdfColorPrimary?: string; // default "#0d9488"
  pdfColorSecondary?: string; // default "#475569"
  pdfCustomNote?: string; // default "Pesan ini digenerate secara otomatis..."
  
  // Custom Payment Methods & static QRIS
  customPaymentMethods?: CustomPaymentMethod[];
  staticQrisUrl?: string; // Base64 static QRIS image or link
  staticQrisPayload?: string; // QRIS text code
}

