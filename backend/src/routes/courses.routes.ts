import { Router } from 'express';
import { coursesController } from '../modules/courses/courses.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, authorize('candidate'));

router.get('/categories', coursesController.getCategories);
router.get('/', coursesController.listCourses);
router.get('/:slug/pdf-url', coursesController.getCoursePdfUrl);
router.get('/:slug/pdf', coursesController.getCoursePdf);
router.get('/:slug', coursesController.getCourse);

export default router;
