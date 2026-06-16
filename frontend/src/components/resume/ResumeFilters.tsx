/* eslint-disable react/jsx-no-bind */
'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'

export type ResumeSort = 'latest' | 'highest'
export type ResumeVisibilityFilter = 'all' | 'visible' | 'hidden'

export interface ResumeFiltersProps {
  query: string
  sort: ResumeSort
  visibility: ResumeVisibilityFilter
  onChangeQuery: (value: string) => void
  onChangeSort: (value: ResumeSort) => void
  onChangeVisibility: (value: ResumeVisibilityFilter) => void
  onReset: () => void
}

export function ResumeFilters({
  query,
  sort,
  visibility,
  onChangeQuery,
  onChangeSort,
  onChangeVisibility,
  onReset,
}: ResumeFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/40 p-4 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            placeholder="Search resumes by title, skills, or keywords…"
            className="h-10 bg-muted/30 pl-9"
            aria-label="Search resumes"
          />
        </div>

        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Refine</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Sort</span>
          <Select value={sort} onValueChange={(v) => onChangeSort(v as ResumeSort)}>
            <SelectTrigger className="w-[170px] bg-background/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="highest">Highest ATS score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Visibility</span>
          <Select value={visibility} onValueChange={(v) => onChangeVisibility(v as ResumeVisibilityFilter)}>
            <SelectTrigger className="w-[210px] bg-background/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resumes</SelectItem>
              <SelectItem value="visible">Visible to recruiters</SelectItem>
              <SelectItem value="hidden">Hidden from recruiters</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="h-10 gap-2"
          onClick={onReset}
          disabled={!query && sort === 'latest' && visibility === 'all'}
        >
          <Sparkles className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  )
}

