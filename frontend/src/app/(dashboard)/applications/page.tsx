'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Kanban,
  List,
  Search,
  X,
  Briefcase,
  Calendar,
  Building,
  Clock,
  Award,
  FileText,
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { applicationsService } from '@/services/applications.service';
import { APPLICATION_STAGES } from '@/constants';
import { Application, ApplicationStage } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

function getStageStyles(stage: string) {
  switch (stage) {
    case 'applied':
      return {
        dot: 'bg-sky-500',
        badge: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50',
        border: 'before:bg-sky-500',
        bg: 'bg-sky-500/5'
      };
    case 'screening':
      return {
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50',
        border: 'before:bg-amber-500',
        bg: 'bg-amber-500/5'
      };
    case 'shortlisted':
      return {
        dot: 'bg-indigo-500',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50',
        border: 'before:bg-indigo-500',
        bg: 'bg-indigo-500/5'
      };
    case 'interview':
      return {
        dot: 'bg-orange-500',
        badge: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50',
        border: 'before:bg-orange-500',
        bg: 'bg-orange-500/5'
      };
    case 'offer':
      return {
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        border: 'before:bg-emerald-500',
        bg: 'bg-emerald-500/5'
      };
    case 'rejected':
      return {
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50',
        border: 'before:bg-rose-500',
        bg: 'bg-rose-500/5'
      };
    case 'hired':
      return {
        dot: 'bg-primary',
        badge: 'bg-primary/10 text-primary border-primary/20 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
        border: 'before:bg-primary',
        bg: 'bg-primary/5'
      };
    default:
      return {
        dot: 'bg-slate-500',
        badge: 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800',
        border: 'before:bg-slate-500',
        bg: 'bg-slate-500/5'
      };
  }
}

export default function ApplicationsPage() {
  const [view, setView] = useState<'kanban' | 'timeline'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsService.getApplications(1, 100),
    retry: false,
  });

  const rawApplications = (data?.data as Application[]) || [];

  // Filter application elements based on active search queries
  const applications = useMemo(() => {
    return rawApplications.filter((app) => {
      const title = app.jobTitle || '';
      const company = app.company || '';
      return (
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [rawApplications, searchQuery]);

  // Group applications per pipeline column
  const grouped = useMemo(() => {
    return APPLICATION_STAGES.reduce((acc, stage) => {
      acc[stage.value] = applications.filter((a) => a.stage === stage.value);
      return acc;
    }, {} as Record<ApplicationStage, Application[]>);
  }, [applications]);

  const handleCardClick = (app: Application) => {
    setSelectedApp(app);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedAppId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Visual Page Header */}
      <PageHeader
        title="Applications"
        description="Track and analyze your recruitment progression stages and recruiter comments"
        action={
          <div className="flex gap-2 p-1 bg-muted rounded-xl border">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer",
                view === 'kanban'
                  ? "bg-background text-foreground shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              Board View
            </button>
            <button
              onClick={() => setView('timeline')}
              className={cn(
                "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer",
                view === 'timeline'
                  ? "bg-background text-foreground shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Timeline List
            </button>
          </div>
        }
      />

      {/* Control bar / search filtering inputs */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search applications by company or job..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 py-2 text-sm w-full bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : view === 'kanban' ? (
        /* KANBAN BOARD CONTAINER */
        <div className="flex gap-4 overflow-x-auto pb-4 max-w-full items-start">
          {APPLICATION_STAGES.map((stage) => {
            const list = grouped[stage.value] || [];
            const count = list.length;
            const style = getStageStyles(stage.value);

            return (
              <div key={stage.value} className="min-w-[270px] max-w-[280px] flex-shrink-0 bg-muted/20 border rounded-2xl p-3 space-y-3">
                {/* Column header tag */}
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', style.dot)} />
                    <h3 className="text-xs font-bold text-foreground truncate">{stage.label}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold bg-background border-border">
                    {count}
                  </Badge>
                </div>

                {/* Cards stack */}
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5 scrollbar-thin">
                  {list.length > 0 ? (
                    list.map((app) => (
                      <Card
                        key={app._id}
                        onClick={() => handleCardClick(app)}
                        className={cn(
                          "relative overflow-hidden border-border/80 shadow-sm pl-3.5 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1 cursor-pointer hover:shadow-md hover:border-primary/45 transition-all duration-200",
                          style.border
                        )}
                      >
                        <CardContent className="p-3.5 space-y-2">
                          <div>
                            <p className="text-xs font-bold text-foreground leading-snug line-clamp-1">{app.jobTitle}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                              <Building className="h-3 w-3 shrink-0" />
                              {app.company}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between gap-2 border-t pt-2 text-[9px] text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(app.appliedAt), 'MMM d, yyyy')}
                            </span>
                            {app.timeline && app.timeline.length > 1 && (
                              <Badge className="bg-primary/10 text-primary border-0 text-[8px] font-bold uppercase rounded py-0.5 px-1 flex items-center gap-0.5">
                                Updated
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground/80 py-8 text-center bg-background/30 border border-dashed rounded-xl">
                      No applications
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TIMELINE LIST CONTAINER */
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex flex-wrap h-auto bg-muted/50 p-1 border rounded-xl gap-0.5 max-w-fit mb-4">
            <TabsTrigger value="all" className="text-[10px] font-bold rounded-lg px-3 py-1 cursor-pointer">All</TabsTrigger>
            {APPLICATION_STAGES.map((s) => (
              <TabsTrigger key={s.value} value={s.value} className="text-[10px] font-bold rounded-lg px-3 py-1 cursor-pointer">
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-0 focus-visible:outline-none">
            {applications.map((app) => {
              const style = getStageStyles(app.stage);
              const isExpanded = expandedAppId === app._id;
              
              return (
                <Card 
                  key={app._id} 
                  className={cn(
                    "relative overflow-hidden border-border/80 shadow-sm pl-4 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1 transition-all duration-200",
                    style.border
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Left Info block */}
                      <div className="space-y-2 flex-1">
                        <div>
                          <h3 className="font-bold text-foreground text-sm tracking-tight sm:text-base leading-snug">{app.jobTitle}</h3>
                          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                            <Building className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75" />
                            {app.company}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Applied: <strong className="text-foreground">{format(new Date(app.appliedAt), 'MMM d, yyyy')}</strong>
                          </span>
                          {app.resumeTitle && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              Resume: <strong className="text-foreground">{app.resumeTitle}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Stage & Expansion Trigger */}
                      <div className="flex shrink-0 gap-2 items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0">
                        <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5', style.badge)}>
                          {APPLICATION_STAGES.find((s) => s.value === app.stage)?.label}
                        </Badge>
                        {app.timeline && app.timeline.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleExpand(app._id)}
                            className="h-8 font-semibold text-[10px] border gap-1 hover:bg-muted/30"
                          >
                            {isExpanded ? 'Hide Timeline' : 'View Timeline'}
                            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Timeline Expansion Block */}
                    <AnimatePresence initial={false}>
                      {isExpanded && app.timeline && app.timeline.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 border-t border-border/40 pt-4 pl-4 relative space-y-4 before:absolute before:top-4 before:bottom-4 before:left-6 before:w-0.5 before:bg-border">
                            {app.timeline.map((t, i) => {
                              const subStyle = getStageStyles(t.stage);
                              return (
                                <div key={i} className="flex items-start gap-4 relative">
                                  {/* Timeline node dot */}
                                  <span className={cn('h-3.5 w-3.5 rounded-full border-2 border-background z-10 shrink-0 mt-0.5', subStyle.dot)} />
                                  <div className="space-y-0.5 min-w-0">
                                    <p className="text-xs font-bold text-foreground">
                                      <span className="capitalize">{t.stage}</span>
                                      <span className="text-[10px] text-muted-foreground font-semibold"> · {format(new Date(t.date), 'MMM d, yyyy')}</span>
                                    </p>
                                    {t.note && (
                                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 bg-muted/40 p-2 rounded-lg border border-border/30">
                                        {t.note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Dynamic tabs filters mapping */}
          {APPLICATION_STAGES.map((stage) => {
            const list = grouped[stage.value] || [];
            return (
              <TabsContent key={stage.value} value={stage.value} className="space-y-3 mt-0 focus-visible:outline-none">
                {list.length > 0 ? (
                  list.map((app) => {
                    const isExpanded = expandedAppId === app._id;
                    const style = getStageStyles(app.stage);
                    return (
                      <Card 
                        key={app._id} 
                        className={cn(
                          "relative overflow-hidden border-border/80 shadow-sm pl-4 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1 transition-all duration-200",
                          style.border
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div>
                                <h3 className="font-bold text-foreground text-sm tracking-tight sm:text-base leading-snug">{app.jobTitle}</h3>
                                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                                  <Building className="h-3.5 w-3.5 shrink-0 text-muted-foreground/75" />
                                  {app.company}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Applied: <strong className="text-foreground">{format(new Date(app.appliedAt), 'MMM d, yyyy')}</strong>
                                </span>
                                {app.resumeTitle && (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                    Resume: <strong className="text-foreground">{app.resumeTitle}</strong>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex shrink-0 gap-2 items-center justify-between sm:justify-end w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0">
                              <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5', style.badge)}>
                                {stage.label}
                              </Badge>
                              {app.timeline && app.timeline.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleExpand(app._id)}
                                  className="h-8 font-semibold text-[10px] border gap-1 hover:bg-muted/30"
                                >
                                  {isExpanded ? 'Hide Timeline' : 'View Timeline'}
                                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                                </Button>
                              )}
                            </div>
                          </div>

                          <AnimatePresence initial={false}>
                            {isExpanded && app.timeline && app.timeline.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 border-t border-border/40 pt-4 pl-4 relative space-y-4 before:absolute before:top-4 before:bottom-4 before:left-6 before:w-0.5 before:bg-border">
                                  {app.timeline.map((t, i) => {
                                    const subStyle = getStageStyles(t.stage);
                                    return (
                                      <div key={i} className="flex items-start gap-4 relative">
                                        <span className={cn('h-3.5 w-3.5 rounded-full border-2 border-background z-10 shrink-0 mt-0.5', subStyle.dot)} />
                                        <div className="space-y-0.5 min-w-0">
                                          <p className="text-xs font-bold text-foreground">
                                            <span className="capitalize">{t.stage}</span>
                                            <span className="text-[10px] text-muted-foreground font-semibold"> · {format(new Date(t.date), 'MMM d, yyyy')}</span>
                                          </p>
                                          {t.note && (
                                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 bg-muted/40 p-2 rounded-lg border border-border/30">
                                              {t.note}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="border-border/60 shadow-sm bg-muted/20">
                    <CardContent className="py-12 text-center max-w-sm mx-auto space-y-2">
                      <p className="text-xs font-bold text-foreground">No applications found</p>
                      <p className="text-[11px] text-muted-foreground">You do not have any job applications in the "{stage.label}" stage.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {/* DETAIL DIALOG DRAWER (Kanban card pop-up viewer) */}
      <Dialog open={selectedApp !== null} onOpenChange={(open) => !open && setSelectedApp(null)}>
        {selectedApp && (() => {
          const style = getStageStyles(selectedApp.stage);
          return (
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl p-6">
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 border-b pb-2">
                  <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5', style.badge)}>
                    {APPLICATION_STAGES.find((s) => s.value === selectedApp.stage)?.label}
                  </Badge>
                  <DialogTitle className="text-base font-bold text-foreground truncate select-text">
                    Application Particulars
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-3">
                {/* Job particulars header */}
                <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-2.5">
                  <div>
                    <h3 className="font-bold text-foreground text-base tracking-tight leading-snug">{selectedApp.jobTitle}</h3>
                    <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                      <Building className="h-4 w-4 shrink-0 text-muted-foreground/80" />
                      {selectedApp.company}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Applied: <strong className="text-foreground">{format(new Date(selectedApp.appliedAt), 'MMM d, yyyy')}</strong>
                    </span>
                    {selectedApp.resumeTitle && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-primary" />
                        Resume: <strong className="text-foreground">{selectedApp.resumeTitle}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Recruiter feedback section */}
                {selectedApp.recruiterFeedback && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Recruiter Feedback
                    </h4>
                    <div className="p-3.5 rounded-xl border border-primary/10 bg-primary/5 text-xs text-foreground leading-relaxed">
                      {selectedApp.recruiterFeedback}
                    </div>
                  </div>
                )}

                {/* Candidate notes section */}
                {selectedApp.notes && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Application Notes
                    </h4>
                    <p className="p-3.5 rounded-xl border border-border/80 bg-background text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                      {selectedApp.notes}
                    </p>
                  </div>
                )}

                {/* Step-by-step progress timeline */}
                {selectedApp.timeline && selectedApp.timeline.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Recruitment Pipeline Timeline
                    </h4>
                    
                    <div className="pl-4 relative space-y-4 before:absolute before:top-4 before:bottom-4 before:left-6 before:w-0.5 before:bg-border">
                      {selectedApp.timeline.map((t, i) => {
                        const subStyle = getStageStyles(t.stage);
                        return (
                          <div key={i} className="flex items-start gap-4 relative">
                            {/* Node circle */}
                            <span className={cn('h-3.5 w-3.5 rounded-full border-2 border-background z-10 shrink-0 mt-0.5', subStyle.dot)} />
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground">
                                <span className="capitalize">{t.stage}</span>
                                <span className="text-[10px] text-muted-foreground font-semibold"> · {format(new Date(t.date), 'MMM d, yyyy')}</span>
                              </p>
                              {t.note && (
                                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 bg-muted/40 p-2.5 rounded-xl border border-border/30">
                                  {t.note}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer action buttons */}
                <div className="flex gap-2 justify-end pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)} className="h-9 px-4 font-semibold text-xs border-border/80 text-foreground hover:bg-muted/30">
                    Close Details
                  </Button>
                </div>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
}
