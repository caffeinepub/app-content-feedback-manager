import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Tag, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useGetAllImages, useUploadImage } from "../../hooks/useQueries";

export function AdminImages() {
  const { data: images, isLoading } = useGetAllImages();
  const addImage = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [preview, setPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;
    setIsUploading(true);
    setError("");
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      await addImage.mutateAsync({
        name: name.trim(),
        tags: tagList,
        dataUrl: preview,
      });
      setName("");
      setTags("");
      setPreview("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Upload Form */}
      <div className="glass-card-gold rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Upload
            className="w-5 h-5"
            style={{ color: "oklch(0.82 0.20 70)" }}
          />
          <h3 className="font-orbitron font-bold text-sm uppercase tracking-wider gradient-heading">
            Upload Image
          </h3>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Image name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="glass-input border-0"
          />
          <Input
            placeholder="Tags (comma-separated)..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="glass-input border-0"
          />

          <button
            type="button"
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 w-full"
            style={{
              borderColor: "oklch(0.28 0.06 260 / 0.5)",
              background: "transparent",
            }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.75 0.18 65 / 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.28 0.06 260 / 0.5)";
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-40 mx-auto rounded-lg object-contain"
              />
            ) : (
              <>
                <ImageIcon
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: "oklch(0.45 0.04 260)" }}
                />
                <p
                  className="font-rajdhani text-sm"
                  style={{ color: "oklch(0.55 0.04 260)" }}
                >
                  Click to select an image
                </p>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {error && (
            <p
              className="text-sm font-rajdhani"
              style={{ color: "oklch(0.65 0.22 25)" }}
            >
              {error}
            </p>
          )}

          <Button
            onClick={handleUpload}
            disabled={
              !name.trim() || !fileRef.current?.files?.[0] || isUploading
            }
            className="w-full font-orbitron font-bold text-xs uppercase tracking-wider"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.75 0.18 65), oklch(0.70 0.20 185))",
              color: "oklch(0.08 0.02 260)",
              border: "none",
            }}
          >
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <h3
          className="font-orbitron font-bold text-sm uppercase tracking-wider"
          style={{ color: "oklch(0.78 0.22 188)" }}
        >
          Image Gallery
        </h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-40 rounded-xl"
                style={{ background: "oklch(0.16 0.03 260)" }}
              />
            ))}
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {images.map((img) => (
              <div
                key={String(img.id)}
                className="glass-card rounded-xl overflow-hidden"
              >
                {img.data ? (
                  <img
                    src={img.data.getDirectURL()}
                    alt={img.name}
                    className="w-full h-32 object-cover"
                  />
                ) : img.dataUrl ? (
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-32 flex items-center justify-center"
                    style={{ background: "oklch(0.12 0.03 260)" }}
                  >
                    <ImageIcon
                      className="w-8 h-8"
                      style={{ color: "oklch(0.35 0.04 260)" }}
                    />
                  </div>
                )}
                <div className="p-2">
                  <p
                    className="text-sm font-rajdhani font-600 truncate"
                    style={{ color: "oklch(0.85 0.05 80)" }}
                  >
                    {img.name}
                  </p>
                  {img.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Tag
                        className="w-3 h-3"
                        style={{ color: "oklch(0.50 0.04 260)" }}
                      />
                      {img.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-rajdhani"
                          style={{ color: "oklch(0.55 0.04 260)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-12"
            style={{ color: "oklch(0.45 0.04 260)" }}
          >
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-rajdhani">No images uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
