'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search } from 'lucide-react';
import { ApplyWithResumeDialog } from '@/components/jobs/apply-with-resume-dialog';
import { JobAuthDialog } from '@/components/jobs/job-auth-dialog';
import { experienceLabel, JobBoardCard, jobTypeLabel, postedLabel, workModeLabel } from '@/components/jobs/job-board-card';
import { useJobApply } from '@/hooks/use-job-apply';
import { jobsService } from '@/services/jobs.service';
import { recommendedJobsService } from '@/services/recommendedJobs.service';
import { normalizeJobsPayload } from '@/utils/jobs';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { useAuthStore } from '@/store/auth.store';
import type { Job } from '@/types';
import '@/styles/job-board.css';

const TABS = ['All Jobs', 'Recommended', 'Recently Added', 'Remote', 'Hybrid'];
const PAGE_SIZE = 3;
const DEPARTMENTS = [
  'Engineering',
  'Development',
  'IT',
  'Product',
  'HR',
  'Sales',
  'Finance',
  'Marketing',
  'Operations',
  'Customer Success',
  'Legal',
  'Cloud & Infrastructure',
  'Infrastructure & Platform Engineering',
  'Product Management',
];
const JOB_TYPES = ['Full-Time', 'Part-Time', 'Internship', 'Contract'];
const WORK_MODES = ['On-Site', 'Remote', 'Hybrid'];
const EXPERIENCE_LEVELS = ['Entry Level', '1–3 Years', '3–5 Years', '5+ Years'];

type FilterGroup = { title: string; options: string[] };

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosErr = error as { response?: { data?: { message?: string } }; message?: string };
  const message = axiosErr.response?.data?.message || axiosErr.message;
  if (message && !/^Request failed with status code \d+$/.test(message)) return message;
  return fallback;
}

const MARKET_STORAGE_KEY = 'ct_job_market';

function defaultJobMarket(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(MARKET_STORAGE_KEY);
      if (stored === 'all' || stored === '') return '';
      if (stored) return stored;
    } catch {
      // ignore
    }
  }
  if (typeof Intl === 'undefined') return '';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'IN';
  if (tz.startsWith('America/')) return 'US';
  return '';
}

function marketLabel(code?: string | null) {
  const value = String(code || '').toUpperCase();
  if (!value) return '';
  const labels: Record<string, string> = {
    IN: 'India',
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    AE: 'UAE',
    SG: 'Singapore',
    AU: 'Australia',
    GLOBAL: 'Worldwide',
  };
  return labels[value] || value;
}

function JobsContent() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [market, setMarket] = useState(defaultJobMarket);
  const [activeTab, setActiveTab] = useState('All Jobs');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showSaved, setShowSaved] = useState(false);
  const [page, setPage] = useState(1);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [notice, setNotice] = useState('');
  const [authPrompt, setAuthPrompt] = useState<{ job: Job; mode: 'apply' | 'incompatible' } | null>(null);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);
  const { savedJobs } = useSavedJobs();
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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['jobs', 'board', market || 'all'],
    queryFn: () =>
      jobsService.searchJobs({
        limit: 100,
        market: market || 'all',
      }),
    retry: 1,
  });

  const recommendedQuery = useQuery({
    queryKey: ['jobs-board-recommended', market || 'all'],
    queryFn: () => recommendedJobsService.getRecommendedJobs(1, 50, market || 'all'),
    enabled: role === 'candidate',
    retry: false,
  });

  const catalog = useMemo(() => normalizeJobsPayload(data?.data), [data]);
  const recommendedJobs = recommendedQuery.data?.items || [];
  const recommendedIds = useMemo(() => new Set(recommendedJobs.map((job) => job.id)), [recommendedJobs]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('saved') !== '1') return;
    setNotice('Job saved successfully.');
    params.delete('saved');
    params.delete('jobId');
    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', next);
  }, []);

  const sourceJobs = useMemo(() => {
    const byId = new Map(catalog.map((job) => [job.id, job]));
    if (activeTab === 'Recommended') {
      for (const job of recommendedJobs) {
        if (job.id && !byId.has(job.id)) byId.set(job.id, job);
      }
    }
    if (showSaved) {
      for (const job of savedJobs) {
        if (job.id && !byId.has(job.id)) byId.set(job.id, job);
      }
    }
    return [...byId.values()];
  }, [activeTab, catalog, recommendedJobs, savedJobs, showSaved]);

  const filterGroups: FilterGroup[] = useMemo(() => {
    const posted = [...new Set(sourceJobs.map((job) => job.department || '').filter(Boolean))];
    const departments = [
      ...DEPARTMENTS,
      ...posted.filter((department) => !DEPARTMENTS.includes(department)),
    ];
    return [
      { title: 'Department', options: departments },
      { title: 'Job Type', options: JOB_TYPES },
      { title: 'Work Mode', options: WORK_MODES },
      { title: 'Experience', options: EXPERIENCE_LEVELS },
    ];
  }, [sourceJobs]);

  const filteredJobs = useMemo(() => {
    let result = [...sourceJobs];
    const keyword = query.trim().toLowerCase();
    if (keyword) {
      result = result.filter((job) =>
        [job.title, job.company, job.department, ...(job.skills || [])].join(' ').toLowerCase().includes(keyword)
      );
    }
    const place = location.trim().toLowerCase();
    if (place) {
      result = result.filter((job) => (job.location || '').toLowerCase().includes(place));
    }
    if (!showSaved) {
      if (activeTab === 'Recommended') result = result.filter((job) => recommendedIds.has(job.id));
      if (activeTab === 'Recently Added') {
        result = result.filter((job) => ['Posted Today', 'Posted 1 Day Ago'].includes(postedLabel(job.postedAt)));
      }
      if (activeTab === 'Remote') result = result.filter((job) => workModeLabel(job) === 'Remote');
      if (activeTab === 'Hybrid') result = result.filter((job) => workModeLabel(job) === 'Hybrid');
    }
    for (const group of filterGroups) {
      const selected = filters[group.title] ?? [];
      if (selected.length === 0) continue;
      result = result.filter((job) => {
        if (group.title === 'Department') return selected.includes(job.department || 'General');
        if (group.title === 'Job Type') return selected.includes(jobTypeLabel(job.employmentType));
        if (group.title === 'Work Mode') return selected.includes(workModeLabel(job));
        if (group.title === 'Experience') return selected.includes(experienceLabel(job));
        return true;
      });
    }
    if (showSaved) {
      const savedIds = new Set(savedJobs.map((job) => job.id));
      result = result.filter((job) => savedIds.has(job.id));
    }
    return result;
  }, [sourceJobs, query, location, showSaved, activeTab, recommendedIds, filterGroups, filters, savedJobs]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeFilterCount = Object.values(filters).reduce((total, selected) => total + selected.length, 0);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((number) => number <= 3 || number === currentPage || number === totalPages)
    .reduce<(number | '...')[]>((result, number, index, numbers) => {
      if (index > 0 && number - numbers[index - 1] > 1) result.push('...');
      result.push(number);
      return result;
    }, []);

  const toggleFilter = (group: string, option: string) => {
    setFilters((previous) => {
      const current = previous[group] ?? [];
      const updated = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return { ...previous, [group]: updated };
    });
    setPage(1);
  };

  const requestApply = (job: Job) => {
    if (!hasHydrated || !job.id) return;
    if (!isAuthenticated) {
      setAuthPrompt({ job, mode: 'apply' });
      return;
    }
    if (role !== 'candidate') {
      setAuthPrompt({ job, mode: 'incompatible' });
      return;
    }
    openApply(job);
  };

  const resetFilters = () => {
    setFilters({});
    setQuery('');
    setLocation('');
    setActiveTab('All Jobs');
    setShowSaved(false);
    setPage(1);
  };

  return (
    <div className="ct-job-board">
      <section className="search-area">
        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
          }}
        >
          <label className="search-field">
            <Search className="search-field-icon" size={18} aria-hidden="true" />
            <input
              className="search-input"
              aria-label="Search jobs"
              placeholder="Search job title, skills or keywords"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="search-field">
            <MapPin className="search-field-icon" size={18} aria-hidden="true" />
            <input
              className="search-input"
              aria-label="Job location"
              placeholder="Location"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="search-field">
            <select
              className="search-input"
              aria-label="Job market"
              value={market}
              onChange={(event) => {
                const next = event.target.value;
                setMarket(next);
                try {
                  window.localStorage.setItem(MARKET_STORAGE_KEY, next || 'all');
                } catch {
                  // ignore
                }
                setPage(1);
              }}
            >
              <option value="">All markets</option>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AE">UAE</option>
              <option value="SG">Singapore</option>
              <option value="AU">Australia</option>
            </select>
          </label>
          <button className="search-button" type="submit">
            Search
          </button>
        </form>
        <nav className="tabs" aria-label="Job categories">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab && !showSaved ? 'active' : ''}`}
              aria-pressed={activeTab === tab && !showSaved}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setShowSaved(false);
                setPage(1);
              }}
            >
              {tab}
            </button>
          ))}
          <button
            className={`tab ${showSaved ? 'active' : ''}`}
            aria-pressed={showSaved}
            type="button"
            onClick={() => {
              setShowSaved((previous) => !previous);
              setPage(1);
            }}
          >
            Saved ({savedJobs.length})
          </button>
        </nav>
      </section>

      <section className="results-area">
        {isError ? (
          <div className="board-error" role="alert">
            <p>Unable to load jobs from Talent.</p>
            <p>{getApiErrorMessage(error, 'Please confirm Talent and Career Track are running, then retry.')}</p>
            <button type="button" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : null}
        <div className="results-top">{showSaved ? 'Saved Jobs' : `${filteredJobs.length} Open Positions`}</div>
        <button
          className="mobile-filter-toggle"
          type="button"
          onClick={() => setMobileFilters((previous) => !previous)}
          aria-expanded={mobileFilters}
        >
          Filters ({activeFilterCount})
          <span>{mobileFilters ? '−' : '+'}</span>
        </button>
        <div className="results-layout">
          <aside className={`filter-panel ${mobileFilters ? 'mobile-open' : ''}`}>
            <div className="filter-header">
              <h2>FILTERS</h2>
              <button type="button" onClick={resetFilters}>
                {activeFilterCount ? `Applied (${activeFilterCount})` : 'Clear All'}
              </button>
            </div>
            {filterGroups.map((group) => (
              <div className="filter-group" key={group.title}>
                <button
                  className="filter-group-heading"
                  type="button"
                  aria-expanded={!collapsed[group.title]}
                  onClick={() =>
                    setCollapsed((previous) => ({
                      ...previous,
                      [group.title]: !previous[group.title],
                    }))
                  }
                >
                  {group.title}
                  <span className={`chevron ${collapsed[group.title] ? 'closed' : ''}`} />
                </button>
                {!collapsed[group.title]
                  ? group.options.map((option) => (
                      <label className="filter-option" key={option}>
                        <input
                          type="checkbox"
                          checked={(filters[group.title] ?? []).includes(option)}
                          onChange={() => toggleFilter(group.title, option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))
                  : null}
              </div>
            ))}
          </aside>
          <div className="job-list">
            {notice ? (
              <p className="notice" role="status">
                {notice}
              </p>
            ) : null}
            {applyError ? (
              <p className="board-error" role="alert">
                {applyError}
              </p>
            ) : null}
            {isLoading ? (
              <div className="status-state">
                <h2>Loading open roles</h2>
                <p>
                  Fetching Career Track–approved jobs
                  {market ? ` in ${marketLabel(market)}` : ' across all markets'}.
                </p>
              </div>
            ) : visibleJobs.length > 0 ? (
              visibleJobs.map((job) => (
                <JobBoardCard key={job.id} job={job} onApply={requestApply} />
              ))
            ) : (
              <div className="empty-state">
                <h3>No jobs found</h3>
                <p>Try a different search or clear your filters.</p>
                <button className="clear-button" type="button" onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
        {!isLoading && filteredJobs.length > 0 ? (
          <div className="pagination">
            <button
              className="page-arrow"
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              aria-label="Previous page"
            >
              ‹
            </button>
            {pageNumbers.map((number, index) =>
              number === '...' ? (
                <button className="page-button" key={`ellipsis-${index}`} type="button" disabled>
                  ...
                </button>
              ) : (
                <button
                  className={`page-button ${currentPage === number ? 'active' : ''}`}
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  aria-current={currentPage === number ? 'page' : undefined}
                >
                  {number}
                </button>
              )
            )}
            <button
              className="page-arrow"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        ) : null}
      </section>
      <ApplyWithResumeDialog
        open={Boolean(applyJob)}
        onOpenChange={(open) => {
          if (!open) closeApply();
        }}
        jobTitle={applyJob?.title || 'Role'}
        company={applyJob?.company}
        resumes={resumes}
        defaultResumeId={defaultResumeId}
        profileResumeId={profileResumeId}
        submitting={submitting}
        onSubmit={(resumeId) => void submitApply(resumeId)}
        onCreateResume={createResume}
      />
      <JobAuthDialog
        open={Boolean(authPrompt)}
        mode={authPrompt?.mode || 'apply'}
        job={authPrompt?.job || null}
        onOpenChange={(open) => {
          if (!open) setAuthPrompt(null);
        }}
      />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="ct-job-board">
          <section className="results-area">
            <div className="status-state">
              <h2>Loading open roles</h2>
              <p>Fetching jobs published on Talent.</p>
            </div>
          </section>
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
