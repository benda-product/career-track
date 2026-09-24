'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { adminService } from '@/services/admin.service';

type EmailListItem = {
  id: string;
  area: string;
  name: string;
  subject: string;
  fromCategory: string;
  brand?: string;
};

type EmailPreview = EmailListItem & {
  text: string;
  html: string;
};

export default function AdminEmailPreviewsPage() {
  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [layoutMeta, setLayoutMeta] = useState('');
  const [error, setError] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const loadList = useCallback(() => {
    setLoadingList(true);
    setError('');
    return adminService
      .emailPreviews()
      .then((res) => {
        const list = res.emails || [];
        setEmails(list);
        setSelectedId((prev) => prev || list[0]?.id || '');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load email previews.');
      })
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList, reloadToken]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingPreview(true);
    setError('');
    adminService
      .emailPreview(selectedId)
      .then((res) => {
        if (cancelled) return;
        setPreview(res.email);
        setLayoutMeta(res.layout ? `${res.layout} v${res.version || 1}` : '');
      })
      .catch((err) => {
        if (!cancelled) {
          setPreview(null);
          setError(err instanceof Error ? err.message : 'Unable to load preview.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, reloadToken]);

  const grouped = useMemo(() => {
    const map = new Map<string, EmailListItem[]>();
    for (const email of emails) {
      const list = map.get(email.area) || [];
      list.push(email);
      map.set(email.area, list);
    }
    return [...map.entries()];
  }, [emails]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Previews"
        description="SkillCheck-format Career Track emails (sample data only — nothing is sent)."
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => setReloadToken((n) => n + 1)}>
            Refresh previews
          </Button>
        }
      />

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,300px)_1fr]" style={{ minHeight: '70vh' }}>
        <aside className="max-h-[78vh] overflow-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          {loadingList ? (
            <p className="m-2 text-sm text-slate-500">Loading templates…</p>
          ) : !emails.length ? (
            <p className="m-2 text-sm text-slate-500">No templates found. Click Refresh.</p>
          ) : (
            grouped.map(([area, items]) => (
              <div key={area} className="mb-3.5">
                <p className="mb-2 ml-2 mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  {area}
                </p>
                <div className="grid gap-1">
                  {items.map((item) => {
                    const active = item.id === selectedId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className={`rounded-lg px-3 py-2.5 text-left transition ${
                          active
                            ? 'border border-primary/40 bg-primary/5'
                            : 'border border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                        <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.subject}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </aside>

        <section className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F3F7F4] shadow-sm">
          {loadingPreview ? (
            <p className="p-6 text-sm text-slate-500">Rendering preview…</p>
          ) : preview ? (
            <>
              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  {preview.brand || 'Career Track'} · {preview.area} · from: {preview.fromCategory}
                  {layoutMeta ? ` · ${layoutMeta}` : ''}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{preview.name}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Subject:</span> {preview.subject}
                </p>
              </div>
              <iframe
                key={`${preview.id}-${reloadToken}-${preview.subject}`}
                title={`Email preview: ${preview.name}`}
                srcDoc={preview.html}
                className="min-h-[560px] w-full flex-1 border-0 bg-[#F3F7F4]"
              />
            </>
          ) : (
            <p className="p-6 text-sm text-slate-500">Select a template to preview.</p>
          )}
        </section>
      </div>
    </div>
  );
}
