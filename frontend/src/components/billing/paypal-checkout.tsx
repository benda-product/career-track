'use client';

import { useEffect, useRef } from 'react';
import { loadPayPalSdk } from '@/lib/paypal-sdk';

type PayPalCheckoutProps = {
  clientId: string;
  mode: 'subscription' | 'order';
  planId?: string;
  customId?: string;
  orderAmount?: string;
  orderDescription?: string;
  busy?: boolean;
  onSuccess: (id: string) => void | Promise<void>;
  onError?: (message: string) => void;
};

function closeButtonsSafely(buttons: { close: () => void } | null) {
  if (!buttons) return;
  try {
    buttons.close();
  } catch {
    // PayPal zoid components may already be destroyed after approval.
  }
}

export function PayPalCheckout({
  clientId,
  mode,
  planId,
  customId,
  orderAmount,
  orderDescription,
  busy = false,
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const isApprovingRef = useRef(false);
  const buttonsRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!clientId || !containerRef.current) return;

    if (mode === 'subscription' && !planId) {
      onErrorRef.current?.('PayPal plan is not ready. Please close and try again.');
      return;
    }

    let cancelled = false;

    const scriptQuery =
      mode === 'subscription'
        ? `client-id=${encodeURIComponent(clientId)}&vault=true&intent=subscription&currency=USD&components=buttons`
        : `client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;

    void loadPayPalSdk(scriptQuery)
      .then((paypal) => {
        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = '';

        const handleApprove = async (
          data: { subscriptionID?: string; orderID?: string },
          actions?: { order?: { capture: () => Promise<unknown> } },
        ) => {
          isApprovingRef.current = true;
          try {
            if (mode === 'order' && actions?.order) {
              await actions.order.capture();
            }

            const id = mode === 'subscription' ? data.subscriptionID : data.orderID;
            if (!id) return;

            await Promise.resolve(onSuccessRef.current(id));
          } catch (error: unknown) {
            onErrorRef.current?.(
              error instanceof Error ? error.message : 'Payment succeeded but activation failed.',
            );
            throw error;
          } finally {
            isApprovingRef.current = false;
          }
        };

        const config =
          mode === 'subscription'
            ? {
                style: { layout: 'vertical', label: 'subscribe', shape: 'rect' },
                createSubscription: (
                  _data: unknown,
                  actions: { subscription: { create: (input: Record<string, string>) => Promise<string> } },
                ) =>
                  actions.subscription.create({
                    plan_id: planId || '',
                    ...(customId ? { custom_id: customId } : {}),
                  }),
                onApprove: handleApprove,
                onCancel: () => {},
                onError: (error: { message?: string }) => {
                  onErrorRef.current?.(error?.message || 'PayPal checkout failed.');
                },
              }
            : {
                style: { layout: 'vertical', shape: 'rect' },
                createOrder: (
                  _data: unknown,
                  actions: { order: { create: (input: Record<string, unknown>) => Promise<string> } },
                ) =>
                  actions.order.create({
                    purchase_units: [
                      {
                        amount: { currency_code: 'USD', value: orderAmount || '0.00' },
                        description: orderDescription,
                        ...(customId ? { custom_id: customId } : {}),
                      },
                    ],
                  }),
                onApprove: handleApprove,
                onCancel: () => {},
                onError: (error: { message?: string }) => {
                  onErrorRef.current?.(error?.message || 'PayPal checkout failed.');
                },
              };

        const buttons = paypal.Buttons(config);
        buttonsRef.current = buttons;
        void buttons.render(containerRef.current);
      })
      .catch((error: unknown) => {
        onErrorRef.current?.(error instanceof Error ? error.message : 'PayPal checkout failed to load.');
      });

    return () => {
      cancelled = true;
      if (!isApprovingRef.current) {
        closeButtonsSafely(buttonsRef.current);
        buttonsRef.current = null;
      }
    };
  }, [clientId, mode, planId, customId, orderAmount, orderDescription]);

  return (
    <div className="relative min-h-[140px] max-w-md">
      <div
        ref={containerRef}
        className={busy ? 'pointer-events-none opacity-40' : undefined}
        aria-busy={busy}
      />
      {busy ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/60">
          <p className="text-sm text-muted-foreground">Confirming payment…</p>
        </div>
      ) : null}
    </div>
  );
}
