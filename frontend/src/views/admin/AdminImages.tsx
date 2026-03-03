import React, { useState, useRef } from 'react';
import { Image, Upload, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useGetAllImages, useAddImage } from '../../hooks/useQueries';

export default function AdminImages() {
  const { data: images = [], isLoading } = useGetAllImages();
  const addImage = useAddImage();

  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setFeedback(null);
  };

  const handleUpload = async () => {
    if (!preview || !name.trim()) return;
    setFeedback(null);
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await addImage.mutateAsync({ name: name.trim(), tags: tagList, dataUrl: preview });
      setFeedback({ type: 'success', message: `Image "${name}" uploaded!` });
      setName('');
      setTags('');
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image';
      setFeedback({ type: 'error', message: msg });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading images…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Image className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Images</h2>
          <p className="text-sm text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''} stored</p>
        </div>
      </div>

      {/* Upload form */}
      <div className="space-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Upload New Image</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Image Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 5-star-rating"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. rating, 5-star"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {preview ? 'Image selected ✓' : 'Choose image file…'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
          {preview && (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-40 object-contain rounded-lg border border-border" />
              <button
                onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background border border-border"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={!preview || !name.trim() || addImage.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {addImage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload Image
        </button>
        {feedback && (
          <div
            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              feedback.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {feedback.message}
          </div>
        )}
      </div>

      {/* Images grid */}
      {images.length === 0 ? (
        <div className="space-card p-8 text-center">
          <p className="text-muted-foreground text-sm">No images uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={String(img.id)} className="space-card overflow-hidden">
              {img.dataUrl ? (
                <img src={img.dataUrl} alt={img.name} className="w-full h-32 object-cover" />
              ) : img.data ? (
                <img src={img.data.getDirectURL()} alt={img.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-muted flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-2">
                <p className="text-xs font-medium truncate">{img.name}</p>
                {img.tags.length > 0 && (
                  <p className="text-xs text-muted-foreground truncate">{img.tags.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
