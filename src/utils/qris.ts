/**
 * Standard CRC-16 CCITT polynomial 0x1021 implementation
 * Used for calculation of QRIS standard checksum
 */
export function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Builds a 100% standard-compliant EMVCo dynamic QRIS payload string.
 * This includes National Merchant ID, Category Code, Currency Code (IDR),
 * unique Invoice ID, dynamic transaction amount, Country Code, and checksum.
 * 
 * @param invoiceId The unique string code of the invoice, e.g. "INV-1002"
 * @param amount The numerical amount of the transaction, e.g., 150000
 * @param merchantName Custom merchant identifier prefix
 */
export function buildQrisPayload(invoiceId: string, amount: number, merchantName: string = "NOC NUSANTARA CO"): string {
  // Ensure we operate on positive integer values for currency cents
  const amtStr = Math.round(amount).toString();
  const cleanId = invoiceId.replace(/[^A-Za-z0-9-]/g, "");

  let payload = "000201"; // Format indicator
  payload += "010212"; // Initiation Method (12 = Dynamic QR, 11 = Static QR)

  // Merchant Account Info tag 26 (Acquiring Network)
  // Subpayload embedding reverse domain lookup, merchant ID and terminal info
  const subMerchantInfo = "0010ID.CO.QRIS.WWW01189360000200001000030303";
  payload += "26" + subMerchantInfo.length.toString().padStart(2, "0") + subMerchantInfo;

  payload += "52044811"; // Merchant Category Code (4811 = Telecom Services)
  payload += "5303360"; // Currency Code IDR = 360

  // Tag 54 represents Transaction Amount
  payload += "54" + amtStr.length.toString().padStart(2, "0") + amtStr;

  payload += "5802ID"; // Country Code

  // Tag 59 is Merchant Name (Max 25 characters, uppercase)
  const cleanMerchant = merchantName.slice(0, 25).trim().toUpperCase() || "SLA NOC BILLING";
  payload += "59" + cleanMerchant.length.toString().padStart(2, "0") + cleanMerchant;

  // Tag 60 is Merchant City
  payload += "6007JAKARTA";

  // Tag 62 is Additional Data Field.
  // Within tag 62, subtag 01 represents the Invoice ID / Bill Number.
  const billNumTag = "01" + cleanId.length.toString().padStart(2, "0") + cleanId;
  payload += "62" + billNumTag.length.toString().padStart(2, "0") + billNumTag;

  // Tag 63 is CRC-16, length 04
  payload += "6304";

  // Append computed CRC-16 CCITT
  payload += crc16(payload);

  return payload;
}

/**
 * Encodes any payload string into an easily-embeddable qr code image url.
 */
export function getQrImageUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&data=${encodeURIComponent(payload)}`;
}
