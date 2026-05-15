"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConversationThreadPanel } from "@/components/messaging/ConversationThreadPanel";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiRequest, apiRequestBlob } from "@/lib/api";
import type { ConversationItem, ConversationMessage } from "@/lib/project-types";

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MessageConversationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { token, isReady, logout } = useAuth();
  const [conversation, setConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const conversationId = typeof params?.id === "string" ? params.id : "";

  async function load() {
    if (!token || !conversationId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [nextConversation, nextMessages] = await Promise.all([
        apiRequest<ConversationItem>(`/messages/conversations/${conversationId}`, { token }),
        apiRequest<ConversationMessage[]>(
          `/messages/conversations/${conversationId}/messages`,
          { token },
        ),
      ]);

      setConversation(nextConversation);
      setMessages(nextMessages);
      await apiRequest(`/messages/conversations/${conversationId}/read`, {
        method: "POST",
        token,
      });
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        logout();
        router.push("/login");
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load conversation.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [conversationId, isReady, logout, router, token]);

  const attachments = useMemo(
    () =>
      messages.flatMap((message) =>
        (message.attachments ?? []).map((attachment) => ({
          ...attachment,
          messageId: message.id,
          messageType: message.type,
        })),
      ),
    [messages],
  );

  const handleAttachmentUpload = async () => {
    if (!token || !conversationId || !file) {
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("content", file.name);

      await apiRequest(`/messages/conversations/${conversationId}/attachments`, {
        method: "POST",
        token,
        formData,
      });
      setFile(null);
      setSuccess("Attachment uploaded.");
      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to upload attachment.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    if (!token) {
      return;
    }

    const blob = await apiRequestBlob(`/messages/attachments/${attachmentId}`, { token });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_38%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        {loading ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6 text-slate-300">
            Loading conversation...
          </section>
        ) : error ? (
          <section className="rounded-[1.75rem] border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">
            {error}
          </section>
        ) : conversation ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)]">
            <div className="space-y-6">
              <ConversationThreadPanel
                token={token!}
                title={conversation.title || conversation.type}
                subtitle={conversation.lastMessagePreview || "Operational workspace conversation"}
                conversation={conversation}
                onError={setError}
                onSuccess={setSuccess}
              />

              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Attachment upload</div>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="file"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="block w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAttachmentUpload}
                    disabled={!file || uploading}
                    className="rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploading ? "Uploading..." : "Upload file"}
                  </button>
                </div>
                {success ? <div className="mt-3 text-sm text-emerald-300">{success}</div> : null}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Participants</div>
                <div className="mt-4 space-y-3">
                  {conversation.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                    >
                      <div className="font-medium text-white">
                        {participant.user?.email || participant.userId}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.22em] text-cyan-200">
                        {participant.role}
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        Last seen {formatDate(participant.lastSeenAt)} · unread{" "}
                        {participant.unreadCount ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-6">
                <div className="text-sm font-semibold text-white">Attachments</div>
                <div className="mt-4 space-y-3">
                  {attachments.length ? (
                    attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-white">{attachment.fileName}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {attachment.mimeType} · {(attachment.sizeBytes / 1024).toFixed(1)} KB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownload(attachment.id, attachment.fileName)}
                            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200"
                          >
                            Download
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          Status {attachment.status} · uploaded {formatDate(attachment.createdAt)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No attachments yet.</div>
                  )}
                </div>
              </section>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
