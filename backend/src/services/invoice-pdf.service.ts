// @ts-nocheck
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

function logoFile(name) {
  const candidates = [
    path.join(__dirname, "../assets/logos", name),
    path.join(__dirname, "../../src/assets/logos", name),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

/**
 * Shared invoice layout from the Talent demo invoice.
 * Per product, change only the logo, product name, legal name, LLP/LLC, and tax lines.
 */
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 36;

const COLOR = {
  header: "#E7F3FC",
  ink: "#101828",
  muted: "#667085",
  label: "#98A2B3",
  blue: "#0C71D7",
  paid: "#067647",
  panel: "#F4F7FB",
  table: "#F3F6FB",
  alt: "#F8FAFC",
  total: "#101828",
  terms: "#E8F4FC",
  white: "#FFFFFF",
};

export const INVOICE_ISSUER = {
  legalName: "Benda Infotech LLP",
  address: [
    "Martin Burn I Space, 315 DH Block,",
    "Action Area I, Kolkata - 700156,",
    "West Bengal, India",
  ],
  taxLines: ["LLPIN: ACG-2039", "GSTIN: 19ABCFB7483P1ZO"],
  contact: "billing@bendainfotech.com | 888 401-8906",
};

export const INVOICE_PRODUCT = {
  name: "Career Track by Benda Infotech",
  short: "Career Track",
  logoPath: logoFile("career-track.png"),
};

function pdfBuffer(doc) {
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function formatMoney(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(Number(amount) || 0);
}

function formatShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMonthYear(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function formatCycle(cycle) {
  if (cycle === "annual" || cycle === "yearly") return "Annual";
  if (cycle === "monthly") return "Monthly";
  if (!cycle || cycle === "one-time") return "One-time";
  return String(cycle).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function billingPeriod(value, cycle) {
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "—";
  const year = start.getUTCFullYear();
  const monthIndex = start.getUTCMonth();
  const day = start.getUTCDate();
  if (cycle === "annual" || cycle === "yearly") {
    const end = new Date(Date.UTC(year + 1, monthIndex, day));
    end.setUTCDate(end.getUTCDate() - 1);
    return `${formatShortDate(start)} - ${formatShortDate(end)}`;
  }
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const month = first.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${String(first.getUTCDate()).padStart(2, "0")} - ${String(last.getUTCDate()).padStart(2, "0")} ${month}`;
}

function addDays(value, days) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date();
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function statusLabel(status) {
  const value = String(status || "paid").toLowerCase();
  if (value === "paid") return "PAID";
  if (value === "refunded") return "REFUNDED";
  if (value === "failed") return "FAILED";
  return "UNPAID";
}

function isSettled(status) {
  return String(status || "paid").toLowerCase() === "paid";
}

function shortProductName(name, fallback) {
  const cleaned = String(name || "")
    .replace(/\s+by Benda Infotech$/i, "")
    .trim();
  return cleaned || fallback;
}

function drawLabel(doc, text, x, y, width) {
  doc.fillColor(COLOR.label).font("Helvetica").fontSize(8).text(text, x, y, {
    width,
    characterSpacing: 0.6,
    lineBreak: false,
  });
}

function drawBendaMark(doc, x, y) {
  const logoPath = logoFile("benda-hub.png");
  if (!logoPath || !fs.existsSync(logoPath)) return;
  doc.image(logoPath, x, y - 6, {
    fit: [156, 44],
    align: "left",
    valign: "center",
  });
}

function drawProductMark(doc, right, y, _shortName, logoPath) {
  if (!logoPath || !fs.existsSync(logoPath)) return;
  const maxWidth = 168;
  const maxHeight = 46;
  doc.image(logoPath, right - maxWidth, y - 6, {
    fit: [maxWidth, maxHeight],
    align: "right",
    valign: "center",
  });
}

function billToLines(customer) {
  const lines = [];
  const legal = customer.companyName || customer.name || "Customer";
  lines.push(legal);
  if (customer.companyName && customer.name && customer.name !== customer.companyName) {
    lines.push(customer.name);
  }
  const address = [customer.address, customer.street, customer.location].filter(Boolean).join("\n");
  if (address) {
    address.split(/\n+/).forEach((line) => {
      if (line.trim()) lines.push(line.trim());
    });
  }
  if (customer.email) lines.push(customer.email);
  return lines.slice(0, 5);
}

function lineItems(productShort, invoice) {
  const currency = invoice.currency || "USD";
  const amount = Number(invoice.amount) || 0;
  const quantity = Number(invoice.quantity) > 0 ? Number(invoice.quantity) : 1;
  const unit = invoice.unitPrice != null ? Number(invoice.unitPrice) : amount / quantity;
  const plan = invoice.planLabel || "Subscription";
  const cycle = formatCycle(invoice.billingCycle);
  const supplied = Array.isArray(invoice.lines) ? invoice.lines : null;
  const items = supplied || [
    {
      title: ["monthly", "annual", "yearly"].includes(invoice.billingCycle)
        ? `${productShort} - ${plan} subscription`
        : `${productShort} - ${plan}`,
      detail: invoice.description && !String(invoice.description).includes(plan)
        ? invoice.description
        : `${cycle} billing`,
      quantity,
      unitPrice: unit,
      amount,
    },
  ];

  if (!supplied && (invoice.billingCycle === "monthly" || invoice.billingCycle === "annual")) {
    items.push({
      title: "Workspace setup",
      detail: "Included with subscription",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    });
  }

  return items.map((item) => ({
    title: item.title || item.description || "Subscription",
    detail: item.detail || "",
    quantity: item.quantity ?? 1,
    unitPrice: formatMoney(item.unitPrice ?? item.amount ?? 0, currency),
    amount: formatMoney(item.amount ?? 0, currency),
  }));
}

function resolveCustomerId(customer: { customerId?: string; id?: string; _id?: unknown }) {
  const raw = customer?.customerId || customer?.id || customer?._id || "";
  return String(raw).trim();
}

export function generateInvoicePdf(productName, customer = {}, invoice = {}, brand = {}) {
  const issuer = { ...INVOICE_ISSUER, ...(brand.issuer || {}) };
  const productFull = productName || brand.name || INVOICE_PRODUCT.name;
  const productShort = brand.short || shortProductName(productFull, INVOICE_PRODUCT.short);
  const logoPath = brand.logoPath || INVOICE_PRODUCT.logoPath;
  const issuedAt = invoice.paidAt || invoice.issuedAt || new Date();
  const dueAt = invoice.dueAt || addDays(issuedAt, 7);
  const settled = isSettled(invoice.status);
  const currency = invoice.currency || "USD";
  const amount = formatMoney(invoice.amount, currency);
  const tax = formatMoney(invoice.taxAmount || 0, currency);
  const totalValue = Number(invoice.amount || 0) + Number(invoice.taxAmount || 0);
  const total = formatMoney(totalValue, currency);
  const balance = formatMoney(settled ? 0 : totalValue, currency);
  const items = lineItems(productShort, invoice);
  const customerLines = billToLines(customer);
  const customerId = resolveCustomerId(customer);

  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const completed = pdfBuffer(doc);
  const right = PAGE_W - M;

  doc.rect(0, 0, PAGE_W, 214).fill(COLOR.header);
  drawBendaMark(doc, M, 32);
  drawProductMark(doc, right, 28, productShort, logoPath);

  doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(26).text("INVOICE", M, 92, { lineBreak: false });
  const subscription = ["monthly", "annual", "yearly"].includes(String(invoice.billingCycle || ""));
  doc.fillColor(COLOR.muted).font("Helvetica").fontSize(11).text(
    subscription
      ? `${productShort} subscription | ${formatMonthYear(issuedAt)}`
      : `${productShort} | ${formatMonthYear(issuedAt)}`,
    M,
    124,
    { lineBreak: false }
  );

  const badge = statusLabel(invoice.status);
  doc.font("Helvetica-Bold").fontSize(10);
  const badgeWidth = doc.widthOfString(badge) + 36;
  const badgeX = right - badgeWidth;
  const badgeFill = settled ? COLOR.paid : badge === "FAILED" || badge === "REFUNDED" ? "#B42318" : COLOR.blue;
  doc.roundedRect(badgeX, 96, badgeWidth, 28, 14).fill(badgeFill);
  doc.fillColor(COLOR.white).text(badge, badgeX, 105, {
    width: badgeWidth,
    align: "center",
    lineBreak: false,
  });

  doc.roundedRect(M, 156, PAGE_W - M * 2, 198, 16).fill(COLOR.white);
  doc.roundedRect(M + 14, 170, 168, 170, 12).fill(COLOR.panel);

  drawLabel(doc, "BILL TO", M + 28, 184, 140);
  customerLines.forEach((line, index) => {
    doc
      .fillColor(index === 0 ? COLOR.ink : COLOR.muted)
      .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(index === 0 ? 11 : 9)
      .text(line, M + 28, 202 + index * 16, { width: 140, lineBreak: false });
  });
  if (customerId) {
    doc.fillColor(COLOR.muted).font("Helvetica").fontSize(8).text("Customer ID", M + 28, 290, {
      width: 140,
      lineBreak: false,
    });
    doc.fillColor(COLOR.ink).font("Helvetica").fontSize(8).text(customerId, M + 28, 302, {
      width: 140,
    });
  }

  const metaLeft = 248;
  const metaRight = 400;
  const metaColWidth = 140;
  const meta = [
    ["INVOICE NUMBER", invoice.invoiceNumber || "—", metaLeft],
    ["INVOICE DATE", formatShortDate(issuedAt), metaRight],
    ["BILLING PERIOD", billingPeriod(issuedAt, invoice.billingCycle), metaLeft],
    ["DUE DATE", formatShortDate(dueAt), metaRight],
    ["PLAN / BILLING", `${invoice.planLabel || "—"} / ${formatCycle(invoice.billingCycle)}`, metaLeft],
    ["CURRENCY", currency, metaRight],
  ];
  meta.forEach(([label, value, x], index) => {
    const y = 176 + Math.floor(index / 2) * 52;
    drawLabel(doc, label, x, y, metaColWidth);
    doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(11).text(value, x, y + 16, {
      width: metaColWidth,
      lineBreak: false,
    });
  });

  doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(16).text("Invoice details", M, 372, {
    lineBreak: false,
  });

  const tableX = M;
  const tableW = PAGE_W - M * 2;
  const cols = [
    { label: "DESCRIPTION", x: tableX + 16, width: 250 },
    { label: "QTY", x: tableX + 270, width: 50, align: "right" },
    { label: "UNIT PRICE", x: tableX + 330, width: 80, align: "right" },
    { label: "AMOUNT", x: tableX + 420, width: tableW - 436, align: "right" },
  ];
  doc.roundedRect(tableX, 400, tableW, 32, 10).fill(COLOR.table);
  cols.forEach((column) => {
    doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(8).text(column.label, column.x, 412, {
      width: column.width,
      align: column.align || "left",
      characterSpacing: 0.4,
      lineBreak: false,
    });
  });

  let rowY = 444;
  items.forEach((item, index) => {
    doc.font("Helvetica-Bold").fontSize(11);
    const titleHeight = doc.heightOfString(item.title, { width: cols[0].width });
    const detailHeight = item.detail
      ? doc.font("Helvetica").fontSize(8.5).heightOfString(item.detail, { width: cols[0].width })
      : 0;
    const rowHeight = Math.max(40, titleHeight + (item.detail ? detailHeight + 4 : 0) + 14);

    if (index % 2 === 1) {
      doc.rect(tableX, rowY - 8, tableW, rowHeight).fill(COLOR.alt);
    }
    doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(11).text(item.title, cols[0].x, rowY, {
      width: cols[0].width,
    });
    if (item.detail) {
      doc.fillColor(COLOR.muted).font("Helvetica").fontSize(8.5).text(item.detail, cols[0].x, rowY + titleHeight + 2, {
        width: cols[0].width,
      });
    }
    doc.fillColor(COLOR.ink).font("Helvetica").fontSize(11);
    doc.text(String(item.quantity), cols[1].x, rowY, { width: cols[1].width, align: "right", lineBreak: false });
    doc.text(item.unitPrice, cols[2].x, rowY, { width: cols[2].width, align: "right", lineBreak: false });
    doc.text(item.amount, cols[3].x, rowY, { width: cols[3].width, align: "right", lineBreak: false });
    rowY += rowHeight;
  });

  const issuedY = rowY + 8;
  drawLabel(doc, "ISSUED BY", M, issuedY, 220);
  doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(12).text(issuer.legalName, M, issuedY + 16, {
    width: 250,
    lineBreak: false,
  });
  let issuerLineY = issuedY + 34;
  issuer.address.forEach((line) => {
    doc.fillColor(COLOR.muted).font("Helvetica").fontSize(9).text(line, M, issuerLineY, {
      width: 250,
      lineBreak: false,
    });
    issuerLineY += 12;
  });
  issuerLineY += 6;
  issuer.taxLines.forEach((line) => {
    doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(9).text(line, M, issuerLineY, {
      width: 250,
      lineBreak: false,
    });
    issuerLineY += 14;
  });
  doc.fillColor(COLOR.muted).font("Helvetica").fontSize(9).text(issuer.contact, M, issuerLineY, {
    width: 260,
    lineBreak: false,
  });
  doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(9).text(`Product: ${productFull}`, M, issuerLineY + 16, {
    width: 260,
    lineBreak: false,
  });

  const totalsX = 330;
  const totalsW = right - totalsX;
  let totalsY = issuedY;
  [
    ["Subtotal", amount],
    ["Tax", tax],
  ].forEach(([label, value]) => {
    doc.fillColor(COLOR.muted).font("Helvetica").fontSize(10).text(label, totalsX, totalsY, {
      width: 90,
      lineBreak: false,
    });
    doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(11).text(value, totalsX, totalsY, {
      width: totalsW,
      align: "right",
      lineBreak: false,
    });
    totalsY += 22;
  });

  doc.roundedRect(totalsX, totalsY, totalsW, 36, 8).fill(COLOR.total);
  doc.fillColor(COLOR.white).font("Helvetica-Bold").fontSize(12).text("TOTAL", totalsX + 14, totalsY + 12, {
    width: 80,
    lineBreak: false,
  });
  doc.text(total, totalsX, totalsY + 12, {
    width: totalsW - 14,
    align: "right",
    lineBreak: false,
  });
  totalsY += 48;
  doc.fillColor(COLOR.muted).font("Helvetica").fontSize(10).text("Balance due", totalsX, totalsY, {
    width: 90,
    lineBreak: false,
  });
  doc.fillColor(COLOR.ink).font("Helvetica-Bold").fontSize(11).text(balance, totalsX, totalsY, {
    width: totalsW,
    align: "right",
    lineBreak: false,
  });

  const termsY = Math.max(issuerLineY + 48, totalsY + 36);
  doc.roundedRect(M, termsY, PAGE_W - M * 2, 52, 10).fill(COLOR.terms);
  doc.fillColor(COLOR.blue).font("Helvetica-Bold").fontSize(8).text("PAYMENT TERMS", M + 16, termsY + 10, {
    characterSpacing: 0.5,
    lineBreak: false,
  });
  doc.fillColor(COLOR.muted).font("Helvetica").fontSize(9).text(
    `Payment due by ${formatShortDate(dueAt)}. Use your invoice number as the payment reference.`,
    M + 16,
    termsY + 26,
    { width: PAGE_W - M * 2 - 32, lineBreak: false }
  );

  const footerY = PAGE_H - 36;
  doc.rect(0, footerY, PAGE_W, 36).fill(COLOR.total);
  doc.fillColor(COLOR.white).font("Helvetica-Bold").fontSize(8).text(
    `BENDA INFOTECH  /  ${productShort.toUpperCase()}`,
    M,
    footerY + 14,
    { characterSpacing: 0.4, lineBreak: false }
  );
  doc.font("Helvetica").fontSize(8).text("Invoice  |  1 of 1", M, footerY + 14, {
    width: PAGE_W - M * 2,
    align: "right",
    lineBreak: false,
  });

  doc.end();
  return completed;
}
