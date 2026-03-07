import { useAddChatMessage } from "@/hooks/useQueries";
import { AlertCircle, CheckCircle, Upload } from "lucide-react";
import { useState } from "react";

export function UploadComment() {
  const addChatMessage = useAddChatMessage();
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleUpload() {
    const trimmed = comment.trim();
    if (!trimmed) return;
    setStatus("loading");
    try {
      await addChatMessage.mutateAsync(trimmed);
      setStatus("success");
      setComment("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="space-card p-0 overflow-hidden">
      {/* Card Header */}
      <div
        className="px-5 pt-5 pb-4 flex items-center gap-3"
        style={{ borderBottom: "1px solid oklch(0.28 0.04 240 / 0.5)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))",
          }}
        >
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-base text-foreground">
            Upload Comment
          </h3>
          <p className="text-xs text-muted-foreground">
            Share your comment or feedback
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="upload-comment"
            className="text-sm font-medium text-muted-foreground"
          >
            Your Comment
          </label>
          <textarea
            id="upload-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comment here..."
            rows={4}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            style={{ background: "oklch(0.22 0.04 240)" }}
          />
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={!comment.trim() || status === "loading"}
          className="gradient-button w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
        >
          {status === "loading" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Comment
            </>
          )}
        </button>

        {status === "success" && (
          <div
            className="flex items-center gap-2 rounded-xl p-3 animate-fade-in"
            style={{
              background: "oklch(0.75 0.22 155 / 0.1)",
              border: "1px solid oklch(0.75 0.22 155 / 0.3)",
            }}
          >
            <CheckCircle
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "oklch(0.75 0.22 155)" }}
            />
            <p className="text-sm" style={{ color: "oklch(0.75 0.22 155)" }}>
              Comment uploaded successfully!
            </p>
          </div>
        )}
        {status === "error" && (
          <div
            className="flex items-center gap-2 rounded-xl p-3 animate-fade-in"
            style={{
              background: "oklch(0.6 0.22 25 / 0.1)",
              border: "1px solid oklch(0.6 0.22 25 / 0.3)",
            }}
          >
            <AlertCircle
              className="w-4 h-4 flex-shrink-0"
              style={{ color: "oklch(0.6 0.22 25)" }}
            />
            <p className="text-sm" style={{ color: "oklch(0.6 0.22 25)" }}>
              Failed to upload comment. Please try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
