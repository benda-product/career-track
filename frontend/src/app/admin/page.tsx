export default function CareerTrackAdminPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#015DC0]">Career Track</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Administration</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Manage the Career Track candidate platform. Use the admin console switcher in the sidebar to
        move between Benda Platform Console, Talent Desk, Resume AI, and SkillCheck admin panels.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Platform scope</h2>
          <p className="mt-2 text-sm text-slate-600">
            Candidate accounts, job applications, profiles, and ecosystem integrations.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Cross-product admin</h2>
          <p className="mt-2 text-sm text-slate-600">
            Switch to Benda Infotech Platform Console for users, subscriptions, and product access
            control across the ecosystem.
          </p>
        </div>
      </div>
    </div>
  );
}
