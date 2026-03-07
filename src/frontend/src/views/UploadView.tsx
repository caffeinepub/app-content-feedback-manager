import type { CommentList } from "@/backend";
import BulkCommentGenerator from "@/components/BulkCommentGenerator";
import { UploadComment } from "@/components/UploadComment";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  useAddTemplatesToCommentList,
  useCommentLists,
  useUploadImage,
} from "../hooks/useQueries";

export function UploadView() {
  const { data: commentLists, isLoading } = useCommentLists();
  const addTemplates = useAddTemplatesToCommentList();
  const addImage = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const [selectedList, setSelectedList] = useState("");
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  // Image upload state
  const [imageName, setImageName] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageStatus, setImageStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [imageMessage, setImageMessage] = useState("");

  const handleUpload = async () => {
    if (!selectedList || !fileRef.current?.files?.[0]) return;
    const file = fileRef.current.files[0];
    setStatus("processing");
    setMessage("Processing file...");

    try {
      const text = await file.text();
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) {
        setStatus("error");
        setMessage("File is empty or has no valid lines.");
        return;
      }
      await addTemplates.mutateAsync({ id: selectedList, templates: lines });
      setStatus("success");
      setMessage(`Successfully added ${lines.length} template(s) to the list.`);
      if (fileRef.current) fileRef.current.value = "";
      setFileName("");
    } catch {
      setStatus("error");
      setMessage("Failed to upload templates. Please try again.");
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) =>
      setImagePreview((ev.target?.result as string) ?? "");
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!imageName.trim() || !imageFileRef.current?.files?.[0]) return;
    setImageStatus("processing");
    setImageMessage("Uploading image...");

    try {
      await addImage.mutateAsync({
        name: imageName.trim(),
        tags: [],
        dataUrl: imagePreview,
      });
      setImageStatus("success");
      setImageMessage("Image uploaded successfully!");
      setImageName("");
      setImageFileName("");
      setImagePreview("");
      if (imageFileRef.current) imageFileRef.current.value = "";
      setTimeout(() => setImageStatus("idle"), 3000);
    } catch {
      setImageStatus("error");
      setImageMessage("Failed to upload image. Please try again.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Page Title */}
      <div className="text-center pt-2">
        <h2 className="font-orbitron font-bold text-2xl gradient-heading">
          Upload Section
        </h2>
        <p
          className="text-sm font-rajdhani mt-1"
          style={{ color: "oklch(0.55 0.04 260)" }}
        >
          Upload comments, generate bulk comments, and upload rating images
        </p>
      </div>

      {/* 1. Upload Comment */}
      <UploadComment />

      {/* 2. Bulk Comment Generator */}
      <BulkCommentGenerator />

      {/* 3. Bulk Comments (file upload) */}
      <div className="glass-card p-0 overflow-hidden rounded-2xl">
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid oklch(0.22 0.05 260 / 0.5)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.70 0.20 185), oklch(0.75 0.18 65))",
            }}
          >
            <FileText
              className="w-5 h-5"
              style={{ color: "oklch(0.08 0.02 260)" }}
            />
          </div>
          <div>
            <h3
              className="font-orbitron font-bold text-sm"
              style={{ color: "oklch(0.85 0.05 80)" }}
            >
              Bulk Comments
            </h3>
            <p
              className="text-xs font-rajdhani"
              style={{ color: "oklch(0.55 0.04 260)" }}
            >
              Upload a .txt or .csv file to add templates to a list
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton
                className="h-10 w-full"
                style={{ background: "oklch(0.16 0.03 260)" }}
              />
              <Skeleton
                className="h-10 w-full"
                style={{ background: "oklch(0.16 0.03 260)" }}
              />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="upload-target-list"
                  className="text-xs font-rajdhani font-600 uppercase tracking-wider"
                  style={{ color: "oklch(0.60 0.04 260)" }}
                >
                  Target Comment List
                </label>
                <select
                  id="upload-target-list"
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                >
                  <option value="">Choose a list...</option>
                  {commentLists && commentLists.length > 0 ? (
                    commentLists.map((list: CommentList) => (
                      <option key={list.id} value={list.id}>
                        {list.displayName} ({list.templates.length} templates)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No lists available
                    </option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <span
                  className="text-xs font-rajdhani font-600 uppercase tracking-wider"
                  style={{ color: "oklch(0.60 0.04 260)" }}
                >
                  Upload File (.txt or .csv)
                </span>
                <button
                  type="button"
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 w-full"
                  style={{
                    borderColor: "oklch(0.28 0.06 260 / 0.5)",
                    background: "transparent",
                  }}
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "oklch(0.70 0.20 185 / 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "oklch(0.28 0.06 260 / 0.5)";
                  }}
                >
                  <FileText
                    className="w-10 h-10 mx-auto mb-2"
                    style={{ color: "oklch(0.45 0.04 260)" }}
                  />
                  {fileName ? (
                    <p
                      className="font-rajdhani font-600 text-sm"
                      style={{ color: "oklch(0.85 0.05 80)" }}
                    >
                      {fileName}
                    </p>
                  ) : (
                    <>
                      <p
                        className="font-rajdhani text-sm"
                        style={{ color: "oklch(0.55 0.04 260)" }}
                      >
                        Click to select a .txt or .csv file
                      </p>
                      <p
                        className="text-xs font-rajdhani mt-1"
                        style={{ color: "oklch(0.40 0.04 260)" }}
                      >
                        Each line will be added as a template
                      </p>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                />
              </div>

              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedList || !fileName || status === "processing"}
                className="w-full py-3 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center justify-center gap-2"
                style={{
                  background:
                    !selectedList || !fileName
                      ? "oklch(0.16 0.03 260)"
                      : "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
                  color:
                    !selectedList || !fileName
                      ? "oklch(0.40 0.04 260)"
                      : "oklch(0.08 0.02 260)",
                }}
              >
                {status === "processing" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Templates
                  </>
                )}
              </button>

              {status === "success" && (
                <div
                  className="flex items-center gap-2 rounded-xl p-3 animate-fadeIn"
                  style={{
                    background: "oklch(0.65 0.18 145 / 0.1)",
                    border: "1px solid oklch(0.65 0.18 145 / 0.3)",
                  }}
                >
                  <CheckCircle
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.72 0.20 145)" }}
                  />
                  <p
                    className="text-sm font-rajdhani"
                    style={{ color: "oklch(0.72 0.20 145)" }}
                  >
                    {message}
                  </p>
                </div>
              )}
              {status === "error" && (
                <div
                  className="flex items-center gap-2 rounded-xl p-3 animate-fadeIn"
                  style={{
                    background: "oklch(0.55 0.22 25 / 0.1)",
                    border: "1px solid oklch(0.55 0.22 25 / 0.3)",
                  }}
                >
                  <AlertCircle
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "oklch(0.65 0.22 25)" }}
                  />
                  <p
                    className="text-sm font-rajdhani"
                    style={{ color: "oklch(0.65 0.22 25)" }}
                  >
                    {message}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. Upload Rating Image */}
      <div className="glass-card p-0 overflow-hidden rounded-2xl">
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid oklch(0.22 0.05 260 / 0.5)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.70 0.20 185), oklch(0.75 0.18 65))",
            }}
          >
            <ImageIcon
              className="w-5 h-5"
              style={{ color: "oklch(0.08 0.02 260)" }}
            />
          </div>
          <div>
            <h3
              className="font-orbitron font-bold text-sm"
              style={{ color: "oklch(0.85 0.05 80)" }}
            >
              Upload Rating Image
            </h3>
            <p
              className="text-xs font-rajdhani"
              style={{ color: "oklch(0.55 0.04 260)" }}
            >
              Upload your rating image with your name
            </p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="upload-image-name"
              className="text-xs font-rajdhani font-600 uppercase tracking-wider"
              style={{ color: "oklch(0.60 0.04 260)" }}
            >
              Your Name
            </label>
            <input
              id="upload-image-name"
              type="text"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="Enter your name..."
              className="glass-input w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <span
              className="text-xs font-rajdhani font-600 uppercase tracking-wider"
              style={{ color: "oklch(0.60 0.04 260)" }}
            >
              Select Image
            </span>
            <button
              type="button"
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 w-full"
              style={{
                borderColor: "oklch(0.28 0.06 260 / 0.5)",
                background: "transparent",
              }}
              onClick={() => imageFileRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  "oklch(0.70 0.20 185 / 0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  "oklch(0.28 0.06 260 / 0.5)";
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 mx-auto rounded-lg object-contain"
                />
              ) : (
                <>
                  <ImageIcon
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: "oklch(0.45 0.04 260)" }}
                  />
                  {imageFileName ? (
                    <p
                      className="font-rajdhani font-600 text-sm"
                      style={{ color: "oklch(0.85 0.05 80)" }}
                    >
                      {imageFileName}
                    </p>
                  ) : (
                    <p
                      className="font-rajdhani text-sm"
                      style={{ color: "oklch(0.55 0.04 260)" }}
                    >
                      Click to select an image
                    </p>
                  )}
                </>
              )}
            </button>
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
          </div>

          <button
            type="button"
            onClick={handleImageUpload}
            disabled={
              !imageName.trim() ||
              !imageFileName ||
              imageStatus === "processing"
            }
            className="w-full py-3 rounded-xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300 hover-lift flex items-center justify-center gap-2"
            style={{
              background:
                !imageName.trim() || !imageFileName
                  ? "oklch(0.16 0.03 260)"
                  : "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color:
                !imageName.trim() || !imageFileName
                  ? "oklch(0.40 0.04 260)"
                  : "oklch(0.08 0.02 260)",
            }}
          >
            {imageStatus === "processing" ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Image
              </>
            )}
          </button>

          {imageStatus === "success" && (
            <div
              className="flex items-center gap-2 rounded-xl p-3 animate-fadeIn"
              style={{
                background: "oklch(0.65 0.18 145 / 0.1)",
                border: "1px solid oklch(0.65 0.18 145 / 0.3)",
              }}
            >
              <CheckCircle
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.72 0.20 145)" }}
              />
              <p
                className="text-sm font-rajdhani"
                style={{ color: "oklch(0.72 0.20 145)" }}
              >
                {imageMessage}
              </p>
            </div>
          )}
          {imageStatus === "error" && (
            <div
              className="flex items-center gap-2 rounded-xl p-3 animate-fadeIn"
              style={{
                background: "oklch(0.55 0.22 25 / 0.1)",
                border: "1px solid oklch(0.55 0.22 25 / 0.3)",
              }}
            >
              <AlertCircle
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "oklch(0.65 0.22 25)" }}
              />
              <p
                className="text-sm font-rajdhani"
                style={{ color: "oklch(0.65 0.22 25)" }}
              >
                {imageMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
