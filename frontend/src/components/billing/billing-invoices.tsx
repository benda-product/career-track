'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { billingService } from '@/services/billing.service';

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BillingInvoices({ refreshKey = 0 }: { refreshKey?: number }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['billing-invoices', refreshKey],
    queryFn: () => billingService.listInvoices(),
  });

  async function handleDownload(invoiceId: string, invoiceNumber: string) {
    setDownloadingId(invoiceId);
    try {
      await billingService.downloadInvoicePdf(invoiceId, invoiceNumber);
    } catch {
      window.alert('Unable to download invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Billing history</CardTitle>
        </div>
        <CardDescription>Invoices for your Career Track subscription payments.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !invoices?.length ? (
          <p className="text-sm text-muted-foreground">
            No invoices yet. Payment receipts appear here after a paid plan is activated.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Invoice</th>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(invoice.paidAt)}</td>
                    <td className="py-3 pr-4 text-slate-600">{invoice.description}</td>
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {formatMoney(invoice.amount, invoice.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={invoice.status === 'paid' ? 'secondary' : 'outline'}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={downloadingId === invoice.id}
                        onClick={() => void handleDownload(invoice.id, invoice.invoiceNumber)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        {downloadingId === invoice.id ? 'Downloading…' : 'Download'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
