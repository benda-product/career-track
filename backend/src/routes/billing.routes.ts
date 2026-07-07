import { Router } from 'express';
import { billingController } from '../modules/billing/billing.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/catalog', billingController.listPlans);
router.get('/entitlements', authenticate, billingController.getEntitlements);
router.get('/confirm', billingController.confirmCheckout);
router.post('/checkout', authenticate, billingController.startCheckout);

export default router;
