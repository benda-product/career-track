import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import resumeRoutes from './resume.routes';
import jobsRoutes from './jobs.routes';
import applicationsRoutes from './applications.routes';
import notificationsRoutes from './notifications.routes';
import dashboardRoutes from './dashboard.routes';
import recommendedJobsRoutes from './recommendedJobs.routes';
import skillCheckRoutes from './skillCheck.routes';
import coursesRoutes from './courses.routes';
import internalRoutes from './internal.routes';

const router = Router();

router.use('/internal', internalRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/resume', resumeRoutes);
router.use('/jobs', jobsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/recommended-jobs', recommendedJobsRoutes);
router.use('/skill-check', skillCheckRoutes);
router.use('/courses', coursesRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'CareerTrack API is running', timestamp: new Date().toISOString() });
});

export default router;
