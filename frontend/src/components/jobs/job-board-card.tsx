'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Briefcase, Building2, ChartNoAxesColumnIncreasing, MapPin } from 'lucide-react';
import { SaveJobButton } from '@/components/jobs/save-job-button';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { useAuthStore } from '@/store/auth.store';
import type { Job } from '@/types';
import '@/styles/job-board.css';

function companyInitials(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function jobTypeLabel(value?: string) {
  const key = String(value || '').toLowerCase().replace(/[\s-]/g, '_');
  const labels: Record<string, string> = {
    full_time: 'Full-Time',
    fulltime: 'Full-Time',
    part_time: 'Part-Time',
    parttime: 'Part-Time',
    internship: 'Internship',
    intern: 'Internship',
    contract: 'Contract',
    contractor: 'Contract',
  };
  return labels[key] || 'Full-Time';
}

export function workModeLabel(job: Job) {
  if (job.remote) return 'Remote';
  if (job.hybrid) return 'Hybrid';
  return 'On-Site';
}

export function experienceLabel(job: Job) {
  const level = String(job.experienceLevel || '').toLowerCase();
  if (level.includes('entry') || level.includes('fresher') || level.includes('junior')) return 'Entry Level';
  if (/(^|[^0-9])1\s*[-–to]+\s*3/.test(level)) return '1–3 Years';
  if (/(^|[^0-9])3\s*[-–to]+\s*5/.test(level)) return '3–5 Years';
  if (level.includes('5+') || level.includes('senior') || level.includes('lead')) return '5+ Years';
  const years = job.minExperience;
  if (years == null && !level) return 'Entry Level';
  if ((years ?? 0) < 1) return 'Entry Level';
  if ((years ?? 0) < 3) return '1–3 Years';
  if ((years ?? 0) < 5) return '3–5 Years';
  return '5+ Years';
}

export function postedLabel(iso?: string) {
  if (!iso) return 'Posted recently';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (Number.isNaN(days) || days <= 0) return 'Posted Today';
  if (days === 1) return 'Posted 1 Day Ago';
  return `Posted ${days} Days Ago`;
}

function salaryLabel(job: Job) {
  return job.salary?.trim() || 'Salary on request';
}

function CompanyMark({ name, logo }: { name?: string; logo?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="company-logo" aria-hidden="true">
      <span>{companyInitials(name)}</span>
      {logo && !failed ? <img src={logo} alt="" onError={() => setFailed(true)} /> : null}
    </div>
  );
}

type Props = {
  job: Job;
  onApply: (job: Job) => void;
  note?: string;
};

export function JobBoardCard({ job, onApply, note }: Props) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);
  const { isSaved, unsaveJob, isToggling } = useSavedJobs();
  const saved = isAuthenticated && role === 'candidate' && isSaved(job.id);
  const removing = isToggling(job.id);

  return (
    <article className="job-card">
      <div className="job-top">
        <div className="job-heading">
          <CompanyMark name={job.company} logo={job.companyLogo} />
          <div>
            <h2 className="job-title">
              <Link href={`/jobs/${job.id}`}>{job.title || 'Job Title'}</Link>
            </h2>
            <p className="job-company">{job.company || 'Company'}</p>
          </div>
        </div>
        <SaveJobButton job={job} appearance="board" />
      </div>
      <div className="job-meta">
        <span>
          <MapPin className="meta-icon" size={16} aria-hidden="true" />
          {job.location || 'Location not listed'}
        </span>
        <span className="meta-divider" />
        <span>
          <Building2 className="meta-icon" size={16} aria-hidden="true" />
          {workModeLabel(job)}
        </span>
        <span className="meta-divider" />
        <span>
          <Briefcase className="meta-icon" size={16} aria-hidden="true" />
          {jobTypeLabel(job.employmentType)}
        </span>
        <span className="meta-divider" />
        <span>
          <ChartNoAxesColumnIncreasing className="meta-icon" size={16} aria-hidden="true" />
          {experienceLabel(job)}
        </span>
      </div>
      <p className="job-salary">{salaryLabel(job)}</p>
      {job.skills?.length ? (
        <div className="job-skills">
          {job.skills.slice(0, 4).map((skill) => (
            <span className="job-skill" key={skill}>
              {skill}
            </span>
          ))}
        </div>
      ) : null}
      <div className="job-bottom">
        <div className="job-actions">
          <button
            type="button"
            className="view-job"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onApply(job);
            }}
          >
            Apply Now <span>→</span>
          </button>
          {saved ? (
            <button
              type="button"
              className="remove-job"
              disabled={removing}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void unsaveJob(job.id);
              }}
            >
              {removing ? 'Removing…' : 'Remove'}
            </button>
          ) : null}
        </div>
        <span className="posted-date">
          {note ? <span className="job-note">{note}</span> : null}
          {postedLabel(job.postedAt)}
        </span>
      </div>
    </article>
  );
}

export function JobBoardList({ children }: { children: ReactNode }) {
  return (
    <div className="ct-job-board ct-job-board--list">
      <div className="job-list">{children}</div>
    </div>
  );
}
