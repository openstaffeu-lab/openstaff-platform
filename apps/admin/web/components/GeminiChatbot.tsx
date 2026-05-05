"use client";

import { useEffect, useRef, useState } from "react";
import { chatWithRelu } from "@/lib/api";

const SUGGESTED = [
  "Cum mă înregistrez?",
  "Ce este codul NACE?",
  "Cum funcționează contractele?",
  "Ce ocupații ESCO există pentru electricieni?",
];

export default function GeminiChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "Bună ziua! Sunt Relu AI, asistentul platformei OpenStaff. Cum te pot ajuta?",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) {
      return;
    }

    const nextUserMessage = { role: "user" as const, text };
    const history = [...messages, nextUserMessage].map((message) => ({
      role: message.role === "user" ? "user" : "model",
      parts: message.text,
    }));

    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setLoading(true);

    try {
      const { response } = await chatWithRelu(text, history);
      setMessages((current) => [...current, { role: "assistant", text: response }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((current) => !current)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#00E87A",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,232,122,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
            fill="#1B2A6B"
          />
        </svg>
      </button>

      {open ? (
        <div
          style={{
            position: "fixed",
            bottom: 96,
            right: 28,
            width: 380,
            height: 520,
            background: "white",
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            border: "1px solid #E8EBF5",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#1B2A6B",
              color: "white",
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Relu AI</div>
              <div style={{ fontSize: 11, opacity: 0.75 }}>The Structure for Global Work</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 20 }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background: message.role === "user" ? "#1B2A6B" : "#F0F2F8",
                  color: message.role === "user" ? "white" : "#1B2A6B",
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {message.text}
              </div>
            ))}
            {loading ? (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "#F0F2F8",
                  padding: "10px 14px",
                  borderRadius: 12,
                }}
              >
                <span style={{ color: "#8892B0", fontSize: 13 }}>Relu AI scrie...</span>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 ? (
            <div style={{ padding: "0 14px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUGGESTED.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => void send(suggestion)}
                  style={{
                    background: "#F0F2F8",
                    border: "1px solid #E8EBF5",
                    color: "#1B2A6B",
                    padding: "6px 10px",
                    borderRadius: 20,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid #E8EBF5",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void send(input);
                }
              }}
              placeholder="Scrie un mesaj..."
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1.5px solid #E8EBF5",
                fontSize: 13,
                outline: "none",
                color: "#1B2A6B",
              }}
            />
            <button
              onClick={() => void send(input)}
              disabled={loading || !input.trim()}
              style={{
                background: "#00E87A",
                border: "none",
                borderRadius: 8,
                padding: "10px 14px",
                cursor: "pointer",
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"
                  stroke="#1B2A6B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
