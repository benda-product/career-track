'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Code2,
  FileQuestion,
  XCircle,
  Cpu,
  Layers,
  Database,
  Cloud,
  ClipboardCheck,
  Check,
  Star,
  Hourglass
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    return Cpu;
  }
  if (cat.includes('backend') || cat.includes('node') || cat.includes('python') || cat.includes('java') || cat.includes('c#') || cat.includes('go') || cat.includes('api')) {
    return Layers;
  }
  if (cat.includes('database') || cat.includes('sql') || cat.includes('mongo') || cat.includes('postgres')) {
    return Database;
  }
  if (cat.includes('cloud') || cat.includes('aws') || cat.includes('docker') || cat.includes('devops')) {
    return Cloud;
  }
  return ClipboardCheck;
}

function BreakdownRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof FileQuestion;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-3.5 py-2.5 hover:bg-muted/40 transition-colors">
      <Icon className="h-4.5 w-4.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
        <p className="text-xs font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function TestResultCard({ test }: { test: SkillTestHistoryItem }) {
  const [expanded, setExpanded] = useState(false);

  const hasMcq =
    test.numOfMcq != null && test.numOfMcq > 0 && test.rightMCQs != null;
  const hasCoding =
    test.numOfCoding != null && test.numOfCoding > 0 && test.rightCodings != null;
  const hasBreakdown = hasMcq || hasCoding || test.timeTaken;

  const isEligible = isCertificateEligible(test);
  const Icon = getCategoryIcon(test.category || '');

  // Status-colored border indicator
  const leftBorderColor = isEligible
    ? 'before:bg-amber-500' // Gold certificate
    : test.passed
      ? 'before:bg-primary' // Brand Green
      : 'before:bg-muted-foreground/30'; // Slate Gray

  const progressIndicatorClass = test.passed
    ? '[&_[data-slot=progress-indicator]]:bg-primary'
    : '[&_[data-slot=progress-indicator]]:bg-muted-foreground/45';

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-border/80 shadow-sm hover:shadow-md transition-all duration-200 pl-4 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1.5",
        leftBorderColor
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          
          {/* Main Info */}
          <div className="min-w-0 flex-1 space-y-3">
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

            <p className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
              <span>Marks: <strong className="text-foreground">{test.marksObtained}</strong>/{test.fullMarks}</span>
              <span>•</span>
              <span>Completed {formatDate(test.completedAt)}</span>
            </p>

            <div className="max-w-md space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                <span>Assessment score</span>
                <span className="font-bold text-foreground">{test.percentage}%</span>
              </div>
              <Progress value={test.percentage} className={cn("h-1.5", progressIndicatorClass)} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 flex-wrap gap-2 items-center">
            {hasBreakdown && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
                className="text-xs font-semibold h-9 border-border/80 text-foreground hover:bg-muted/30"
              >
                {expanded ? 'Hide details' : 'View details'}
                <ChevronDown
                  className={cn('ml-1.5 h-4 w-4 transition-transform text-muted-foreground', expanded && 'rotate-180')}
                />
              </Button>
            )}
            
            {isEligible ? (
              <LinkButton 
                href="/skill-check/certificates" 
                variant="outline" 
                size="sm" 
                className="text-xs font-bold border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-900 gap-1 h-9"
              >
                <Award className="h-4 w-4" />
                Certificate
              </LinkButton>
            ) : (
              <LinkButton
                href="/skill-check/take"
                variant="outline"
                size="sm"
                className="text-xs font-semibold h-9 border-border/80 text-foreground hover:bg-muted/30"
              >
                Retry
              </LinkButton>
            )}
          </div>
        </div>

        {/* Animated Expanding Details Drawer */}
        <AnimatePresence initial={false}>
          {expanded && hasBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-3 border-t border-border/40 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {hasMcq && (
                  <BreakdownRow
                    label="Multiple Choice (MCQ)"
                    value={`${test.rightMCQs}/${test.numOfMcq} correct answers`}
                    icon={FileQuestion}
                  />
                )}
                {hasCoding && (
                  <BreakdownRow
                    label="Coding Challenges"
                    value={`${test.rightCodings}/${test.numOfCoding} passed tasks`}
                    icon={Code2}
                  />
                )}
                {test.timeTaken && (
                  <BreakdownRow 
                    label="Assessment Duration" 
                    value={test.timeTaken} 
                    icon={Hourglass} 
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
