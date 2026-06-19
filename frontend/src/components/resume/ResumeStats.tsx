'use client'

import { StatCard } from '@/components/ui/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, FileText, Eye, EyeOff, Star } from 'lucide-react'

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total resumes" value={totalResumes} icon={FileText} />
        <StatCard title="Visible to recruiters" value={visibleResumes} icon={Eye} />
        <StatCard title="Average ATS score" value={`${averageAtsScore}%`} icon={Star} />
        <StatCard title="Profile completion" value={`${averageCompletion}%`} icon={BarChart3} />
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Tip: Keep your strongest resume visible to recruiters for better match quality.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Badge variant="secondary" className="bg-emerald-500 text-white hover:bg-emerald-500 border-transparent text-[10px] font-bold h-6">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Recruiter visible
              </Badge>
              <Badge variant="secondary" className="bg-primary text-white hover:bg-primary border-transparent text-[10px] font-bold h-6">
                <Star className="mr-1 h-3 w-3 fill-current text-white" />
                ATS scored
              </Badge>
              <Badge variant="secondary" className="bg-slate-200 text-slate-600 hover:bg-slate-200 border-transparent text-[10px] font-bold h-6">
                <EyeOff className="mr-1 h-3 w-3 text-slate-500" />
                Private draft
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

