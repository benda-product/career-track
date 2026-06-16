import { ApplicationStage } from '../types';

const ATS_STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  assessment: 'Assessment',
  shortlisted: 'Shortlisted',
  interview_round_1: 'Interview Round 1',
  interview_round_2: 'Interview Round 2',
  final_interview: 'Final Interview',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  offer_sent: 'Offer Sent',
  offer_accepted: 'Offer Accepted',
  offer_released: 'Offer Released',
  selected: 'Selected',
  hired: 'Hired',
  rejected: 'Rejected',
  on_hold: 'On Hold',
};

const ATS_TO_CAREER_TRACK: Record<string, ApplicationStage> = {
  applied: 'applied',
  screening: 'screening',
  assessment: 'screening',
  shortlisted: 'shortlisted',
  interview_round_1: 'interview',
  interview_round_2: 'interview',
  final_interview: 'interview',
  interview_scheduled: 'interview',
  interview_completed: 'interview',
  offer_sent: 'offer',
  offer_accepted: 'offer',
  offer_released: 'offer',
  selected: 'offer',
  hired: 'hired',
  rejected: 'rejected',
  on_hold: 'screening',
};

export function mapAtsStageToCareerTrack(atsStage: string): ApplicationStage {
  const key = String(atsStage || '').toLowerCase().trim();
  return ATS_TO_CAREER_TRACK[key] || 'applied';
}

export function formatAtsStageLabel(atsStage: string): string {
  const key = String(atsStage || '').toLowerCase().trim();
  return ATS_STAGE_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
