'use client';

import { useState } from 'react';
import { Award, Eye, Loader2, Copy, Check, ShieldCheck, Calendar, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CertificatePreview } from '@/components/skill-check/CertificatePreview';
import {
  formatCategory,
  formatDate,
  formatLevel,
} from '@/components/skill-check/test-result-utils';
import { skillCheckService, type SkillCertificateItem } from '@/services/skillCheck.service';
import { cn } from '@/lib/utils';

export function CertificateCard({ certificate }: { certificate: SkillCertificateItem }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [detail, setDetail] = useState<Awaited<
    ReturnType<typeof skillCheckService.getCertificateDetail>
  > | null>(null);

  const handleView = async () => {
    setOpen(true);
    if (detail) return;

    setLoading(true);
    setError('');
    try {
      const data = await skillCheckService.getCertificateDetail(certificate.bendaTestId);
      setDetail(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Failed to load certificate details'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (certificate.certificateId) {
      void navigator.clipboard.writeText(certificate.certificateId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card 
        className={cn(
          "relative overflow-hidden border-border/80 shadow-sm pl-4 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1.5 before:bg-gradient-to-b before:from-amber-400 before:to-amber-600 hover:shadow-md transition-shadow duration-200"
        )}
      >
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Title & info details */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Trophy className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-foreground text-sm tracking-tight sm:text-base">
                  {formatCategory(certificate.category)} Certificate
                </h3>
                <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-background border-border">
                  {formatLevel(certificate.level)}
                </Badge>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 text-[10px] font-bold uppercase tracking-wider rounded-md py-0.5 px-2">
                  Verified credential
                </Badge>
              </div>

              {/* Stats Block */}
              <div className="grid gap-3 sm:grid-cols-2 max-w-lg p-3 rounded-xl bg-muted/30 border border-border/40 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4 text-primary shrink-0" />
                  <span>Score: <strong className="text-foreground">{certificate.marksObtained}/{certificate.fullMarks} ({certificate.percentage}%)</strong></span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Issued: <strong className="text-foreground">{formatDate(certificate.completedAt)}</strong></span>
                </div>
              </div>

              {certificate.certificateId && (
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground bg-muted/40 p-2 rounded-lg w-fit border border-border/30">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Credential ID: <strong className="text-foreground select-all">{certificate.certificateId}</strong></span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="font-semibold text-xs border-border/80 text-foreground hover:bg-muted/30 gap-1.5 h-9" 
                onClick={() => void handleView()}
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                View certificate
              </Button>
              {certificate.certificateId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyId}
                  className="font-bold text-xs text-primary hover:text-primary/95 hover:bg-primary/5 gap-1.5 h-9"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-500" />
                      ID Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy ID
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 border-b pb-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Skill Certificate Viewer
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading verified certificate details...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : detail ? (
            <CertificatePreview detail={detail} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
