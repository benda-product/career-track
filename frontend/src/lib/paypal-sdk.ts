type PayPalButtons = {
  render: (container: HTMLElement) => Promise<void>;
  close: () => void;
};

type PayPalSdk = {
  Buttons: (config: Record<string, unknown>) => PayPalButtons;
};

declare global {
  interface Window {
    paypal?: PayPalSdk;
  }
}

const loaders = new Map<string, Promise<PayPalSdk>>();

export function loadPayPalSdk(scriptQuery: string): Promise<PayPalSdk> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('PayPal SDK requires a browser environment.'));
  }

  const cached = loaders.get(scriptQuery);
  if (cached && window.paypal) return cached;

  const loader = new Promise<PayPalSdk>((resolve, reject) => {
    const existing = document.getElementById('paypal-sdk-script') as HTMLScriptElement | null;
    const existingQuery = existing?.src?.split('?')[1];
    if (existing && existingQuery === scriptQuery && window.paypal) {
      resolve(window.paypal);
      return;
    }

    if (existing) {
      try {
        existing.remove();
      } catch {
        // ignore
      }
      delete window.paypal;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?${scriptQuery}`;
    script.async = true;
    script.setAttribute('data-namespace', 'paypal');
    script.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error('PayPal SDK failed to load.'));
    };
    script.onerror = () => reject(new Error('PayPal SDK failed to load.'));
    document.body.appendChild(script);
  }).catch((error) => {
    loaders.delete(scriptQuery);
    throw error;
  });

  loaders.set(scriptQuery, loader);
  return loader;
}
