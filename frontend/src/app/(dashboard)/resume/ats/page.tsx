'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  UploadCloud,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Layers,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AtsScoreReport } from '@/components/resume/AtsScoreReport';
import { ResumeUpgradeBanner } from '@/components/resume/ResumeUpgradeBanner';
import { getResumeId, resumeService, type ResumeAtsScore, type ResumeItem } from '@/services/resume.service';
import { cn } from '@/lib/utils';

const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
type SourceMode = 'saved' | 'upload';

const LOADING_STEPS = [
  '📄 Accessing and verifying resume layout structure...',
  '⚙️ Analysing section landmarks, headers, and metadata...',
  '🏷️ Parsing work experiences and extracting key skill profiles...',
  '🧠 Measuring semantic relevance & keyword density...',
  '📊 Evaluating document typography, margins, and readability...',
  '✨ Generating final ATS readiness scoring dashboard...',
];

export default function AtsCheckPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<SourceMode>('saved');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResumeAtsScore | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const { data: resumes, isLoading: loadingResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeService.getResumes,
  });

  const { data: resumeEntitlements } = useQuery({
    queryKey: ['resume-entitlements'],
    queryFn: resumeService.getEntitlements,
  });

  const canMatchJobDescription = Boolean(resumeEntitlements?.featureFlags?.jdMatching);

  const resumeList = (resumes as ResumeItem[] | undefined) || [];

  useEffect(() => {
    if (resumeList.length > 0 && !selectedResumeId) {
      setSelectedResumeId(getResumeId(resumeList[0]));
    }
    if (resumeList.length === 0) {
      setSource('upload');
    }
  }, [resumeList, selectedResumeId]);

  // Handle active loading step progression
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (checking) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checking]);

  const selectedResume = useMemo(
    () => resumeList.find((resume) => getResumeId(resume) === selectedResumeId) || null,
    [resumeList, selectedResumeId]
  );

  const canRunScan = source === 'saved' ? Boolean(selectedResumeId) : Boolean(uploadFile);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadFile(file);
    setResult(null);
    setError('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf' || extension === 'docx') {
        setUploadFile(file);
        setResult(null);
        setError('');
      } else {
        setError('Unsupported format. Please drop a PDF or DOCX file.');
      }
    }
  };

  const runCheck = useCallback(
    async (withJobDescription: boolean) => {
      setError('');
      setResult(null);
      setChecking(true);

      try {
        if (withJobDescription && !canMatchJobDescription) {
          throw new Error('Pro plan required for job-description matching. Upgrade in Billing.');
        }

        if (source === 'saved') {
          if (!selectedResumeId) {
            throw new Error('Please select a saved resume first.');
          }

          const data = withJobDescription
            ? await resumeService.checkAts(selectedResumeId, jobDescription)
            : await resumeService.getScore(selectedResumeId);
          setResult(data);
          return;
        }

        if (!uploadFile) {
          throw new Error('Please upload a PDF or DOCX resume first.');
        }

        const data = await resumeService.checkAtsUpload(
          uploadFile,
          withJobDescription ? jobDescription : undefined
        );
        setResult(data);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        setError(axiosErr.response?.data?.message || axiosErr.message || 'ATS check scan failed.');
      } finally {
        setChecking(false);
      }
    },
    [source, selectedResumeId, uploadFile, jobDescription, canMatchJobDescription]
  );

  const resetScanner = () => {
    setResult(null);
    setUploadFile(null);
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <PageHeader
        title="Check ATS Compatibility"
        description="Verify how parser bots scan your resume and optimize content relevance matching industry guidelines"
      />

      <ResumeUpgradeBanner />

      {/* Main scanner view wrapper */}
      <AnimatePresence mode="wait">
        {checking && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex items-center justify-center min-h-[350px]"
          >
            <Card className="w-full max-w-xl border-primary/20 shadow-lg text-center overflow-hidden">
              {/* Pulsing scanning bar animation */}
              <div className="relative h-1.5 w-full bg-muted overflow-hidden">
                <div className="h-full w-1/3 bg-primary rounded-full animate-infinite-scan" style={{
                  animation: 'shimmer 1.8s infinite linear',
                  backgroundImage: 'linear-gradient(to right, transparent, oklch(0.54 0.14 142), transparent)'
                }} />
              </div>
              <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center space-y-6">
                <div className="relative flex items-center justify-center">
                  {/* Rotating loader circle */}
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </span>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">ATS Simulation Active</h3>
                  <p className="text-sm font-medium text-primary h-6 transition-all duration-300">
                    {LOADING_STEPS[loadingStep]}
                  </p>
                  <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto">
                    Scanning keywords, headers, structures, and grading file layout elements...
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!checking && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AtsScoreReport
              result={result}
              resumeId={source === 'saved' ? selectedResumeId : undefined}
              onReset={resetScanner}
            />
          </motion.div>
        )}

        {!checking && !result && (
          <motion.div
            key="config"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 lg:grid-cols-12 items-start"
          >
            {/* Control panel card */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border-border/80 shadow-sm overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  {/* Subheader */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-foreground">Parser Configuration</h2>
                      <p className="text-xs text-muted-foreground">
                        Configure the source file and job context to begin scanning.
                      </p>
                    </div>
                  </div>

                  {/* Mode Toggle Button Group */}
                  <div className="flex items-center p-1 bg-muted rounded-xl w-fit">
                    <button
                      type="button"
                      disabled={resumeList.length === 0}
                      onClick={() => {
                        setSource('saved');
                        setError('');
                      }}
                      className={cn(
                        "text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                        source === 'saved'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground disabled:opacity-50"
                      )}
                    >
                      Saved Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSource('upload');
                        setError('');
                      }}
                      className={cn(
                        "text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                        source === 'upload'
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Upload File
                    </button>
                  </div>

                  {/* Dynamic Source Inputs */}
                  <div className="space-y-4">
                    {source === 'saved' ? (
                      <div className="space-y-2">
                        <Label htmlFor="ats-resume" className="text-sm font-semibold text-foreground">Select saved resume</Label>
                        {loadingResumes ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Retrieving saved files...
                          </div>
                        ) : resumeList.length === 0 ? (
                          <p className="text-xs text-muted-foreground border border-dashed rounded-xl p-4 text-center">
                            No saved resumes found. Try uploading a PDF/DOCX or create one from the resumes tab.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <Select value={selectedResumeId} onValueChange={(val) => val && setSelectedResumeId(val)}>
                              <SelectTrigger id="ats-resume" className="h-10 border-border/80">
                                <SelectValue placeholder="Select resume..." />
                              </SelectTrigger>
                              <SelectContent>
                                {resumeList.map((resume) => {
                                  const id = getResumeId(resume);
                                  const label = resume.title?.trim() || 'Untitled resume';
                                  return (
                                    <SelectItem key={id} value={id}>
                                      {label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {selectedResume && (
                              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground bg-muted/40 p-2 rounded-lg w-fit border">
                                <FileText className="h-3.5 w-3.5 text-primary" />
                                <span>Template format: {selectedResume.template || 'Modern default'}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="ats-upload" className="text-sm font-semibold text-foreground">Upload resume document</Label>
                        
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300",
                            uploadFile
                              ? "border-primary/50 bg-primary/5"
                              : isDragOver
                                ? "border-primary bg-primary/10 scale-[1.01]"
                                : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
                          )}
                        >
                          <input
                            ref={fileInputRef}
                            id="ats-upload"
                            type="file"
                            accept={ACCEPT}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          
                          {uploadFile ? (
                            <div className="space-y-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold text-foreground max-w-xs truncate mx-auto">{uploadFile.name}</p>
                                <p className="text-xs text-muted-foreground">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUploadFile(null);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold mt-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear and replace
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                                <UploadCloud className="h-5 w-5 animate-bounce-slow" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground">Click to upload or drag & drop</p>
                                <p className="text-[11px] text-muted-foreground/80">PDF or Microsoft DOCX files supported (Max size: 5 MB)</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Job Description Form Area */}
                    <div className="space-y-2">
                      <Label htmlFor="ats-jd" className="text-sm font-semibold text-foreground flex items-center justify-between">
                        <span>Job Description (highly recommended)</span>
                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Keyword analysis
                        </span>
                      </Label>
                      <Textarea
                        id="ats-jd"
                        rows={6}
                        value={jobDescription}
                        onChange={(event) => setJobDescription(event.target.value)}
                        placeholder="Paste the target job description here to analyze missing key competencies, skills matching indexes, and boost relevant scores..."
                        className="border-border/80 text-sm leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      disabled={checking || !canRunScan}
                      onClick={() => void runCheck(false)}
                      className="flex-1 shadow-sm font-semibold h-10"
                    >
                      Verify Standard ATS Rules
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={checking || !canRunScan || !jobDescription.trim() || !canMatchJobDescription}
                      onClick={() => void runCheck(true)}
                      className="flex-1 border-border/80 hover:bg-muted/30 font-semibold h-10 text-foreground"
                    >
                      {canMatchJobDescription ? 'Compare against Job Spec' : 'Job match (Pro required)'}
                    </Button>
                  </div>

                  {/* Error display */}
                  {error && (
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-400 flex items-start gap-2.5">
                      <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right panel guide */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border/80 shadow-sm bg-muted/20">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/40">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <BookOpen className="h-4.5 w-4.5 text-primary" />
                    How ATS Algorithms Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Over 95% of major employers use Applicant Tracking Systems (ATS) to filter CVs. Follow these best-practice standards to optimize formatting and matching ratios:
                  </p>

                  <div className="space-y-4">
                    {/* Rule 1 */}
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">Format and Layout Cleanness</h4>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          Keep font sizing clean and structure simple. Multi-column tables, visual templates, and image-text containers are frequently skipped by parser bots.
                        </p>
                      </div>
                    </div>

                    {/* Rule 2 */}
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Layers className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">Keyword Density Alignment</h4>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          Directly match tool terms, frameworks, and job titles. Ensure required credentials appear multiple times in context.
                        </p>
                      </div>
                    </div>

                    {/* Rule 3 */}
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">Standardized Heading Markers</h4>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          Organize sections with clear, standard landmarks like "Work Experience", "Education", and "Skills" for linear reading order.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer callout */}
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span>CareerTrack Scorer</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Scan results identify gaps in real-time, matching Benda Infotech database rules. Open files in the Builder to optimize with suggested metrics.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
