'use client';

import { Badge } from '@/components/ui/badge';
import { JobDescriptionHtml } from '@/components/jobs/job-description-html';
import { dedupeSkills, hasJobDescriptionContent } from '@/lib/job-content';
import type { Job } from '@/types';

type JobDetail = Pick<
  Job,
  | 'description'
  | 'responsibilities'
  | 'qualificationsText'
  | 'benefits'
  | 'skills'
>;

type Props = {
  job: JobDetail;
  showSkills?: boolean;
};

export function JobDetailSections({ job, showSkills = true }: Props) {
  const uniqueSkills = dedupeSkills(job.skills);

  if (!hasJobDescriptionContent(job) && !uniqueSkills.length && !job.benefits?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Job description will be loaded from the ATS integration.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {job.description ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">About this role</h3>
          <JobDescriptionHtml html={job.description} />
        </section>
      ) : null}

      {job.benefits?.length ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Benefits</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {job.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {job.responsibilities ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Responsibilities</h3>
          <JobDescriptionHtml html={job.responsibilities} />
        </section>
      ) : null}

      {job.qualificationsText ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Qualifications</h3>
          <JobDescriptionHtml html={job.qualificationsText} />
        </section>
      ) : null}

      {showSkills && uniqueSkills.length ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueSkills.map((skill) => (
              <Badge key={skill} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
