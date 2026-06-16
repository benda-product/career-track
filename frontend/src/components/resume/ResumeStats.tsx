'use client'

import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, FileText, Eye, Star } from 'lucide-react'

export interface ResumeStatsProps {
  totalResumes: number
  visibleResumes: number
  averageAtsScore: number
  averageCompletion: number
}

export function ResumeStats({
  totalResumes,
  visibleResumes,
  averageAtsScore,
  averageCompletion,
}: ResumeStatsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, preview, and manage which CVs are visible to recruiters.
          </p>
        </div>

        <Badge variant="secondary" className="w-fit border-border/40 bg-card/60">
          Enterprise-ready ATS scoring and visibility controls
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total resumes" value={totalResumes} icon={FileText} />
        <StatCard title="Visible to recruiters" value={visibleResumes} icon={Eye} />
        <StatCard title="Average ATS score" value={`${averageAtsScore}%`} icon={Star} />
        <StatCard title="Profile completion" value={`${averageCompletion}%`} icon={BarChart3} />
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
        <CardContent className="py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Tip: keep your strongest resume visible to recruiters for better match quality.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Green = visible</Badge>
              <Badge variant="secondary">Blue = ATS score</Badge>
              <Badge variant="secondary">Yellow = needs attention</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

