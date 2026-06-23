import { Router } from 'express';
import { profileController } from '../modules/profile/profile.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { profilePhotoUpload } from '../middlewares/upload.middleware';
import { updateProfileSchema } from '../validators/profile.validator';

const router = Router();

router.use(authenticate, authorize('candidate'));

router.get('/', profileController.getProfile);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);
router.post('/photo', profilePhotoUpload.single('photo'), profileController.uploadPhoto);
router.get('/completion', profileController.getCompletion);

export default router;
