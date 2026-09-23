import { Types } from 'mongoose';
import { User } from '../auth/user.model';
import { Profile } from '../profile/profile.model';
import { Application } from '../applications/application.model';
import { SavedJob } from '../jobs/savedJob.model';
import { RecentlyViewed } from '../jobs/recentlyViewed.model';
import { Notification } from '../notifications/notification.model';
import { applicationRepository } from '../../repositories/application.repository';
import { jobsService } from '../jobs/jobs.service';
import { ApplicationStage, UserRole } from '../../types';
import { ApiError } from '../../utils/apiError';
import { NormalizedJob } from '../../utils/atsJob.mapper';

const STAGES: ApplicationStage[] = [
  'applied',
  'screening',
  'shortlisted',
  'interview',
  'offer',
  'rejected',
  'hired',
];

const USER_FIELDS =
  'email firstName lastName role avatar isEmailVerified lastLogin isActive subscriptionPlan createdAt';

type UserLean = {
  _id: Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isEmailVerified?: boolean;
  lastLogin?: Date;
  isActive?: boolean;
  subscriptionPlan?: 'free' | 'pro';
  createdAt?: Date;
};

type ProfileLean = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  headline?: string;
  summary?: string;
  phone?: string;
  location?: string;
  designation?: string;
  currentCompany?: string;
  totalExperienceYears?: number;
  completionScore?: number;
  professionalProfileCompleted?: boolean;
  openToWork?: boolean;
  employmentStatus?: string;
  technicalSkills?: string[];
  softSkills?: string[];
  skills?: { name?: string }[];
  experience?: {
    company?: string;
    title?: string;
    current?: boolean;
    startDate?: Date;
    endDate?: Date;
  }[];
  education?: { institution?: string; degree?: string; field?: string }[];
  linkedinProfile?: string;
  resumeUrl?: string;
  majorSkill?: string;
  updatedAt?: Date;
};

type ApplicationLean = {
  _id: Types.ObjectId;
  userId: Types.ObjectId | UserLean;
  jobId: string;
  jobTitle: string;
  company: string;
  location?: string;
  salary?: string;
  stage: ApplicationStage;
  atsStage?: string;
  appliedAt?: Date;
  notes?: string;
  recruiterFeedback?: string;
  resumeTitle?: string;
  timeline?: { stage?: string; date?: Date; note?: string; updatedBy?: string }[];
  createdAt?: Date;
};

type SavedJobLean = {
  _id: Types.ObjectId;
  userId: Types.ObjectId | UserLean;
  jobId: string;
  jobTitle: string;
  company: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  savedAt?: Date;
};

export type AdminListQuery = {
  search?: string;
  page?: number;
  limit?: number;
  stage?: string;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toIso(value?: Date | string | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function paginate(page = 1, limit = 20) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

function listMeta(total: number, page: number, limit: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function isStage(value: string): value is ApplicationStage {
  return STAGES.includes(value as ApplicationStage);
}

function userName(user?: { firstName?: string; lastName?: string; email?: string } | null) {
  const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  return name || user?.email || 'Candidate';
}

function readUserRef(value: Types.ObjectId | UserLean | undefined): UserLean | null {
  if (!value || value instanceof Types.ObjectId) return null;
  if (typeof value === 'object' && 'email' in value) return value;
  return null;
}

function userIdOf(value: Types.ObjectId | UserLean | undefined) {
  if (!value) return '';
  if (value instanceof Types.ObjectId) return String(value);
  return String(value._id);
}

function profileSnapshot(profile?: ProfileLean | null) {
  if (!profile) return null;
  return {
    headline: profile.headline || '',
    location: profile.location || '',
    designation: profile.designation || '',
    currentCompany: profile.currentCompany || '',
    completionScore: profile.completionScore ?? 0,
    professionalProfileCompleted: Boolean(profile.professionalProfileCompleted),
    openToWork: profile.openToWork !== false,
  };
}

function serializeCandidate(user: UserLean, profile?: ProfileLean | null) {
  return {
    id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    avatar: user.avatar || '',
    isActive: user.isActive !== false,
    isEmailVerified: Boolean(user.isEmailVerified),
    subscriptionPlan: user.subscriptionPlan || 'free',
    lastLogin: toIso(user.lastLogin),
    createdAt: toIso(user.createdAt),
    profile: profileSnapshot(profile),
  };
}

function skillNames(profile: ProfileLean) {
  const fromObjects = (profile.skills || []).map((skill) => skill.name || '').filter(Boolean);
  return [...new Set([...(profile.technicalSkills || []), ...fromObjects])].filter(Boolean);
}

function serializeProfileSummary(profile: ProfileLean, user?: UserLean | null) {
  return {
    id: String(profile._id),
    userId: String(profile.userId),
    candidateName: userName(user),
    email: user?.email || '',
    headline: profile.headline || '',
    summary: profile.summary || '',
    phone: profile.phone || '',
    location: profile.location || '',
    designation: profile.designation || '',
    currentCompany: profile.currentCompany || '',
    totalExperienceYears: profile.totalExperienceYears ?? 0,
    completionScore: profile.completionScore ?? 0,
    professionalProfileCompleted: Boolean(profile.professionalProfileCompleted),
    openToWork: profile.openToWork !== false,
    employmentStatus: profile.employmentStatus || '',
    skills: skillNames(profile).slice(0, 8),
    updatedAt: toIso(profile.updatedAt),
  };
}

function serializeProfileDetail(profile: ProfileLean, user?: UserLean | null) {
  return {
    ...serializeProfileSummary(profile, user),
    skills: skillNames(profile),
    technicalSkills: profile.technicalSkills || [],
    softSkills: profile.softSkills || [],
    linkedinProfile: profile.linkedinProfile || '',
    resumeUrl: profile.resumeUrl || '',
    majorSkill: profile.majorSkill || '',
    experience: (profile.experience || []).map((item) => ({
      company: item.company || '',
      title: item.title || '',
      current: Boolean(item.current),
      startDate: toIso(item.startDate),
      endDate: toIso(item.endDate),
    })),
    education: (profile.education || []).map((item) => ({
      institution: item.institution || '',
      degree: item.degree || '',
      field: item.field || '',
    })),
  };
}

function serializeApplication(application: ApplicationLean) {
  const user = readUserRef(application.userId);
  return {
    id: String(application._id),
    userId: userIdOf(application.userId),
    candidateName: userName(user),
    candidateEmail: user?.email || '',
    jobId: application.jobId,
    jobTitle: application.jobTitle,
    company: application.company,
    location: application.location || '',
    salary: application.salary || '',
    stage: application.stage,
    atsStage: application.atsStage || '',
    appliedAt: toIso(application.appliedAt || application.createdAt),
    notes: application.notes || '',
    recruiterFeedback: application.recruiterFeedback || '',
    resumeTitle: application.resumeTitle || '',
    timeline: (application.timeline || []).map((entry) => ({
      stage: entry.stage || '',
      date: toIso(entry.date),
      note: entry.note || '',
      updatedBy: entry.updatedBy || '',
    })),
  };
}

function serializeSavedJob(job: SavedJobLean) {
  const user = readUserRef(job.userId);
  return {
    id: String(job._id),
    userId: userIdOf(job.userId),
    candidateName: userName(user),
    candidateEmail: user?.email || '',
    jobId: job.jobId,
    jobTitle: job.jobTitle,
    company: job.company,
    location: job.location || '',
    salary: job.salary || '',
    employmentType: job.employmentType || '',
    savedAt: toIso(job.savedAt),
  };
}

function serializeJob(job: NormalizedJob, includeDescription: boolean) {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo || '',
    location: job.location || '',
    salary: job.salary || '',
    employmentType: job.employmentType || '',
    experienceLevel: job.experienceLevel || '',
    remote: Boolean(job.remote),
    hybrid: Boolean(job.hybrid),
    skills: job.skills || [],
    openings: job.openings,
    postedAt: job.postedAt || '',
    department: job.department || '',
    description: includeDescription ? job.description || '' : '',
  };
}

function monthBuckets(count: number) {
  const buckets: { key: string; label: string }[] = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({
      key,
      label: date.toLocaleString('en-US', { month: 'short' }),
    });
  }
  return buckets;
}

async function usersByIds(ids: Types.ObjectId[]) {
  if (!ids.length) return new Map<string, UserLean>();
  const users = await User.find({ _id: { $in: ids } })
    .select(USER_FIELDS)
    .lean<UserLean[]>();
  return new Map(users.map((user) => [String(user._id), user]));
}

async function profilesByUserIds(ids: Types.ObjectId[]) {
  if (!ids.length) return new Map<string, ProfileLean>();
  const profiles = await Profile.find({ userId: { $in: ids } }).lean<ProfileLean[]>();
  return new Map(profiles.map((profile) => [String(profile.userId), profile]));
}

async function matchingUserIds(search: string) {
  const rx = new RegExp(escapeRegex(search), 'i');
  const users = await User.find({
    role: 'candidate',
    $or: [{ email: rx }, { firstName: rx }, { lastName: rx }],
  })
    .select('_id')
    .lean<{ _id: Types.ObjectId }[]>();
  return users.map((user) => user._id);
}

export class AdminService {
  async getOverview() {
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [
      candidates,
      activeCandidates,
      profiles,
      completedProfiles,
      openToWork,
      applications,
      savedJobs,
      notifications,
      stageRows,
      applicationTrend,
      candidateTrend,
      recentApplications,
      recentUsers,
      recentNotifications,
      jobsCatalog,
    ] = await Promise.all([
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'candidate', isActive: { $ne: false } }),
      Profile.countDocuments(),
      Profile.countDocuments({ professionalProfileCompleted: true }),
      Profile.countDocuments({ openToWork: { $ne: false } }),
      Application.countDocuments({ isSaved: { $ne: true } }),
      SavedJob.countDocuments(),
      Notification.countDocuments(),
      Application.aggregate<{ _id: string; count: number }>([
        { $match: { isSaved: { $ne: true } } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      Application.aggregate<{ _id: string; count: number }>([
        { $match: { isSaved: { $ne: true }, appliedAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$appliedAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate<{ _id: string; count: number }>([
        { $match: { role: 'candidate', createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Application.find({ isSaved: { $ne: true } })
        .select('userId jobId jobTitle company location salary stage atsStage appliedAt createdAt')
        .populate('userId', USER_FIELDS)
        .sort({ appliedAt: -1 })
        .limit(6)
        .lean<ApplicationLean[]>(),
      User.find({ role: 'candidate' })
        .select(USER_FIELDS)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<UserLean[]>(),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .lean<{
          _id: Types.ObjectId;
          userId: Types.ObjectId;
          type: string;
          title: string;
          message: string;
          createdAt?: Date;
        }[]>(),
      jobsService.searchCatalog({ page: 1, limit: 1 }).catch(() => null),
    ]);

    const recentProfileMap = await profilesByUserIds(recentUsers.map((user) => user._id));
    const activityUsers = await usersByIds(recentNotifications.map((item) => item.userId));
    const buckets = monthBuckets(6);
    const applicationsByMonth = new Map(applicationTrend.map((row) => [row._id, row.count]));
    const candidatesByMonth = new Map(candidateTrend.map((row) => [row._id, row.count]));
    const byStage = Object.fromEntries(STAGES.map((stage) => [stage, 0])) as Record<string, number>;
    for (const row of stageRows) {
      if (row._id) byStage[row._id] = row.count;
    }

    return {
      counts: {
        candidates,
        activeCandidates,
        profiles,
        completedProfiles,
        applications,
        savedJobs,
        notifications,
        openToWork,
        jobs: jobsCatalog ? (jobsCatalog.total ?? jobsCatalog.jobs.length) : null,
      },
      jobsUnavailable: !jobsCatalog,
      byStage,
      trends: buckets.map((bucket) => ({
        month: bucket.label,
        applications: applicationsByMonth.get(bucket.key) || 0,
        candidates: candidatesByMonth.get(bucket.key) || 0,
      })),
      recentApplications: recentApplications.map(serializeApplication),
      recentCandidates: recentUsers.map((user) =>
        serializeCandidate(user, recentProfileMap.get(String(user._id)))
      ),
      recentActivity: recentNotifications.map((item) => {
        const actor = activityUsers.get(String(item.userId));
        return {
          id: String(item._id),
          kind: item.type,
          title: item.title,
          message: item.message,
          at: toIso(item.createdAt) || new Date().toISOString(),
          href: '/admin/activity',
          actor: actor ? userName(actor) : '',
        };
      }),
    };
  }

  async listCandidates(query: AdminListQuery) {
    const { page, limit, skip } = paginate(query.page, query.limit);
    const filter: Record<string, unknown> = { role: 'candidate' };
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      filter.$or = [{ email: rx }, { firstName: rx }, { lastName: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).select(USER_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<UserLean[]>(),
      User.countDocuments(filter),
    ]);
    const profileMap = await profilesByUserIds(users.map((user) => user._id));

    return {
      items: users.map((user) => serializeCandidate(user, profileMap.get(String(user._id)))),
      ...listMeta(total, page, limit),
    };
  }

  async getCandidate(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Candidate not found');
    const user = await User.findOne({ _id: id, role: 'candidate' }).select(USER_FIELDS).lean<UserLean | null>();
    if (!user) throw new ApiError(404, 'Candidate not found');

    const userObjectId = user._id;
    const [profile, applications, savedJobs, views, notifications] = await Promise.all([
      Profile.findOne({ userId: userObjectId }).lean<ProfileLean | null>(),
      Application.find({ userId: userObjectId, isSaved: { $ne: true } })
        .sort({ appliedAt: -1 })
        .limit(50)
        .lean<ApplicationLean[]>(),
      SavedJob.find({ userId: userObjectId }).sort({ savedAt: -1 }).limit(50).lean<SavedJobLean[]>(),
      RecentlyViewed.find({ userId: userObjectId }).sort({ viewedAt: -1 }).limit(8).lean<{
        _id: Types.ObjectId;
        jobTitle: string;
        company: string;
        viewedAt?: Date;
      }[]>(),
      Notification.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(8).lean<{
        _id: Types.ObjectId;
        type: string;
        title: string;
        message: string;
        createdAt?: Date;
      }[]>(),
    ]);

    const applicationsWithUser = applications.map((item) => ({ ...item, userId: user }));
    const savedWithUser = savedJobs.map((item) => ({ ...item, userId: user }));

    const activity = [
      ...views.map((item) => ({
        id: String(item._id),
        kind: 'job_view',
        title: 'Viewed a job',
        message: `${item.jobTitle} at ${item.company}`,
        at: toIso(item.viewedAt) || '',
        href: '/admin/jobs',
        actor: userName(user),
      })),
      ...notifications.map((item) => ({
        id: String(item._id),
        kind: item.type,
        title: item.title,
        message: item.message,
        at: toIso(item.createdAt) || '',
        href: `/admin/candidates/${user._id}`,
        actor: userName(user),
      })),
    ]
      .filter((item) => item.at)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 12);

    return {
      candidate: serializeCandidate(user, profile),
      profile: profile ? serializeProfileDetail(profile, user) : null,
      applications: applicationsWithUser.map(serializeApplication),
      savedJobs: savedWithUser.map(serializeSavedJob),
      activity,
    };
  }

  async updateCandidate(id: string, isActive: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Candidate not found');
    if (typeof isActive !== 'boolean') throw new ApiError(400, 'Active status is required');

    const user = await User.findOneAndUpdate(
      { _id: id, role: 'candidate' },
      { isActive },
      { new: true }
    )
      .select(USER_FIELDS)
      .lean<UserLean | null>();
    if (!user) throw new ApiError(404, 'Candidate not found');

    const profile = await Profile.findOne({ userId: user._id }).lean<ProfileLean | null>();
    return serializeCandidate(user, profile);
  }

  async listProfiles(query: AdminListQuery) {
    const { page, limit, skip } = paginate(query.page, query.limit);
    const filter: Record<string, unknown> = {};
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      const userIds = await matchingUserIds(query.search);
      filter.$or = [
        { headline: rx },
        { location: rx },
        { designation: rx },
        { currentCompany: rx },
        { majorSkill: rx },
        { 'skills.name': rx },
        { userId: { $in: userIds } },
      ];
    }

    const [profiles, total] = await Promise.all([
      Profile.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean<ProfileLean[]>(),
      Profile.countDocuments(filter),
    ]);
    const userMap = await usersByIds(profiles.map((profile) => profile.userId));

    return {
      items: profiles.map((profile) =>
        serializeProfileSummary(profile, userMap.get(String(profile.userId)))
      ),
      ...listMeta(total, page, limit),
    };
  }

  async getProfile(userId: string) {
    if (!Types.ObjectId.isValid(userId)) throw new ApiError(404, 'Profile not found');
    const profile = await Profile.findOne({ userId }).lean<ProfileLean | null>();
    if (!profile) throw new ApiError(404, 'Profile not found');
    const user = await User.findById(profile.userId).select(USER_FIELDS).lean<UserLean | null>();
    return serializeProfileDetail(profile, user);
  }

  async listApplications(query: AdminListQuery) {
    const { page, limit, skip } = paginate(query.page, query.limit);
    const filter: Record<string, unknown> = { isSaved: { $ne: true } };
    if (query.stage) {
      if (!isStage(query.stage)) throw new ApiError(400, 'Unknown application stage');
      filter.stage = query.stage;
    }
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      const userIds = await matchingUserIds(query.search);
      filter.$or = [{ jobTitle: rx }, { company: rx }, { userId: { $in: userIds } }];
    }

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('userId', USER_FIELDS)
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ApplicationLean[]>(),
      Application.countDocuments(filter),
    ]);

    return {
      items: applications.map(serializeApplication),
      ...listMeta(total, page, limit),
    };
  }

  async updateApplication(
    id: string,
    input: { stage?: string; note?: string; recruiterFeedback?: string },
    updatedBy: string
  ) {
    if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Application not found');
    const existing = await Application.findById(id);
    if (!existing || existing.isSaved) throw new ApiError(404, 'Application not found');

    let nextStage: ApplicationStage | undefined;
    if (input.stage) {
      if (!isStage(input.stage)) throw new ApiError(400, 'Unknown application stage');
      nextStage = input.stage;
    }

    if (nextStage && nextStage !== existing.stage) {
      await applicationRepository.updateStage(id, nextStage, input.note, updatedBy);
    } else if (input.note?.trim()) {
      existing.timeline.push({
        stage: existing.stage,
        date: new Date(),
        note: input.note.trim(),
        updatedBy,
      });
      await existing.save();
    }

    const updates: Record<string, string> = {};
    if (input.recruiterFeedback !== undefined) updates.recruiterFeedback = input.recruiterFeedback;
    if (input.note !== undefined && nextStage && nextStage !== existing.stage) {
      updates.notes = input.note;
    }
    if (Object.keys(updates).length) {
      await Application.findByIdAndUpdate(id, updates);
    }

    const application = await Application.findById(id)
      .populate('userId', USER_FIELDS)
      .lean<ApplicationLean | null>();
    if (!application) throw new ApiError(404, 'Application not found');
    return serializeApplication(application);
  }

  async listSavedJobs(query: AdminListQuery) {
    const { page, limit, skip } = paginate(query.page, query.limit);
    const filter: Record<string, unknown> = {};
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      const userIds = await matchingUserIds(query.search);
      filter.$or = [{ jobTitle: rx }, { company: rx }, { userId: { $in: userIds } }];
    }

    const [jobs, total] = await Promise.all([
      SavedJob.find(filter)
        .populate('userId', USER_FIELDS)
        .sort({ savedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<SavedJobLean[]>(),
      SavedJob.countDocuments(filter),
    ]);

    return {
      items: jobs.map(serializeSavedJob),
      ...listMeta(total, page, limit),
    };
  }

  async deleteSavedJob(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Saved job not found');
    const deleted = await SavedJob.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, 'Saved job not found');
    return { id, deleted: true };
  }

  async listJobs(query: AdminListQuery) {
    const { page, limit } = paginate(query.page, query.limit);
    try {
      const catalog = await jobsService.searchCatalog({
        query: query.search,
        page,
        limit,
      });
      const total = catalog.total ?? catalog.jobs.length;
      return {
        items: catalog.jobs.map((job) => serializeJob(job, false)),
        unavailable: false,
        ...listMeta(total, page, limit),
      };
    } catch {
      return {
        items: [],
        unavailable: true,
        ...listMeta(0, page, limit),
      };
    }
  }

  async getJob(jobId: string) {
    try {
      const job = await jobsService.getJob(jobId);
      return serializeJob(job, true);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(404, 'Job not found');
    }
  }

  async listActivity(query: AdminListQuery) {
    const { page, limit, skip } = paginate(query.page, query.limit);
    const windowSize = 80;
    const [notifications, applications, savedJobs, views] = await Promise.all([
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(windowSize)
        .lean<{
          _id: Types.ObjectId;
          userId: Types.ObjectId;
          type: string;
          title: string;
          message: string;
          createdAt?: Date;
        }[]>(),
      Application.find({ isSaved: { $ne: true } })
        .sort({ appliedAt: -1 })
        .limit(windowSize)
        .lean<ApplicationLean[]>(),
      SavedJob.find().sort({ savedAt: -1 }).limit(windowSize).lean<SavedJobLean[]>(),
      RecentlyViewed.find().sort({ viewedAt: -1 }).limit(windowSize).lean<{
        _id: Types.ObjectId;
        userId: Types.ObjectId;
        jobTitle: string;
        company: string;
        viewedAt?: Date;
      }[]>(),
    ]);

    const userIds = [
      ...notifications.map((item) => item.userId),
      ...applications.map((item) => item.userId).filter((id): id is Types.ObjectId => id instanceof Types.ObjectId),
      ...savedJobs.map((item) => item.userId).filter((id): id is Types.ObjectId => id instanceof Types.ObjectId),
      ...views.map((item) => item.userId),
    ];
    const userMap = await usersByIds(userIds);

    const items = [
      ...notifications.map((item) => ({
        id: `notification-${item._id}`,
        kind: item.type || 'notification',
        title: item.title,
        message: item.message,
        at: toIso(item.createdAt) || '',
        href: '/admin/activity',
        actor: userName(userMap.get(String(item.userId))),
      })),
      ...applications.map((item) => ({
        id: `application-${item._id}`,
        kind: 'application',
        title: 'Application submitted',
        message: `${item.jobTitle} at ${item.company}`,
        at: toIso(item.appliedAt || item.createdAt) || '',
        href: '/admin/applications',
        actor: userName(
          item.userId instanceof Types.ObjectId ? userMap.get(String(item.userId)) : readUserRef(item.userId)
        ),
      })),
      ...savedJobs.map((item) => ({
        id: `saved-${item._id}`,
        kind: 'saved_job',
        title: 'Job saved',
        message: `${item.jobTitle} at ${item.company}`,
        at: toIso(item.savedAt) || '',
        href: '/admin/saved-jobs',
        actor: userName(
          item.userId instanceof Types.ObjectId ? userMap.get(String(item.userId)) : readUserRef(item.userId)
        ),
      })),
      ...views.map((item) => ({
        id: `view-${item._id}`,
        kind: 'job_view',
        title: 'Job viewed',
        message: `${item.jobTitle} at ${item.company}`,
        at: toIso(item.viewedAt) || '',
        href: '/admin/jobs',
        actor: userName(userMap.get(String(item.userId))),
      })),
    ]
      .filter((item) => item.at)
      .sort((a, b) => +new Date(b.at) - +new Date(a.at));

    const filtered = query.search
      ? items.filter((item) => {
          const haystack = `${item.title} ${item.message} ${item.actor}`.toLowerCase();
          return haystack.includes(query.search!.toLowerCase());
        })
      : items;

    return {
      items: filtered.slice(skip, skip + limit),
      ...listMeta(filtered.length, page, limit),
    };
  }
}

export const adminService = new AdminService();
