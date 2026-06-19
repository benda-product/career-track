'use client';

import {
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  Cpu,
  Layers,
  Database,
  Cloud,
  ClipboardCheck,
  Check,
  Calendar,
  Star,
  Hourglass,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LinkButton } from '@/components/ui/link-button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { SkillTestHistoryItem } from '@/services/skillCheck.service';
import { cn } from '@/lib/utils';
import {
  formatCategory,
  formatDate,
  formatLevel,
  isCertificateEligible,
  passBadgeClass,
} from '@/components/skill-check/test-result-utils';

function getCategoryIcon(category: string) {
  const cat = category.toLowerCase();
  if (cat.includes('react') || cat.includes('frontend') || cat.includes('javascript') || cat.includes('typescript') || cat.includes('html') || cat.includes('css')) {
    return Cpu; // Frontend / Client JS
  }
  if (cat.includes('backend') || cat.includes('node') || cat.includes('python') || cat.includes('java') || cat.includes('c#') || cat.includes('go') || cat.includes('api')) {
    return Layers; // Backend
  }
  if (cat.includes('database') || cat.includes('sql') || cat.includes('mongo') || cat.includes('postgres') || cat.includes('redis')) {
    return Database; // Database
  }
  if (cat.includes('cloud') || cat.includes('aws') || cat.includes('docker') || cat.includes('devops') || cat.includes('kubernetes') || cat.includes('ci')) {
    return Cloud; // DevOps / Infrastructure
  }
  return ClipboardCheck; // Default competency assessment
}

export function TestHistoryList({ tests }: { tests: SkillTestHistoryItem[] }) {
  if (!tests.length) {
    return (
      <Card className="border-border/60 shadow-sm bg-muted/20">
        <CardContent className="py-16 text-center max-w-md mx-auto space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No assessments found</h3>
            <p className="text-xs text-muted-foreground leading-normal">
              Take assessments on coding or tech specs to certify qualifications and track history.
            </p>
          </div>
          <LinkButton href="/skill-check/take" className="shadow-sm font-semibold inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
            Start First Test
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => {
        const Icon = getCategoryIcon(test.category || '');
        const isEligible = isCertificateEligible(test);
        
        // Define color classes depending on status
        const leftBorderColor = isEligible 
          ? 'before:bg-amber-500' // Golden certificate eligible
          : test.passed 
            ? 'before:bg-primary' // Brand Green
            : 'before:bg-muted-foreground/30'; // Grey failed

        const progressIndicatorClass = test.passed 
          ? '[&_[data-slot=progress-indicator]]:bg-primary'
          : '[&_[data-slot=progress-indicator]]:bg-muted-foreground/45';

        return (
          <Card 
            key={test.bendaTestId} 
            className={cn(
              "relative overflow-hidden border-border/80 shadow-sm hover:shadow-md transition-all duration-200 pl-4 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1.5",
              leftBorderColor
            )}
          >
            <CardContent className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                
                {/* Info and Progress Column */}
                <div className="min-w-0 flex-1 space-y-4">
                  {/* Headers */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="font-bold text-foreground text-sm tracking-tight sm:text-base">
                      {formatCategory(test.category)}
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider bg-background px-2 py-0.5 border-border">
                      {formatLevel(test.level)}
                    </Badge>
                    <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5', passBadgeClass(test.passed))}>
                      {test.passed ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <XCircle className="h-3 w-3 text-muted-foreground/80" />
                          Not passed
                        </span>
                      )}
                    </Badge>
                    
                    {isEligible && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 py-0.5 px-2 rounded-md">
                        <Star className="h-3 w-3 fill-white" />
                        Cert Eligible
                      </Badge>
                    )}
                  </div>

                  {/* Core Stats Row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-primary shrink-0" />
                      Score: <strong className="text-foreground">{test.marksObtained}</strong>/{test.fullMarks}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      Completed: <strong className="text-foreground">{formatDate(test.completedAt)}</strong>
                    </span>
                    {test.timeTaken && (
                      <span className="flex items-center gap-1.5">
                        <Hourglass className="h-4 w-4 text-muted-foreground shrink-0" />
                        Time Taken: <strong className="text-foreground">{test.timeTaken}</strong>
                      </span>
                    )}
                  </div>

                  {/* Detail Breakdown Stats (MCQs/Coding Correct Counters) */}
                  {(test.numOfMcq || test.numOfCoding) && (
                    <div className="flex flex-wrap gap-4 p-2.5 rounded-lg bg-muted/30 border border-border/40 w-fit text-[11px] text-muted-foreground font-semibold">
                      {test.numOfMcq != null && test.numOfMcq > 0 && (
                        <span>
                          MCQs: <strong className="text-foreground">{test.rightMCQs || 0}</strong>/{test.numOfMcq} correct
                        </span>
                      )}
                      {test.numOfCoding != null && test.numOfCoding > 0 && (
                        <span>
                          Coding Tasks: <strong className="text-foreground">{test.rightCodings || 0}</strong>/{test.numOfCoding} correct
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress Line */}
                  <div className="max-w-md space-y-1.5">
                    <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                      <span>Assessment Performance</span>
                      <span className="font-bold text-foreground">{test.percentage}%</span>
                    </div>
                    <Progress value={test.percentage} className={cn("h-2", progressIndicatorClass)} />
                  </div>
                </div>

                {/* Actions Column */}
                {isEligible ? (
                  <LinkButton
                    href="/skill-check/certificates"
                    variant="outline"
                    size="sm"
                    className="shrink-0 font-bold border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-900 gap-1.5 h-10 w-full lg:w-auto"
                  >
                    <Award className="h-4.5 w-4.5" />
                    View Certificate
                  </LinkButton>
                ) : (
                  <LinkButton
                    href="/skill-check/take"
                    variant="outline"
                    size="sm"
                    className="shrink-0 font-bold border-border/80 text-foreground hover:bg-muted/30 gap-1.5 h-10 w-full lg:w-auto"
                  >
                    Retry Assessment
                  </LinkButton>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
