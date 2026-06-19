'use client';

import { useState } from 'react';
import { CheckCircle2, Search, XCircle, ShieldCheck, Printer, Copy, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { skillCheckService } from '@/services/skillCheck.service';
import { formatCategory, formatLevel } from '@/components/skill-check/test-result-utils';

export function CertificateVerifyPanel() {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof skillCheckService.verifyCertificate>
  > | null>(null);

  const handleVerify = async () => {
    const id = certificateId.trim();
    if (!id) {
      setError('Please enter a certificate ID.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await skillCheckService.verifyCertificate(id);
      setResult(data);
      if (!data.valid) {
        setError(data.message || 'Certificate not found. Double-check ID format.');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to verify certificate'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (result?.certificate?.certificateId) {
      const url = `${window.location.origin}/skill-check/certificates/verify?id=${encodeURIComponent(result.certificate.certificateId)}`;
      void navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden bg-muted/15">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/30">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          Verify Assessment Authenticity
        </CardTitle>
        <CardDescription className="text-xs">Authenticate any CareerTrack skill certificate by inputting its unique ID token</CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-normal">
            Input the alphanumeric ID found at the bottom-right of the printed certificate (e.g. `CERT-YYYYMMDD-XXXX`).
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row max-w-lg">
            <Input
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="CERT-20260619-A39D"
              className="h-10 border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleVerify();
              }}
            />
            <Button 
              onClick={() => void handleVerify()} 
              disabled={loading}
              className="h-10 px-5 font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              {loading ? 'Validating...' : 'Verify Token'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-xs text-rose-800 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-400 max-w-lg">
            <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {result?.valid && result.certificate && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/10 p-5 space-y-4 max-w-xl shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-500/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                <span>OFFICIAL CREDENTIAL VERIFIED</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 text-[10px] font-bold text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100/50 dark:text-emerald-400 gap-1.5 px-2.5 rounded-lg border border-emerald-500/10"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Link Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Verification URL
                  </>
                )}
              </Button>
            </div>
            
            <dl className="grid gap-x-4 gap-y-3.5 sm:grid-cols-2 text-xs">
              <div>
                <dt className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider">Candidate Name</dt>
                <dd className="font-extrabold text-foreground mt-0.5">{result.certificate.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider">Assessment Course</dt>
                <dd className="font-bold text-foreground mt-0.5">{result.certificate.course}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider">Verified Competency</dt>
                <dd className="font-semibold text-foreground mt-0.5">{formatCategory(result.certificate.category)}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider">Difficulty Level</dt>
                <dd className="font-semibold text-foreground mt-0.5">{formatLevel(result.certificate.level)}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider">Performance Score</dt>
                <dd className="font-extrabold text-foreground mt-0.5">{result.certificate.score}% Score</dd>
              </div>
              <div>
                <dt className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 font-bold uppercase tracking-wider">Issued On</dt>
                <dd className="font-semibold text-foreground mt-0.5">{result.certificate.issuedDate || '—'}</dd>
              </div>
            </dl>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-800/85 dark:text-emerald-400/85 font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Cryptographically secured and authenticated by Benda CareerTrack Assessment Engine.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
