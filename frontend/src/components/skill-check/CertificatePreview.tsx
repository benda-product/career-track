'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkillcheckCertificateView } from '@/components/skill-check/SkillcheckCertificateView';
import type { SkillCertificateDetail } from '@/services/skillCheck.service';

export function CertificatePreview({ detail }: { detail: SkillCertificateDetail }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>
      <SkillcheckCertificateView
        data={{
          name: detail.name,
          course: detail.course,
          score: detail.score,
          certificateId: detail.certificateId,
          issuedDate: detail.issuedDate,
          level: detail.level,
          category: detail.category,
        }}
      />
    </div>
  );
}
