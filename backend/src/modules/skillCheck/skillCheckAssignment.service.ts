import { SkillCheckAssignment } from './skillCheckAssignment.model';
import { userRepository } from '../../repositories/user.repository';
import { Notification } from '../notifications/notification.model';
import { emitNotification } from '../../sockets/notification.socket';

const STANDARD_SKILLS: Record<
  string,
  { name: string; bendaLanguage: string; targetPath: string }
> = {
  react: {
    name: 'React',
    bendaLanguage: 'fullStackDeveloper',
    targetPath: '/testOptions?language=fullStackDeveloper',
  },
  nodejs: {
    name: 'Node.js',
    bendaLanguage: 'fullStackDeveloper',
    targetPath: '/testOptions?language=fullStackDeveloper',
  },
  java: { name: 'Java', bendaLanguage: 'java', targetPath: '/testOptions?language=java' },
  python: {
    name: 'Python',
    bendaLanguage: 'python',
    targetPath: '/testOptions?language=python',
  },
  sql: { name: 'SQL', bendaLanguage: 'sql', targetPath: '/testOptions?language=sql' },
  aptitude: {
    name: 'Aptitude',
    bendaLanguage: 'businessAnalyst',
    targetPath: '/testOptions?language=businessAnalyst',
  },
  communication: {
    name: 'Communication',
    bendaLanguage: 'projectManagement',
    targetPath: '/testOptions?language=projectManagement',
  },
};

function resolveSkill(category: string) {
  const key = category.toLowerCase().trim();
  const mapped = STANDARD_SKILLS[key];
  if (mapped) return mapped;

  return {
    name: category,
    bendaLanguage: key,
    targetPath: `/testOptions?language=${encodeURIComponent(key)}`,
  };
}

export async function createSkillCheckAssignment(input: {
  email: string;
  name?: string;
  category: string;
  bendaLanguage?: string;
  targetPath?: string;
  level?: string;
  recruiterId?: string;
  recruiterName?: string;
  atsAssignmentId?: string;
  jobId?: string;
  dueDate?: string | Date;
  notes?: string;
}) {
  const email = input.email.toLowerCase().trim();
  let user = await userRepository.findByEmail(email);
  if (!user && input.name) {
    user = await userRepository.findByEmail(email);
  }
  if (!user) {
    throw new Error(`Career Track user not found for ${email}`);
  }

  const skill = input.bendaLanguage
    ? {
        name: input.category,
        bendaLanguage: input.bendaLanguage,
        targetPath:
          input.targetPath ||
          `/testOptions?language=${encodeURIComponent(input.bendaLanguage)}`,
      }
    : resolveSkill(input.category);
  const level = ['easy', 'medium', 'hard'].includes(input.level || '')
    ? (input.level as 'easy' | 'medium' | 'hard')
    : 'medium';

  const assignment = await SkillCheckAssignment.create({
    userId: user._id,
    email,
    category: skill.name,
    bendaLanguage: skill.bendaLanguage,
    level,
    targetPath: skill.targetPath,
    recruiterId: input.recruiterId,
    recruiterName: input.recruiterName,
    atsAssignmentId: input.atsAssignmentId,
    jobId: input.jobId,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    notes: input.notes,
    status: 'assigned',
    assignedAt: new Date(),
  });

  const notification = await Notification.create({
    userId: user._id,
    type: 'system',
    title: 'Skill Check assigned',
    message: `${input.recruiterName || 'A recruiter'} assigned you a ${skill.name} (${level}) assessment.`,
    data: {
      assignmentId: String(assignment._id),
      category: skill.name,
      level,
      targetPath: skill.targetPath,
    },
  });

  emitNotification(String(user._id), notification);

  return assignment;
}

export async function listSkillCheckAssignments(userId: string) {
  return SkillCheckAssignment.find({ userId }).sort({ assignedAt: -1 }).lean();
}

export async function completeMatchingAssignments(
  email: string,
  assessment: {
    category: string;
    level: string;
    bendaTestId: string;
    percentage: number;
    passed: boolean;
    certificateId?: string | null;
  }
) {
  const pending = await SkillCheckAssignment.find({
    email: email.toLowerCase().trim(),
    status: { $in: ['assigned', 'started'] },
    level: assessment.level,
    $or: [
      { category: new RegExp(`^${assessment.category}$`, 'i') },
      { bendaLanguage: new RegExp(`^${assessment.category}$`, 'i') },
    ],
  });

  const completedAt = new Date();
  for (const assignment of pending) {
    assignment.status = 'completed';
    assignment.completedAt = completedAt;
    assignment.result = {
      bendaTestId: assessment.bendaTestId,
      percentage: assessment.percentage,
      passed: assessment.passed,
      certificateId: assessment.certificateId || undefined,
    };
    await assignment.save();
  }
}
