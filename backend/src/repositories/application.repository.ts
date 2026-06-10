import { Application, IApplication } from '../modules/applications/application.model';
import { ApplicationStage } from '../types';

export class ApplicationRepository {
  async findByUserId(
    userId: string,
    page = 1,
    limit = 20,
    stage?: ApplicationStage
  ): Promise<{ applications: IApplication[]; total: number }> {
    const filter: Record<string, unknown> = { userId, isSaved: false };
    if (stage) filter.stage = stage;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .sort({ appliedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Application.countDocuments(filter),
    ]);

    return { applications, total };
  }

  async findById(id: string): Promise<IApplication | null> {
    return Application.findById(id);
  }

  async findByUserAndJob(userId: string, jobId: string): Promise<IApplication | null> {
    return Application.findOne({ userId, jobId });
  }

  async create(data: Partial<IApplication>): Promise<IApplication> {
    return Application.create({
      ...data,
      timeline: [{ stage: 'applied', date: new Date(), note: 'Application submitted' }],
    });
  }

  async updateStage(
    id: string,
    stage: ApplicationStage,
    note?: string
  ): Promise<IApplication | null> {
    return Application.findByIdAndUpdate(
      id,
      {
        stage,
        $push: { timeline: { stage, date: new Date(), note } },
      },
      { new: true }
    );
  }

  async getAnalytics(userId: string) {
    const stages = ['applied', 'screening', 'shortlisted', 'interview', 'offer', 'rejected', 'hired'];
    const counts = await Promise.all(
      stages.map((stage) =>
        Application.countDocuments({ userId, stage: stage as ApplicationStage, isSaved: false })
      )
    );
    const total = counts.reduce((a, b) => a + b, 0);
    const hired = counts[stages.indexOf('hired')];
    const offers = counts[stages.indexOf('offer')];
    const interviews = counts[stages.indexOf('interview')];
    const shortlisted = counts[stages.indexOf('shortlisted')];

    return {
      totalApplications: total,
      shortlisted,
      interviews,
      offers,
      successRate: total > 0 ? Math.round((hired / total) * 100) : 0,
      byStage: Object.fromEntries(stages.map((s, i) => [s, counts[i]])),
    };
  }
}

export const applicationRepository = new ApplicationRepository();
