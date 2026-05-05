"use client";

import { useState } from "react";
import { uploadActorDocument } from "@/lib/api";

export default function DocumentUploadCard({
  label,
  documentType,
  token,
  fileUrl,
  onUploaded,
}: {
  label: string;
  documentType: string;
  token: string | null;
  fileUrl: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div style={{ border: "1px solid #E8EBF5", borderRadius: 12, padding: 16, background: "white" }}>
      <div style={{ color: "#1B2A6B", fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <input
        type="file"
        accept=".pdf,image/jpeg,image/png"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file || uploading) {
            return;
          }

          setUploading(true);
          setError("");

          try {
            const response = await uploadActorDocument(documentType, file, token);
            onUploaded(response.fileUrl);
          } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
          } finally {
            setUploading(false);
          }
        }}
      />
      {fileUrl ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#00C060", wordBreak: "break-all" }}>
          Încărcat: {fileUrl}
        </div>
      ) : null}
      {error ? <div style={{ marginTop: 10, fontSize: 12, color: "#EF4444" }}>{error}</div> : null}
      {uploading ? <div style={{ marginTop: 10, fontSize: 12, color: "#8892B0" }}>Se încarcă...</div> : null}
    </div>
  );
}
