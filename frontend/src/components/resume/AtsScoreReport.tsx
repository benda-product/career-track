'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { ResumeAtsScore } from '@/services/resume.service';
import { resumeService } from '@/services/resume.service';
import { cn } from '@/lib/utils';
import {
  Search,
  Cpu,
  TrendingUp,
  LayoutGrid,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowLeft,
  BadgeCheck,
  Zap,
  Info,
  Check,
  Plus
} from 'lucide-react';

const BREAKDOWN_METRICS = [
  { 
    key: 'searchability', 
    label: 'Searchability', 
    max: 25, 
    icon: Search,
    desc: 'Analyzes contact information, link formatting, and profile search tags.' 
  },
  { 
    key: 'hardSkills', 
    label: 'Hard Skills', 
    max: 25, 
    icon: Cpu,
    desc: 'Measures density and placement of technical tools and core skills.' 
  },
  { 
    key: 'experienceImpact', 
    label: 'Experience Impact', 
    max: 25, 
    icon: TrendingUp,
    desc: 'Scans for strong action verbs, metrics, and quantifiable outcomes.' 
  },
  { 
    key: 'formatting', 
    label: 'ATS Formatting', 
    max: 15, 
    icon: LayoutGrid,
    desc: 'Checks column structures, standard font landmarks, and margins.' 
  },
  { 
    key: 'education', 
    label: 'Education Align', 
    max: 10, 
    icon: GraduationCap,
    desc: 'Verifies degree formats, certifications, and academic timelines.' 
  },
] as const;

function getScoreColorClass(score: number) {
  if (score >= 75) return {
    stroke: 'stroke-primary',
    text: 'text-primary',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
    progressBg: 'bg-primary',
    progressClass: '[&_[data-slot=progress-indicator]]:bg-primary'
  };
  if (score >= 50) return {
    stroke: 'stroke-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
    progressBg: 'bg-amber-500',
    progressClass: '[&_[data-slot=progress-indicator]]:bg-amber-500'
  };
  return {
    stroke: 'stroke-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 text-rose-800 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
    progressBg: 'bg-rose-500',
    progressClass: '[&_[data-slot=progress-indicator]]:bg-rose-500'
  };
}

function getGradeMessage(grade?: string, score: number = 0) {
  const normGrade = grade || (score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Fair');
  switch (normGrade) {
    case 'Excellent':
      return {
        title: 'Outstanding Match!',
        desc: 'Your resume meets modern ATS formatting, structural patterns, and keyword density. It is highly optimized for applicant tracking filters and recruiters.',
      };
    case 'Good':
      return {
        title: 'Strong Foundation',
        desc: 'Great progress! Your resume is clean, but making a few minor adjustments to keywords and adding metrics to your experience can secure a top-tier rating.',
      };
    case 'Fair':
      return {
        title: 'Needs Key Adjustments',
        desc: 'Your resume has solid sections, but the parser might struggle with some keywords or layout points. Applying the suggested items below will help boost readability.',
      };
    default:
      return {
        title: 'Optimization Recommended',
        desc: 'Significant structural gaps or missing credentials detected. We recommend rebuilding or updating formatting to ensure your details parse reliably.',
      };
  }
}

interface AtsScoreReportProps {
  result: ResumeAtsScore;
  resumeId?: string;
  onReset: () => void;
}

export function AtsScoreReport({ result, resumeId, onReset }: AtsScoreReportProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(result.score);
    }, 200);
    return () => clearTimeout(timer);
  }, [result.score]);

  const score = result.score;
  const colors = getScoreColorClass(score);
  const gradeMessage = getGradeMessage(result.grade, score);

  const breakdown = result.breakdown || {};
  const strengths = result.strengths || [];
  const improvements = result.improvements || result.suggestions || [];
  const issues = result.issues || [];
  const matchedKeywords = result.keywords?.matched || [];
  const missingKeywords = result.keywords?.missing || [];

  // Gauge dimensions
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  const handleImprove = () => {
    if (resumeId) {
      void resumeService.openInResumeBuilder({
        type: 'edit',
        resumeId,
        returnUrl: `${window.location.origin}/resume/ats`,
      });
    } else {
      void resumeService.openInResumeBuilder({
        type: 'create',
        returnUrl: `${window.location.origin}/resume/ats`,
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back button and main header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onReset} className="h-9 w-9 p-0 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold tracking-tight">ATS Analysis Report</h2>
            <p className="text-sm text-muted-foreground">Detailed parser readiness and compatibility scoring</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
          Scan Another
        </Button>
      </div>

      {/* Hero Overview Card */}
      <Card className="overflow-hidden border-border/80 shadow-md">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-around md:gap-6">
            {/* Animated SVG Radial Gauge */}
            <div className="relative flex flex-col items-center justify-center">
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Track Circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  className="stroke-muted/40"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                {/* Score Indicator Circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  className={cn(colors.stroke, 'transition-all duration-1000 ease-out')}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">{animatedScore}%</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  ATS MATCH
                </span>
              </div>
            </div>

            {/* Overall Feedback Details */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <span className={cn('rounded-full border px-3 py-0.5 text-xs font-semibold uppercase tracking-wider', colors.bg)}>
                    {result.grade || (score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Fair')}
                  </span>
                  {result.parseConfidence != null && (
                    <span className="rounded-full border border-border bg-muted/50 px-3 py-0.5 text-xs font-medium text-muted-foreground">
                      Parse confidence: {result.parseConfidence}%
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">{gradeMessage.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-xl">
                  {gradeMessage.desc}
                </p>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1.5 max-w-md mx-auto md:mx-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Compatibility Threshold</span>
                  <span className="font-semibold text-primary">Target: 75%+</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full transition-all duration-1000 ease-out', colors.progressBg)}
                    style={{ width: `${score}%` }}
                  />
                  {/* Threshold mark at 75% */}
                  <div className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-background dark:bg-foreground/20" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Alert (Red alert box for high priority tasks) */}
      {issues.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-950/30 dark:bg-rose-950/10 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <AlertTriangle className="h-4.5 w-4.5" />
            </span>
            <div>
              <CardTitle className="text-sm font-bold text-rose-900 dark:text-rose-400">Critical Formatting & Parsing Issues</CardTitle>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80">These parameters can prevent applicant tracking systems from reading your resume correctly</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pl-14 pb-4">
            {issues.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-rose-800 dark:text-rose-300">
                <span className="text-rose-400 dark:text-rose-600 mt-1">•</span>
                <p className="leading-snug">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metric Breakdown Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="h-4.5 w-4.5 text-primary" />
          Core Metric Scores
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BREAKDOWN_METRICS.map(({ key, label, max, icon: Icon, desc }) => {
            const value = Number(breakdown[key] || 0);
            const percent = Math.min(100, Math.round((value / max) * 100));
            const subColors = getScoreColorClass(percent);
            
            return (
              <Card key={key} className="flex flex-col justify-between border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-foreground">{value}</span>
                      <span className="text-xs text-muted-foreground">/{max}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                    <p className="text-xs text-muted-foreground leading-snug mt-1">{desc}</p>
                  </div>
                  <div className="space-y-1 pt-1">
                    <Progress value={percent} className={cn("h-1.5", subColors.progressClass)} />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>Rating: {percent}%</span>
                      <span>{percent >= 75 ? 'Optimal' : percent >= 50 ? 'Average' : 'Critical'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvements Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Strengths Card */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Passed Checks ({strengths.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {strengths.length > 0 ? (
              <div className="space-y-3">
                {strengths.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm bg-emerald-50/20 dark:bg-emerald-950/5 p-3 rounded-lg border border-emerald-500/10">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <p className="text-muted-foreground leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No specific strengths parsed. Work on structure to populate these checks.</p>
            )}
          </CardContent>
        </Card>

        {/* Improvements Card */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Actionable Improvements ({improvements.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {improvements.length > 0 ? (
              <div className="space-y-3">
                {improvements.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm bg-amber-50/20 dark:bg-amber-950/5 p-3 rounded-lg border border-amber-500/10">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-foreground leading-snug">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BadgeCheck className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground font-medium">All formatting checks passed successfully!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Keyword Matching Analytics Dashboard (Optional Job Description check content) */}
      {(matchedKeywords.length > 0 || missingKeywords.length > 0) && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Keyword Match Intelligence
            </CardTitle>
            <p className="text-xs text-muted-foreground">Comparison of keywords from your job description against the parsed document text</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Matched keywords */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                      {matchedKeywords.length}
                    </span>
                    Matched in Resume
                  </h4>
                  <span className="text-xs text-muted-foreground">Increases relevance score</span>
                </div>
                {matchedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-muted/30 border border-border/50 max-h-48 overflow-y-auto">
                    {matchedKeywords.map((kw) => (
                      <Badge key={kw} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100 flex items-center gap-1 py-1 px-2.5 rounded-lg dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        {kw}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground bg-muted/20 border p-4 rounded-xl text-center">No matched keywords. Ensure skills are listed clearly in roles.</p>
                )}
              </div>

              {/* Missing keywords */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-bold">
                      {missingKeywords.length}
                    </span>
                    Missing / Recommendations
                  </h4>
                  <span className="text-xs text-muted-foreground">Target addition areas</span>
                </div>
                {missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-muted/30 border border-border/50 max-h-48 overflow-y-auto">
                    {missingKeywords.map((kw) => (
                      <Badge key={kw} variant="outline" className="bg-amber-50/50 hover:bg-amber-50 text-amber-700 border-amber-200/60 flex items-center gap-1 py-1 px-2.5 rounded-lg dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/50">
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        {kw}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-emerald-50/10 border border-emerald-500/10 rounded-xl">
                    <BadgeCheck className="h-8 w-8 text-emerald-500 mb-1" />
                    <p className="text-xs text-emerald-700 font-medium">100% keyword matches found!</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA action footer bar */}
      <Card className="bg-muted/30 border-border/60">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-bold text-foreground">Optimize your resume now</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Use the interactive builder to resolve warnings and boost score</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={onReset}>
              Run New Scan
            </Button>
            <Button onClick={handleImprove} className="gap-2 shadow-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              <Sparkles className="h-4.5 w-4.5" />
              Improve in Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
