'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  MapPin,
  Users,
  Wallet,
} from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { JobRecommendedAssessment } from '@/components/jobs/job-recommended-assessment';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { JobAuthDialog } from '@/components/jobs/job-auth-dialog';
import { JobDescriptionHtml } from '@/components/jobs/job-description-html';
import { jobsService } from '@/services/jobs.service';
import { useAuthStore } from '@/store/auth.store';
import { dedupeSkills, formatJobType } from '@/lib/job-content';
import { useJobApply } from '@/hooks/use-job-apply';
import type { Job } from '@/types';
import '@/styles/job-detail.css';

function companyInitials(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatLocation(job: Job) {
  const parts = [job.city, job.state, job.country].filter(Boolean);
  if (parts.length) return parts.join(', ');
  return job.location || '';
}

function formatExperience(job: Job) {
  if (job.minExperience != null && job.maxExperience != null) return `${job.minExperience}–${job.maxExperience} years`;
  if (job.minExperience != null) return `${job.minExperience}+ years`;
  if (job.maxExperience != null) return `Up to ${job.maxExperience} years`;
  return job.experienceLevel || '';
}

function formatWorkMode(job: Job) {
  if (job.remote) return 'Remote';
  if (job.hybrid) return 'Hybrid';
  return 'On-site';
}

function formatPostedDate(date?: string) {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}

function CompanyMark({ name, logo }: { name?: string; logo?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="company-mark" aria-hidden="true">
      {logo && !failed ? (
        <img src={logo} alt="" onError={() => setFailed(true)} />
      ) : (
        companyInitials(name)
      )}
    </div>
  );
}

function JobDetailContent() {
  const { id } = useParams<{ id: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const role = useAuthStore((s) => s.user?.role);
  const [assessmentDetailsOpen, setAssessmentDetailsOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [authPrompt, setAuthPrompt] = useState<'apply' | 'incompatible' | null>(null);

  const {
    applyJob,
    openApply,
    closeApply,
    submitApply,
    submitting,
    applyError,
    resumes,
    profileResumeId,
    defaultResumeId,
    createResume,
  } = useJobApply();

  const { data: job, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsService.getJob(id),
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('saved') !== '1') return;
    setNotice('Job saved successfully.');
    params.delete('saved');
    params.delete('jobId');
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', next);
  }, []);

  if (isLoading) {
    return (
      <div className="ct-job-detail">
        <div className="shell">
          <p className="muted">Loading job…</p>
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="ct-job-detail">
        <div className="shell shell--narrow">
          <h1>Unable to load this job</h1>
          <p className="muted">
            {error instanceof Error
              ? error.message
              : 'This posting may have been closed, or the jobs service is unavailable.'}
          </p>
          <button type="button" className="retry" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const jobData = job as Job;
  const recommendedAssessment = jobData.recommendedAssessment || null;
  const uniqueSkills = dedupeSkills(jobData.skills);
  const location = formatLocation(jobData);
  const workMode = formatWorkMode(jobData);
  const jobType = jobData.employmentType ? formatJobType(jobData.employmentType) : '';
  const experience = formatExperience(jobData);
  const postedDate = formatPostedDate(jobData.postedAt);
  const salary = jobData.salary?.trim() || '';
  const salaryLabel = salary || 'Not specified';

  const jobForSave = {
    id: jobData.id || id,
    title: jobData.title || 'Job Title',
    company: jobData.company || 'Company',
    companyLogo: jobData.companyLogo,
    location: jobData.location,
    salary: jobData.salary,
    employmentType: jobData.employmentType,
    remote: jobData.remote,
    skills: jobData.skills,
  };

  const jobForApply = {
    ...jobForSave,
    id: jobData.id || id,
    applyUrl: jobData.applyUrl,
  };

  const requestApply = () => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      setAuthPrompt('apply');
      return;
    }
    if (role !== 'candidate') {
      setAuthPrompt('incompatible');
      return;
    }
    openApply(jobForApply);
  };

  return (
    <div className="ct-job-detail">
      <div className="shell layout">
        {notice ? (
          <p className="notice" role="status">
            {notice}
          </p>
        ) : null}
        {applyError ? (
          <p className="alert" role="alert">
            {applyError}
          </p>
        ) : null}
        <div className="main">
          <div className="content">
            <header className="hero">
              <CompanyMark name={jobData.company} logo={jobData.companyLogo} />
              <div className="hero-content">
                <h1>{jobData.title || 'Job Title'}</h1>
                <p className="company">
                  <Building2 size={14} aria-hidden />
                  {jobData.company || 'Company'}
                </p>
                <div className="meta">
                  {location ? (
                    <span>
                      <MapPin size={13} aria-hidden />
                      {location}
                    </span>
                  ) : null}
                  {workMode ? (
                    <span>
                      <Building2 size={13} aria-hidden />
                      {workMode}
                    </span>
                  ) : null}
                  {jobType ? (
                    <span>
                      <Briefcase size={13} aria-hidden />
                      {jobType}
                    </span>
                  ) : null}
                  {experience ? (
                    <span>
                      <ChartNoAxesColumnIncreasing size={13} aria-hidden />
                      {experience}
                    </span>
                  ) : null}
                </div>
                {salary ? <p className="salary">{salary}</p> : null}
              </div>
              <SaveJobButton job={jobForSave} appearance="board" />
            </header>

            {recommendedAssessment ? (
              <JobRecommendedAssessment
                assessment={recommendedAssessment}
                detailsOpen={assessmentDetailsOpen}
                onDetailsOpenChange={setAssessmentDetailsOpen}
              />
            ) : null}

            <section className="card">
              <h2>About the role</h2>
              {jobData.description ? (
                <JobDescriptionHtml html={jobData.description} className="detail-copy" />
              ) : (
                <p className="muted">No role description has been provided.</p>
              )}
            </section>

            {jobData.responsibilities ? (
              <section className="card">
                <h2>Key responsibilities</h2>
                <JobDescriptionHtml html={jobData.responsibilities} className="detail-copy" />
              </section>
            ) : null}

            {jobData.qualificationsText ? (
              <section className="card">
                <h2>Requirements</h2>
                <JobDescriptionHtml html={jobData.qualificationsText} className="detail-copy" />
              </section>
            ) : null}

            {uniqueSkills.length ? (
              <section className="card">
                <h2>Skills</h2>
                <div className="skills">
                  {uniqueSkills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </section>
            ) : null}

            {jobData.benefits?.length ? (
              <section className="card">
                <h2>Benefits</h2>
                <ul className="benefits">
                  {jobData.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="sidebar">
            <section className="card apply-card">
              <button type="button" className="apply-now" onClick={requestApply}>
                Apply now <ArrowRight size={15} aria-hidden />
              </button>
              {jobData.openings ? (
                <p>
                  {jobData.openings} {jobData.openings === 1 ? 'position' : 'positions'} available
                </p>
              ) : null}
            </section>

            <section className="card overview">
              <h2>Job overview</h2>
              <div className="overview-list">
                {postedDate ? (
                  <div>
                    <CalendarDays aria-hidden />
                    <span>Posted on</span>
                    <strong>{postedDate}</strong>
                  </div>
                ) : null}
                {jobType ? (
                  <div>
                    <Briefcase aria-hidden />
                    <span>Job type</span>
                    <strong>{jobType}</strong>
                  </div>
                ) : null}
                {experience ? (
                  <div>
                    <ChartNoAxesColumnIncreasing aria-hidden />
                    <span>Experience</span>
                    <strong>{experience}</strong>
                  </div>
                ) : null}
                {location ? (
                  <div>
                    <MapPin aria-hidden />
                    <span>Location</span>
                    <strong>{[location, workMode].filter(Boolean).join(' · ')}</strong>
                  </div>
                ) : null}
                <div>
                  <Wallet aria-hidden />
                  <span>Salary</span>
                  <strong>{salaryLabel}</strong>
                </div>
                {jobData.department ? (
                  <div>
                    <Building2 aria-hidden />
                    <span>Department</span>
                    <strong>{jobData.department}</strong>
                  </div>
                ) : null}
                {jobData.openings ? (
                  <div>
                    <Users aria-hidden />
                    <span>Openings</span>
                    <strong>{jobData.openings}</strong>
                  </div>
                ) : null}
                {jobData.jobReferenceId ? (
                  <div>
                    <span className="overview-spacer" />
                    <span>Reference</span>
                    <strong>{jobData.jobReferenceId}</strong>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
      <ApplyWithResumeDialog
        open={Boolean(applyJob)}
        onOpenChange={(open) => {
          if (!open) closeApply();
        }}
        jobTitle={applyJob?.title || jobData.title || 'Role'}
        company={applyJob?.company || jobData.company}
        resumes={resumes}
        defaultResumeId={defaultResumeId}
        profileResumeId={profileResumeId}
        submitting={submitting}
        onSubmit={(resumeId) => void submitApply(resumeId)}
        onCreateResume={createResume}
      />
      <JobAuthDialog
        open={Boolean(authPrompt)}
        mode={authPrompt || 'apply'}
        job={jobForSave}
        onOpenChange={(open) => {
          if (!open) setAuthPrompt(null);
        }}
      />
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="ct-job-detail">
          <div className="shell">
            <p className="muted">Loading job…</p>
          </div>
        </div>
      }
    >
      <JobDetailContent />
    </Suspense>
  );
}
