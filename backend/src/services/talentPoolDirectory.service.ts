import mongoose, { PipelineStage } from 'mongoose';
import { User, IUser } from '../modules/auth/user.model';
import { Profile, IProfile } from '../modules/profile/profile.model';
import { toCandidateProfileView } from '../modules/profile/profile.mapper';

/**
 * Read-only view of Career Track job seekers for the Talent Desk talent pool.
 * Data stays in this database; Talent Desk queries it per search.
 * Candidates who turned off "open to work" are not listed.
 */

const MAX_LIMIT = 1000;

export interface TalentPoolFilters {
  keyword?: string;
  skills?: string;
  skill?: string;
  location?: string;
  experience?: string;
  education?: string;
  noticePeriod?: string;
  employmentStatus?: string;
  page?: string | number;
  limit?: string | number;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function contains(value: string) {
  return new RegExp(escapeRegex(String(value).trim()), 'i');
}

function parseExperienceRange(value?: string): { min?: number; max?: number } | null {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.startsWith('10+')) return { min: 10 };
  const range = raw.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const num = Number(raw);
  return Number.isNaN(num) ? null : { min: num };
}

function parseNoticeMax(value?: string): number | undefined {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return undefined;
  if (raw === 'immediate' || raw === '0') return 0;
  const num = parseInt(raw.replace(/\D/g, ''), 10);
  return Number.isNaN(num) ? undefined : num;
}

function buildProfileMatch(filters: TalentPoolFilters): Record<string, unknown>[] {
  const and: Record<string, unknown>[] = [{ 'p.openToWork': { $ne: false } }];

  if (filters.keyword) {
    const pattern = contains(filters.keyword);
    and.push({
      $or: [
        { firstName: pattern },
        { lastName: pattern },
        { email: pattern },
        { 'p.headline': pattern },
        { 'p.designation': pattern },
        { 'p.currentCompany': pattern },
        { 'p.skills.name': pattern },
        { 'p.technicalSkills': pattern },
      ],
    });
  }

  const skillPatterns = String(filters.skills || filters.skill || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(contains);
  if (skillPatterns.length) {
    and.push({
      $or: skillPatterns.flatMap((pattern) => [
        { 'p.skills.name': pattern },
        { 'p.technicalSkills': pattern },
        { 'p.softSkills': pattern },
        { 'p.majorSkill': pattern },
      ]),
    });
  }

  if (filters.location) {
    const pattern = contains(filters.location);
    and.push({
      $or: [
        { 'p.location': pattern },
        { 'p.locationDetail.city': pattern },
        { 'p.locationDetail.state': pattern },
        { 'p.locationDetail.country': pattern },
        { 'p.careerPreferences.desiredLocations': pattern },
      ],
    });
  }

  if (filters.education) {
    and.push({ 'p.education.degree': contains(filters.education) });
  }

  const range = parseExperienceRange(filters.experience);
  if (range) {
    const cond: Record<string, number> = {};
    if (range.min !== undefined) cond.$gte = range.min;
    if (range.max !== undefined) cond.$lte = range.max;
    and.push({ experienceYears: cond });
  }

  const noticeMax = parseNoticeMax(filters.noticePeriod);
  if (noticeMax !== undefined) {
    and.push(
      noticeMax === 0
        ? { $or: [{ 'p.noticePeriodDays': 0 }, { 'p.noticePeriodDays': null }] }
        : { 'p.noticePeriodDays': { $lte: noticeMax } }
    );
  }

  if (filters.employmentStatus) {
    and.push({ employmentStatus: String(filters.employmentStatus).trim().toLowerCase() });
  }

  return and;
}

function toSummary(user: IUser, profile: IProfile) {
  const view = toCandidateProfileView(user, profile);
  return {
    source: 'career-track' as const,
    sourceId: String(user._id),
    name: view.fullName,
    email: String(user.email || '').toLowerCase(),
    skills: view.skills || [],
    experienceYears: Number(view.totalExperienceYears) || 0,
    location: view.locationText || [view.location?.city, view.location?.state, view.location?.country]
      .filter(Boolean)
      .join(', '),
    education: view.educations?.[0]?.degree || '',
    designation: view.designation || '',
    currentCompany: view.currentCompany || '',
    employmentStatus: view.employmentStatus || 'open_to_opportunities',
    noticePeriodDays: view.noticePeriodDays ?? null,
    skillAssessments: view.skillAssessments || [],
    updatedAt: (profile as unknown as { updatedAt?: Date }).updatedAt || (user as unknown as { updatedAt?: Date }).updatedAt || null,
    view,
  };
}

/** Profiles are created lazily, so fall back to an unsaved default instead of writing one. */
function profileFor(user: IUser, profiles: Map<string, IProfile>) {
  return profiles.get(String(user._id)) || new Profile({ userId: user._id });
}

export async function searchTalentPool(filters: TalentPoolFilters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(Math.max(1, Number(filters.limit) || 50), MAX_LIMIT);

  const pipeline: PipelineStage[] = [
    { $match: { role: 'candidate', isActive: { $ne: false } } },
    {
      $lookup: {
        from: Profile.collection.collectionName,
        localField: '_id',
        foreignField: 'userId',
        as: 'p',
      },
    },
    { $set: { p: { $first: '$p' } } },
    {
      $set: {
        experienceYears: { $ifNull: ['$p.totalExperienceYears', 0] },
        employmentStatus: { $ifNull: ['$p.employmentStatus', 'open_to_opportunities'] },
        sortAt: { $ifNull: ['$p.updatedAt', '$updatedAt'] },
      },
    },
    { $match: { $and: buildProfileMatch(filters) } },
    { $sort: { sortAt: -1, _id: 1 } },
    {
      $facet: {
        total: [{ $count: 'n' }],
        ids: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: { _id: 1 } }],
      },
    },
  ];

  const [result] = await User.aggregate<{ total: { n: number }[]; ids: { _id: mongoose.Types.ObjectId }[] }>(
    pipeline
  );
  const ids = (result?.ids || []).map((row) => row._id);
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: ids } }),
    Profile.find({ userId: { $in: ids } }),
  ]);
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const profileByUser = new Map(profiles.map((p) => [String(p.userId), p]));

  const candidates = ids
    .map((id) => userById.get(String(id)))
    .filter((user): user is NonNullable<typeof user> => Boolean(user))
    .map((user) => {
      const { view: _view, ...summary } = toSummary(user, profileFor(user, profileByUser));
      return summary;
    });

  return { candidates, total: result?.total?.[0]?.n || 0, page, limit };
}

export async function getTalentPoolCandidate(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  const user = await User.findOne({ _id: id, role: 'candidate', isActive: { $ne: false } });
  if (!user) return null;
  const profile = (await Profile.findOne({ userId: user._id })) || new Profile({ userId: user._id });
  if (profile.openToWork === false) return null;

  const { view, ...summary } = toSummary(user, profile);
  return {
    ...summary,
    phone: view.phone || view.phoneNumber || '',
    preferredLocations: profile.careerPreferences?.desiredLocations || [],
    workExperiences: view.workExperiences || [],
    educations: view.educations || [],
    certifications: view.certifications || [],
    linkedinProfile: view.linkedinProfile || '',
  };
}
