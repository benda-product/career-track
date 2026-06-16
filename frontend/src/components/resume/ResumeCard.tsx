'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ResumeActions } from '@/components/resume/ResumeActions'
import { Star, Users, Sparkles, Clock3, Layers } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ResumeItem } from '@/services/resume.service'

const resumeTemplateLabelMap: Record<string, string> = {
  ats: 'ATS',
  modern: 'Modern',
  minimal: 'Minimal',
  'software-engineer': 'Software Engineer',
  'data-analyst': 'Data Analyst',
  executive: 'Executive',
  'full-stack': 'Full Stack',
  'data-analyst': 'Data Analyst',
}

function getResumeType(template?: string) {
  if (!template) return 'Resume'
  return resumeTemplateLabelMap[template] || template
}

function toCompletionPercent(resume: ResumeItem) {
  const checks = [
    Boolean(resume.title && resume.title.trim().length > 0),
    (resume.skills?.length || 0) > 0,
    (resume.experience?.length || 0) > 0,
    (resume.education?.length || 0) > 0,
    Boolean((resume.personalInfo as any)?.summary?.trim?.()),
    (resume.projects?.length || 0) > 0,
  ]
  const total = checks.length || 1
  const done = checks.filter(Boolean).length
  return Math.round((done / total) * 100)
}

function formatUpdatedAt(updatedAt?: string | Date) {
  if (!updatedAt) return '—'
  const date = typeof updatedAt === 'string' ? new Date(updatedAt) : updatedAt
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

export interface ResumeCardProps {
  resume: ResumeItem
  index: number
  completionPercent?: number
  isViewable: boolean
  isTogglingViewable: boolean
  isDownloading: boolean
  isDeleting: boolean
  isDuplicating: boolean
  onView: () => void
  onEdit: () => void
  onDownload: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleVisibility: () => void
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
  const resumeId = resume.id || resume._id || ''
  const title = resume.title || `Resume ${index + 1}`
  const score = resume.score
  const skillsCount = resume.skills?.length || 0
  const experienceCount = resume.experience?.length || 0
  const templateLabel = getResumeType(resume.template)
  const updatedAtLabel = formatUpdatedAt(resume.updatedAt)
  const completion = completionPercent ?? toCompletionPercent(resume)

  if (!resumeId) return null

  return (
    <motion.div
      layout
      className="h-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full border-border/40 bg-card/50 transition-shadow hover:shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate text-base sm:text-lg">{title}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="border-border/40 bg-background/40">
                  <Layers className="mr-1 h-3.5 w-3.5" />
                  {templateLabel}
                </Badge>
                {score != null ? (
                  <Badge variant="secondary" className="border-border/40 bg-primary/5 text-primary">
                    <Star className="mr-1 h-3.5 w-3.5" />
                    {score}% ATS
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="border-border/40 bg-muted/30 text-muted-foreground">
                    <Star className="mr-1 h-3.5 w-3.5" />
                    No ATS score
                  </Badge>
                )}
                <Badge
                  className={isViewable ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-muted text-muted-foreground'}
                >
                  <Users className="mr-1 h-3.5 w-3.5" />
                  {isViewable ? 'Visible to recruiters' : 'Hidden from recruiters'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-2.5 py-1.5">
                      <Clock3 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">{updatedAtLabel}</span>
                    </div>
                  }
                />
                <TooltipContent>Last updated</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/40 bg-background/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Completion</p>
                <p className="text-xs font-semibold text-foreground tabular-nums">{completion}%</p>
              </div>
              <Progress value={completion} className="mt-2 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {skillsCount > 0 ? `${skillsCount} skills` : 'Add skills to improve matching.'}
              </p>
            </div>

            <div className="rounded-lg border border-border/40 bg-background/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Profile health</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="border-border/40 bg-card/60">
                    {experienceCount} experiences
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className="border-border/40 bg-muted/20">
                  {(resume.education?.length || 0)} education
                </Badge>
                <Badge variant="secondary" className="border-border/40 bg-muted/20">
                  {(resume.projects?.length || 0)} projects
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Actions</p>
              <div className="hidden sm:flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Manage your CV for recruiter visibility</span>
              </div>
            </div>

            <div className="mt-3">
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

