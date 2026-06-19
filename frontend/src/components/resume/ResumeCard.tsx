'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ResumeActions } from '@/components/resume/ResumeActions';
import { Star, Users, Sparkles, Clock3, Layers, FileText, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ResumeItem } from '@/services/resume.service';
import { cn } from '@/lib/utils';

const resumeTemplateLabelMap: Record<string, string> = {
  ats: 'ATS Standard',
  modern: 'Modern Premium',
  minimal: 'Minimalist Clean',
  'software-engineer': 'Tech Specialist',
  'data-analyst': 'Data Analytics',
  executive: 'Executive Leadership',
  'full-stack': 'Full-Stack Eng',
};

function getResumeType(template?: string) {
  if (!template) return 'Resume Document';
  return resumeTemplateLabelMap[template] || template;
}

function toCompletionPercent(resume: ResumeItem) {
  const checks = [
    Boolean(resume.title && resume.title.trim().length > 0),
    (resume.skills?.length || 0) > 0,
    (resume.experience?.length || 0) > 0,
    (resume.education?.length || 0) > 0,
    Boolean((resume.personalInfo as any)?.summary?.trim?.()),
    (resume.projects?.length || 0) > 0,
  ];
  const total = checks.length || 1;
  const done = checks.filter(Boolean).length;
  return Math.round((done / total) * 100);
}

function formatUpdatedAt(updatedAt?: string | Date) {
  if (!updatedAt) return '—';
  const date = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export interface ResumeCardProps {
  resume: ResumeItem;
  index: number;
  completionPercent?: number;
  isViewable: boolean;
  isTogglingViewable: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

export function ResumeCard({
  resume,
  index,
  completionPercent,
  isViewable,
  isTogglingViewable,
  isDownloading,
  isDeleting,
  isDuplicating,
  onView,
  onEdit,
  onDownload,
  onDuplicate,
  onDelete,
  onToggleVisibility,
}: ResumeCardProps) {
  const resumeId = resume.id || resume._id || '';
  const title = resume.title || `Resume ${index + 1}`;
  const score = resume.score;
  const skillsCount = resume.skills?.length || 0;
  const experienceCount = resume.experience?.length || 0;
  const templateLabel = getResumeType(resume.template);
  const updatedAtLabel = formatUpdatedAt(resume.updatedAt);
  const completion = completionPercent ?? toCompletionPercent(resume);

  if (!resumeId) return null;

  return (
    <motion.div
      layout
      className="h-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full border-slate-200 bg-white transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden relative">
        {/* Top accent border representing status */}
        <div className={cn("absolute top-0 left-0 right-0 h-1", isViewable ? "bg-primary" : "bg-slate-200")} />

        <CardHeader className="space-y-3 pt-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3 items-start min-w-0">
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-primary shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle className="truncate text-sm font-bold text-slate-800" title={title}>
                  {title}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                  <Clock3 className="h-3.5 w-3.5 text-slate-300" />
                  Updated {updatedAtLabel}
                </div>
              </div>
            </div>

            {/* Recruiter Visibility Pill */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button 
                    onClick={onToggleVisibility}
                    disabled={isTogglingViewable}
                    className={cn(
                      "shrink-0 p-1.5 rounded-lg border transition-all cursor-pointer",
                      isViewable 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100/50" 
                        : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100/80"
                    )}
                  >
                    {isViewable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                }
              />
              <TooltipContent>{isViewable ? 'Visible to Recruiters' : 'Private Draft'}</TooltipContent>
            </Tooltip>
          </div>

          {/* Configuration badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-100">
              <Layers className="mr-1 h-3.5 w-3.5 text-slate-400" />
              {templateLabel}
            </Badge>
            
            {score != null ? (
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <Star className="mr-1 h-3.5 w-3.5 fill-current text-primary" />
                {score}% ATS Score
              </Badge>
            ) : (
              <Badge className="text-[10px] bg-slate-100 text-slate-400 border-transparent hover:bg-slate-100">
                No ATS score
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Progress Indicators Grid */}
          <div className="grid gap-3 grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-3 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completeness</p>
                <p className="text-base font-extrabold text-slate-700 mt-0.5">{completion}%</p>
              </div>
              <div className="mt-2.5">
                <Progress value={completion} className="h-1.5 bg-slate-100" />
                <p className="mt-1.5 text-[10px] text-slate-500 font-semibold">
                  {skillsCount} Core Skills
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-3 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contents</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-500 font-medium">
                    {experienceCount} Exp
                  </Badge>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-500 font-medium">
                    {(resume.education?.length || 0)} Edu
                  </Badge>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-200 text-slate-500 font-medium">
                    {(resume.projects?.length || 0)} Proj
                  </Badge>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 leading-normal mt-2.5 font-medium">
                {isViewable ? "🟢 Live in recruiter pool" : "⚪ Draft mode"}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="border-t border-slate-100 pt-3 mt-1">
            <ResumeActions
              resumeId={resumeId}
              resumeTitle={title}
              isViewable={isViewable}
              isTogglingViewable={isTogglingViewable}
              isDownloading={isDownloading}
              isDeleting={isDeleting}
              isDuplicating={isDuplicating}
              onView={onView}
              onEdit={onEdit}
              onDownload={onDownload}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
