export type InvoicePdfCustomer = {
  name: string;
  email: string;
};

export type InvoicePdfLine = {
  invoiceNumber: string;
  description: string;
  planLabel: string;
  billingCycle: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paidAt: Date;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function escapePdfText(value: string) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildSimplePdf(lines: string[]): Buffer {
  const contentLines = ['BT', '/F1 11 Tf', '50 780 Td', '14 TL'];
  lines.forEach((line, index) => {
    const text = escapePdfText(line);
    if (index === 0) contentLines.push(`(${text}) Tj`);
    else contentLines.push(`T* (${text}) Tj`);
  });
  contentLines.push('ET');

  const stream = contentLines.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

export function generateInvoicePdf(
  productName: string,
  customer: InvoicePdfCustomer,
  invoice: InvoicePdfLine,
): Promise<Buffer> {
  const paymentMethod = invoice.paymentMethod === 'paypal' ? 'PayPal' : 'Demo billing';
  const lines = [
    'Benda',
    productName,
    '',
    'INVOICE',
    `Invoice #: ${invoice.invoiceNumber}`,
    `Date: ${formatDate(invoice.paidAt)}`,
    `Status: ${invoice.status.toUpperCase()}`,
    '',
    'Bill to',
    customer.name,
    customer.email,
    '',
    'Description',
    invoice.description,
    `Plan: ${invoice.planLabel} (${invoice.billingCycle})`,
    `Amount: ${formatMoney(invoice.amount, invoice.currency)}`,
    '',
    `Total paid: ${formatMoney(invoice.amount, invoice.currency)}`,
    `Payment method: ${paymentMethod}`,
    '',
    'Thank you for your subscription.',
  ];

  return Promise.resolve(buildSimplePdf(lines));
}
