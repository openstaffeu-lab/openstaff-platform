'use client';

import { useEffect, useState } from 'react';
import { fetchApiJson } from '@/lib/api';

type PrivateMessage = {
  id: string;
  senderName: string;
  message: string;
  status: string;
  createdAt: string;
};

type PrivateConversation = {
  id: string;
  requesterName: string;
  ownerName: string;
  status: string;
  createdAt: string;
  post?: {
    id: string;
    title: string;
  } | null;
  messages: PrivateMessage[];
};

type LoadState = 'loading' | 'success' | 'unauthorized' | 'error';

export default function AdminPrivateMessagesPage() {
  const [items, setItems] = useState<PrivateConversation[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadConversations() {
      setState('loading');
      setMessage(null);

      const result = await fetchApiJson<PrivateConversation[]>('/admin/private-conversations');

      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setState(result.kind);
        setMessage(result.message);
        setItems([]);
        return;
      }

      setItems(Array.isArray(result.data) ? result.data : []);
      setState('success');
    }

    void loadConversations();

    return () => {
      mounted = false;
    };
  }, []);

  async function updateConversationStatus(id: string, status: string) {
    const result = await fetchApiJson<PrivateConversation>(`/admin/private-conversations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status: result.data.status } : item)),
    );
    setMessage(`Conversation ${status.toLowerCase()} successfully.`);
  }

  async function updateMessageStatus(id: string, status: string) {
    const result = await fetchApiJson<PrivateMessage>(`/admin/private-messages/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setItems((current) =>
      current.map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map((item) =>
          item.id === id ? { ...item, status: result.data.status } : item,
        ),
      })),
    );
    setMessage(`Message ${status.toLowerCase()} successfully.`);
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          OpenStaff Communication Moderation
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Private Conversations</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Review private conversation requests and moderate individual messages before they
          escalate beyond the public listing context.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {state === 'loading' ? <ShellNotice tone="neutral" message="Loading private conversations..." /> : null}
        {state === 'unauthorized' ? (
          <ShellNotice tone="warning" message={message ?? 'Authentication is required.'} />
        ) : null}
        {state === 'error' ? (
          <ShellNotice tone="danger" message={message ?? 'The private messaging queue could not load.'} />
        ) : null}

        {state === 'success' ? (
          <div className="mt-8 grid gap-6">
            {items.map((conversation) => (
              <article key={conversation.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge label={conversation.status} tone={statusTone(conversation.status)} />
                    </div>

                    <h2 className="mt-4 text-lg font-semibold text-cyan-100">
                      {conversation.post?.title ?? 'Unlinked public post'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {conversation.requesterName} → {conversation.ownerName}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      Opened {formatDate(conversation.createdAt)}
                    </p>

                    <div className="mt-5 grid gap-3">
                      {conversation.messages.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-white">{item.senderName}</div>
                            <Badge label={item.status} tone={statusTone(item.status)} />
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-300">{item.message}</p>
                          <div className="mt-3 text-xs text-slate-500">{formatDate(item.createdAt)}</div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <ActionButton label="Approve" onClick={() => void updateMessageStatus(item.id, 'SENT')} tone="success" />
                            <ActionButton label="Flag" onClick={() => void updateMessageStatus(item.id, 'FLAGGED')} tone="warning" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 xl:w-52">
                    <ActionButton label="Open" onClick={() => void updateConversationStatus(conversation.id, 'OPEN')} tone="success" />
                    <ActionButton label="Flag" onClick={() => void updateConversationStatus(conversation.id, 'FLAGGED')} tone="warning" />
                    <ActionButton label="Close conversation" onClick={() => void updateConversationStatus(conversation.id, 'CLOSED')} tone="danger" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ActionButton({
  label,
  onClick,
  tone,
}: {
  label: string;
  onClick: () => void;
  tone: 'success' | 'danger' | 'warning';
}) {
  const styles =
    tone === 'success'
      ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
      : tone === 'danger'
        ? 'bg-rose-400 text-slate-950 hover:bg-rose-300'
        : 'bg-amber-300 text-slate-950 hover:bg-amber-200';

  return (
    <button type="button" onClick={onClick} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${styles}`}>
      {label}
    </button>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}) {
  const styles =
    tone === 'success'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
      : tone === 'warning'
        ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
        : tone === 'danger'
          ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
          : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${styles}`}>
      {label}
    </span>
  );
}

function ShellNotice({
  message,
  tone,
}: {
  message: string;
  tone: 'neutral' | 'warning' | 'danger';
}) {
  const styles =
    tone === 'warning'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      : tone === 'danger'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
        : 'border-slate-800 bg-slate-950/80 text-slate-300';

  return <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'OPEN' || status === 'SENT') {
    return 'success';
  }

  if (status === 'FLAGGED') {
    return 'warning';
  }

  if (status === 'CLOSED') {
    return 'danger';
  }

  return 'info';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
