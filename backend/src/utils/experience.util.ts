interface WorkExperienceInput {
  startDate?: string | Date;
  endDate?: string | Date;
  currentlyWorking?: boolean;
  current?: boolean;
}

export function calculateTotalExperienceYears(workExperiences: WorkExperienceInput[]): number {
  if (!workExperiences?.length) return 0;

  let totalMonths = 0;

  for (const exp of workExperiences) {
    if (!exp.startDate) continue;

    const start = new Date(exp.startDate);
    const isCurrent = exp.currentlyWorking ?? exp.current ?? false;
    const end = isCurrent ? new Date() : exp.endDate ? new Date(exp.endDate) : new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

    const diffMonths = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    totalMonths += diffMonths;
  }

  return Math.round((totalMonths / 12) * 10) / 10;
}
