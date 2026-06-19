'use client';

import {
  TrendingUp,
  Cpu,
  Layers,
  Database,
  Cloud,
  ClipboardCheck,
  BadgeCheck,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { SkillTestHistoryItem } from '@/services/skillCheck.service';
import { formatCategory } from '@/components/skill-check/test-result-utils';
import { cn } from '@/lib/utils';

type SkillSummary = {
  category: string;
  bestPercentage: number;
  attempts: number;
  passed: boolean;
  latestLevel: string;
};

function buildSkillSummaries(tests: SkillTestHistoryItem[]): SkillSummary[] {
  const byCategory = new Map<string, SkillTestHistoryItem[]>();

  for (const test of tests) {
    const key = test.category || 'unknown';
    const existing = byCategory.get(key) || [];
    existing.push(test);
    byCategory.set(key, existing);
  }

  return Array.from(byCategory.entries())
    .map(([category, rows]) => {
      const best = rows.reduce((top, row) =>
        row.percentage > top.percentage ? row : top
      );
      return {
        category,
        bestPercentage: best.percentage,
        attempts: rows.length,
        passed: rows.some((row) => row.passed),
        latestLevel: rows[0]?.level || '',
      };
    })
    .sort((a, b) => b.bestPercentage - a.bestPercentage);
}

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

export function SkillPerformanceSummary({ tests }: { tests: SkillTestHistoryItem[] }) {
  const summaries = buildSkillSummaries(tests);

  if (!summaries.length) return null;

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
          <TrendingUp className="h-4.5 w-4.5 text-primary" />
          Performance by Skill Category
        </CardTitle>
        <CardDescription className="text-xs">Your peak proficiency ratings and verification status per skill area</CardDescription>
      </CardHeader>
      <CardContent className="p-5 grid gap-4 sm:grid-cols-2">
        {summaries.map((skill) => {
          const Icon = getCategoryIcon(skill.category);
          const progressClass = skill.passed
            ? '[&_[data-slot=progress-indicator]]:bg-primary'
            : '[&_[data-slot=progress-indicator]]:bg-muted-foreground/45';
          
          return (
            <div key={skill.category} className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-3 hover:shadow-sm transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{formatCategory(skill.category)}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                      <span>{skill.attempts} Attempt{skill.attempts === 1 ? '' : 's'}</span>
                      {skill.passed && (
                        <>
                          <span>•</span>
                          <span className="text-primary flex items-center gap-0.5 font-bold">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-foreground">{skill.bestPercentage}%</span>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Top Score</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <Progress value={skill.bestPercentage} className={cn("h-1.5", progressClass)} />
                <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                  <span>Level: {skill.latestLevel.toUpperCase()}</span>
                  <span>{skill.bestPercentage >= 80 ? 'Expert' : skill.bestPercentage >= 60 ? 'Intermediate' : 'Beginner'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
