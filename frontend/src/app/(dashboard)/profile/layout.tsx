import '@/styles/cp-profile.css';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-4 lg:-m-6 min-h-full bg-[var(--cp-bg,#f4f6f8)]">
      {children}
    </div>
  );
}
