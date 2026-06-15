'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, ClipboardCheck, Loader2, PlayCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { skillCheckService, SkillCheckSummary, SkillCheckAssignmentItem } from '@/services/skillCheck.service';
import { SKILL_TEST_URL } from '@/constants';

export default function SkillCheckPage() {
  const [summary, setSummary] = useState<SkillCheckSummary | null>(null);
  const [assignments, setAssignments] = useState<SkillCheckAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      const [data, pending] = await Promise.all([
        skillCheckService.getSummary(),
        skillCheckService.getAssignments(),
      ]);
      setSummary(data);
      setAssignments(pending.filter((row) => row.status === 'assigned'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skill check data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await skillCheckService.refreshFromPlatform();
      setSummary(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh from Benda Test Platform');
    } finally {
      setRefreshing(false);
    }
  };

  const openAction = (action: 'take' | 'my-tests' | 'certificates', targetPath?: string) => {
    const returnUrl = `${window.location.origin}/skill-check`;
    if (targetPath) {
      skillCheckService
        .getSsoRedirect({ returnUrl, targetPath })
        .then((session) => {
          window.location.href = session.url;
        })
        .catch((err: Error) => setError(err.message || 'Failed to open Benda Test Platform'));
      return;
    }
    skillCheckService
      .openInSkillTest({ action, returnUrl })
      .catch((err: Error) => setError(err.message || 'Failed to open Benda Test Platform'));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Check"
        description="Take skill assessments on Benda Test Platform. Results and certificates sync to your profile."
        action={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync results
          </Button>
        }
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {assignments.length ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="font-semibold">Assigned by recruiter</h3>
          <ul className="mt-3 space-y-2">
            {assignments.map((assignment) => (
              <li
                key={assignment._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm"
              >
                <span>
                  {assignment.category} ({assignment.level})
                  {assignment.recruiterName ? ` · from ${assignment.recruiterName}` : ''}
                </span>
                <Button size="sm" onClick={() => openAction('take', assignment.targetPath)}>
                  Start test
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => openAction('take')}
          className="rounded-xl border border-border/60 bg-card p-5 text-left transition hover:border-primary/40 hover:shadow-sm"
        >
          <PlayCircle className="mb-3 h-8 w-8 text-primary" />
          <h3 className="font-semibold">Take Test</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Open Benda Test Platform to start a skill assessment.
          </p>
        </button>

        <button
          type="button"
          onClick={() => openAction('my-tests')}
          className="rounded-xl border border-border/60 bg-card p-5 text-left transition hover:border-primary/40 hover:shadow-sm"
        >
          <ClipboardCheck className="mb-3 h-8 w-8 text-primary" />
          <h3 className="font-semibold">My Tests</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            View your test history and scores on Benda Test Platform.
          </p>
        </button>

        <button
          type="button"
          onClick={() => openAction('certificates')}
          className="rounded-xl border border-border/60 bg-card p-5 text-left transition hover:border-primary/40 hover:shadow-sm"
        >
          <Award className="mb-3 h-8 w-8 text-primary" />
          <h3 className="font-semibold">Certificates</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Access certificates earned from passed assessments.
          </p>
        </button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-5">
        <h3 className="font-semibold">Synced to your profile</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Recruiters can view your verified scores, skills, and certificates from Career Track.
        </p>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading synced results…
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium">Test results</h4>
              {summary?.skillAssessments?.length ? (
                <ul className="mt-2 space-y-2">
                  {summary.skillAssessments.map((test) => (
                    <li
                      key={test.bendaTestId}
                      className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
                    >
                      <span>
                        {test.category} ({test.level})
                      </span>
                      <span className={test.passed ? 'text-green-600' : 'text-muted-foreground'}>
                        {test.percentage}% {test.passed ? '· Passed' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No synced test results yet.</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium">Certificates</h4>
              {summary?.certifications?.length ? (
                <ul className="mt-2 space-y-2">
                  {summary.certifications.map((cert) => (
                    <li
                      key={`${cert.name}-${cert.credentialId || cert.issueDate}`}
                      className="rounded-lg border border-border/50 px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-muted-foreground">{cert.issuingOrganization}</p>
                      {cert.credentialId ? (
                        <Link
                          href={`${SKILL_TEST_URL}/verify-certificate`}
                          target="_blank"
                          className="text-xs text-primary hover:underline"
                        >
                          Verify certificate
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No certificates synced yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
