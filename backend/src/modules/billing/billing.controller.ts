import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { planService } from '../../services/plan.service';
import { isBillingDevMode } from '../../constants/plans';
import {
  confirmPayPalCheckout,
  handlePayPalWebhook,
  verifyPayPalWebhook,
} from '../../services/paypal.service';

export class BillingController {
  listPlans = asyncHandler(async (_req: AuthRequest, res: Response) => {
    sendSuccess(res, planService.listPublicPlans());
  });

  getEntitlements = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await planService.getEntitlements(req.user!.userId);
    sendSuccess(res, { ...data, devMode: isBillingDevMode() });
  });

  startCheckout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { planKey, billingCycle } = req.body as {
      planKey?: string;
      billingCycle?: string;
    };
    const data = await planService.startCheckout(req.user!.userId, { planKey, billingCycle });
    sendSuccess(res, data);
  });

  confirmCheckout = asyncHandler(async (req: Request, res: Response) => {
    const subscriptionId = String(req.query.subscriptionId || req.query.subscription_id || '');

    if (!subscriptionId) {
      throw new ApiError(400, 'subscriptionId is required');
    }

    const result = await confirmPayPalCheckout({ subscriptionId });

    sendSuccess(res, {
      activated: Boolean(result),
      subscriptionId,
      plan: result?.plan,
      planLabel: result?.planLabel,
    });
  });
}

export const billingController = new BillingController();

export async function paypalWebhook(req: Request, res: Response) {
  try {
    const event = await verifyPayPalWebhook(req);

    if (!event) {
      if (isBillingDevMode()) {
        return res.status(200).json({ received: true, devMode: true });
      }
      return res.status(400).json({ message: 'Webhook not configured.' });
    }

    await handlePayPalWebhook(event);

    return res.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook error';
    console.error('[billing/webhook]', message);
    return res.status(400).json({ message });
  }
}
