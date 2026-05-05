"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";

export default function AiConfigPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    adminApi.getAgents().then((items: any) => setAgents(Array.isArray(items) ? items : []));
  }, []);

  async function save(id: string) {
    await adminApi.updateAgent(id, editData);
    setAgents((current) => current.map((agent) => (agent.id === id ? { ...agent, ...editData } : agent)));
    setEditing(null);
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Configurare Agenți AI
      </h1>
      <p style={{ color: "#8892B0", marginBottom: 32 }}>
        Gestionează sistemele Gemini Enterprise ale platformei
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {agents.map((agent) => (
          <div
            key={agent.id}
            style={{
              background: "white",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              border: agent.enabled ? "1.5px solid #00E87A" : "1px solid #E8EBF5",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ color: "#1B2A6B", margin: 0, fontWeight: 700 }}>{agent.name}</h3>
                <span style={{ color: "#8892B0", fontSize: 12 }}>{agent.type}</span>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() =>
                    adminApi.updateAgent(agent.id, { enabled: !agent.enabled }).then(() =>
                      setAgents((current) =>
                        current.map((item) =>
                          item.id === agent.id ? { ...item, enabled: !item.enabled } : item,
                        ),
                      ),
                    )
                  }
                  style={{
                    background: agent.enabled ? "#00E87A" : "#E8EBF5",
                    border: "none",
                    borderRadius: 20,
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    color: agent.enabled ? "#1B2A6B" : "#8892B0",
                  }}
                >
                  {agent.enabled ? "ACTIV" : "INACTIV"}
                </button>
                <button
                  onClick={() => {
                    setEditing(agent.id);
                    setEditData({
                      systemPrompt: agent.systemPrompt,
                      temperature: agent.temperature,
                    });
                  }}
                  style={{
                    background: "#1B2A6B",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 14px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Editează
                </button>
              </div>
            </div>

            <div style={{ color: "#8892B0", fontSize: 12, marginBottom: 8 }}>
              Model: <b style={{ color: "#1B2A6B" }}>{agent.model}</b>
              {" · "}Temperature: <b style={{ color: "#1B2A6B" }}>{agent.temperature}</b>
            </div>

            {editing !== agent.id ? (
              <div
                style={{
                  background: "#F0F2F8",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 12,
                  color: "#1B2A6B",
                  fontFamily: "monospace",
                  maxHeight: 80,
                  overflowY: "auto",
                }}
              >
                {agent.systemPrompt?.substring(0, 200)}
                {agent.systemPrompt?.length > 200 ? "..." : ""}
              </div>
            ) : (
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                <textarea
                  value={editData.systemPrompt}
                  onChange={(event) =>
                    setEditData((current: any) => ({ ...current, systemPrompt: event.target.value }))
                  }
                  rows={8}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 13,
                    border: "1.5px solid #1B2A6B",
                    fontFamily: "monospace",
                    color: "#1B2A6B",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ color: "#8892B0", fontSize: 13 }}>Temperature:</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={editData.temperature}
                    onChange={(event) =>
                      setEditData((current: any) => ({ ...current, temperature: Number(event.target.value) }))
                    }
                    style={{
                      width: 70,
                      padding: "6px 8px",
                      borderRadius: 6,
                      border: "1px solid #E8EBF5",
                      fontSize: 13,
                    }}
                  />
                  <button
                    onClick={() => void save(agent.id)}
                    style={{
                      background: "#00E87A",
                      color: "#1B2A6B",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 20px",
                      cursor: "pointer",
                      fontWeight: 700,
                      marginLeft: "auto",
                    }}
                  >
                    Salvează
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    style={{
                      background: "none",
                      border: "1px solid #E8EBF5",
                      borderRadius: 8,
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Anulează
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
