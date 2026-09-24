'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  messagesService,
  type MessageItem,
  type MessageThread,
} from '@/services/messages.service';

function otherParty(thread: MessageThread, myEmail?: string) {
  const me = (myEmail || '').toLowerCase();
  const senderEmail = (thread.senderId?.email || '').toLowerCase();
  if (senderEmail && senderEmail === me) return thread.receiverId;
  if (thread.receiverId?.email?.toLowerCase() === me) return thread.senderId;
  if (thread.senderId?.role && thread.senderId.role !== 'candidate') return thread.senderId;
  if (thread.receiverId?.role && thread.receiverId.role !== 'candidate') return thread.receiverId;
  return thread.senderId || thread.receiverId;
}

function MessagesPageInner() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const myEmail = user?.email;

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [text, setText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadThreads = useCallback(async (preferThread?: string | null) => {
    setLoadingThreads(true);
    setError('');
    try {
      const data = await messagesService.getThreads();
      const list = data.threads || [];
      setThreads(list);
      setSelectedId((current) => {
        if (preferThread && list.some((t) => t.threadId === preferThread)) return preferThread;
        if (current && list.some((t) => t.threadId === current)) return current;
        return list[0]?.threadId || '';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages');
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads(searchParams.get('thread'));
  }, [loadThreads, searchParams]);

  const openThread = useCallback(async (threadId: string) => {
    setSelectedId(threadId);
    setLoadingMessages(true);
    setError('');
    try {
      const data = await messagesService.getMessages(threadId);
      setMessages(data.messages || []);
      await messagesService.markRead(threadId).catch(() => undefined);
    } catch (err) {
      setMessages([]);
      setError(err instanceof Error ? err.message : 'Unable to load conversation');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void openThread(selectedId);
  }, [selectedId, openThread]);

  const selected = useMemo(
    () => threads.find((t) => t.threadId === selectedId) || null,
    [threads, selectedId]
  );

  async function sendReply() {
    if (!selectedId || !text.trim()) return;
    setSending(true);
    setError('');
    try {
      await messagesService.reply({ threadId: selectedId, body: text.trim() });
      setText('');
      await openThread(selectedId);
      await loadThreads(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reply');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Conversations with hiring teams from Talent. Reply here — recruiters see your response in Talent."
      />

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid min-h-[70vh] overflow-hidden rounded-xl border border-[var(--ct-line)] bg-white lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-[var(--ct-line)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--ct-line)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--ct-ink)]">Inbox</p>
            <p className="text-xs text-[var(--ct-muted)]">
              {loadingThreads
                ? 'Loading…'
                : `${threads.length} conversation${threads.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="max-h-[40vh] overflow-auto lg:max-h-[calc(70vh-56px)]">
            {loadingThreads ? (
              <p className="p-4 text-sm text-[var(--ct-muted)]">Loading conversations…</p>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <MessageSquare className="h-8 w-8 text-[var(--ct-green)]" />
                <p className="text-sm font-semibold text-[var(--ct-ink)]">No messages yet</p>
                <p className="text-xs text-[var(--ct-muted)]">
                  When a recruiter messages you from Talent, the conversation appears here.
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const other = otherParty(thread, myEmail);
                const active = thread.threadId === selectedId;
                return (
                  <button
                    key={thread.threadId}
                    type="button"
                    onClick={() => setSelectedId(thread.threadId)}
                    className={cn(
                      'flex w-full flex-col gap-1 border-b border-[var(--ct-line)] px-4 py-3 text-left transition',
                      active ? 'bg-[var(--ct-tint)]' : 'hover:bg-[var(--ct-canvas)]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ct-ink)]">
                        {other?.name || thread.companyName || 'Hiring team'}
                      </span>
                      <span className="shrink-0 text-[10px] text-[var(--ct-muted)]">
                        {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <span className="truncate text-xs text-[var(--ct-muted)]">
                      {thread.jobTitle || thread.companyName || 'Application conversation'}
                    </span>
                    <span className="line-clamp-2 text-xs text-[var(--ct-ink)]/80">{thread.body}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-[420px] flex-col">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MessageSquare className="h-10 w-10 text-[var(--ct-green)]" />
              <p className="font-semibold text-[var(--ct-ink)]">Select a conversation</p>
              <p className="max-w-sm text-sm text-[var(--ct-muted)]">
                Choose a hiring-team thread to read messages and reply.
              </p>
            </div>
          ) : (
            <>
              <header className="border-b border-[var(--ct-line)] px-5 py-4">
                <h2 className="text-base font-semibold text-[var(--ct-ink)]">
                  {otherParty(selected, myEmail)?.name || selected.companyName || 'Hiring team'}
                </h2>
                <p className="text-xs text-[var(--ct-muted)]">
                  {[selected.jobTitle, selected.companyName].filter(Boolean).join(' · ') ||
                    'Talent hiring conversation'}
                </p>
              </header>

              <div className="flex-1 space-y-3 overflow-auto px-5 py-4">
                {loadingMessages ? (
                  <p className="text-sm text-[var(--ct-muted)]">Loading messages…</p>
                ) : (
                  messages.map((message) => {
                    const mine =
                      (message.senderId?.email || '').toLowerCase() ===
                        (myEmail || '').toLowerCase() || message.senderId?.role === 'candidate';
                    return (
                      <div
                        key={message._id}
                        className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
                            mine
                              ? 'bg-[var(--ct-green)] text-white'
                              : 'bg-[var(--ct-tint)] text-[var(--ct-ink)]'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.body}</p>
                          <p
                            className={cn(
                              'mt-1 text-[10px]',
                              mine ? 'text-white/70' : 'text-[var(--ct-muted)]'
                            )}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <footer className="flex gap-2 border-t border-[var(--ct-line)] p-4">
                <textarea
                  rows={2}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a reply to the hiring team…"
                  className="min-h-[72px] flex-1 resize-none rounded-lg border border-[var(--ct-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--ct-green)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendReply();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => void sendReply()}
                  disabled={!text.trim() || sending}
                  className="self-end"
                >
                  <Send className="mr-1.5 h-4 w-4" />
                  {sending ? 'Sending…' : 'Send'}
                </Button>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-[var(--ct-muted)]">Loading messages…</div>
      }
    >
      <MessagesPageInner />
    </Suspense>
  );
}
