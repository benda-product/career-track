import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { bendaInfotechCoursesService } from '../../services/bendaInfotechCourses.service';
import { env } from '../../config/env';
import { resolveCoursePdfUrl } from '../../utils/coursePdf.utils';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { getParam } from '../../utils/params';

export class CoursesController {
  listCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const courses = await bendaInfotechCoursesService.listCourses(category);
    sendSuccess(res, courses);
  });

  getCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const categories = await bendaInfotechCoursesService.getCategories();
    sendSuccess(res, categories);
  });

  getCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await bendaInfotechCoursesService.getCourse(getParam(req.params.slug));
    sendSuccess(res, course);
  });

  getCoursePdfUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await bendaInfotechCoursesService.getCourse(getParam(req.params.slug));

    if (!course.pdfUrl) {
      sendSuccess(res, { url: null, slug: course.slug, hasPdf: false });
      return;
    }

    const url = resolveCoursePdfUrl(course.pdfUrl);
    sendSuccess(res, { url, slug: course.slug, hasPdf: true });
  });

  getCoursePdf = asyncHandler(async (req: AuthRequest, res: Response) => {
    const slug = getParam(req.params.slug);
    const course = await bendaInfotechCoursesService.getCourse(slug);

    if (course.pdfUrl) {
      const url = resolveCoursePdfUrl(course.pdfUrl);
      return res.redirect(302, url);
    }

    const response = await axios.get(`${env.bendaInfotech.apiUrl}/courses/${encodeURIComponent(slug)}/pdf`, {
      responseType: 'arraybuffer',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${slug}.pdf"`);
    return res.send(Buffer.from(response.data));
  });
}

export const coursesController = new CoursesController();
