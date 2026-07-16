import { MarketingFooter } from '@/components/marketing/marketing-footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell min-h-screen bg-[var(--ct-canvas)] text-[var(--ct-ink)] antialiased">
      {children}
      <MarketingFooter />
    </div>
  );
}
