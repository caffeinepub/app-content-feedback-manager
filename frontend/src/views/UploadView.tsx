import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useCommentLists, useAddTemplatesToList, useAddImage } from '../hooks/useQueries';
import { UploadComment } from '../components/UploadComment';
import BulkCommentGenerator from '../components/BulkCommentGenerator';

export default function UploadView() {
  const { data: commentLists = [] } = useCommentLists();
  const addTemplatesMutation = useAddTemplatesToList();
  const addImageMutation = useAddImage();

  // Bulk templates upload
  const [selectedListId, setSelectedListId] = useState('');
  const [bulkTemplates, setBulkTemplates] = useState('');
  const [templateFeedback, setTemplateFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Image upload
  const [imageName, setImageName] = useState('');
  const [imageTags, setImageTags] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFeedback, setImageFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleBulkTemplateUpload = async () => {
    if (!selectedListId || !bulkTemplates.trim()) return;
    setTemplateFeedback(null);
    const templates = bulkTemplates
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await addTemplatesMutation.mutateAsync({ listId: selectedListId, templates });
      setTemplateFeedback({ type: 'success', message: `${templates.length} template(s) added successfully!` });
      setBulkTemplates('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload templates';
      setTemplateFeedback({ type: 'error', message: msg });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setImageFeedback(null);
  };

  const handleImageUpload = async () => {
    if (!imagePreview || !imageName.trim()) return;
    setImageFeedback(null);
    const tagList = imageTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await addImageMutation.mutateAsync({ name: imageName.trim(), tags: tagList, dataUrl: imagePreview });
      setImageFeedback({ type: 'success', message: `Image "${imageName}" uploaded!` });
      setImageName('');
      setImageTags('');
      setImagePreview(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image';
      setImageFeedback({ type: 'error', message: msg });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Comment */}
      <UploadComment />

      {/* Bulk Comment Generator */}
      <BulkCommentGenerator />

      {/* Bulk Templates Upload */}
      <div className="space-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Bulk Uploading Template</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Select List</label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Choose a list…</option>
              {commentLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Templates (one per line)</label>
            <textarea
              value={bulkTemplates}
              onChange={(e) => setBulkTemplates(e.target.value)}
              placeholder={"Great app!\nLove this!\nHighly recommend."}
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
          </div>
        </div>
        <button
          onClick={handleBulkTemplateUpload}
          disabled={!selectedListId || !bulkTemplates.trim() || addTemplatesMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {addTemplatesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload Templates
        </button>
        {templateFeedback && (
          <div
            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              templateFeedback.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {templateFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {templateFeedback.message}
          </div>
        )}
      </div>

      {/* Upload Rating Image */}
      <div className="space-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Upload Rating Image</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Image Name *</label>
            <input
              type="text"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="e.g. 5-star-rating"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
            <input
              type="text"
              value={imageTags}
              onChange={(e) => setImageTags(e.target.value)}
              placeholder="e.g. rating, 5-star"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {imagePreview ? 'Image selected ✓' : 'Choose image file…'}
            </span>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </label>
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="w-full max-h-40 object-contain rounded-lg border border-border" />
          )}
        </div>
        <button
          onClick={handleImageUpload}
          disabled={!imagePreview || !imageName.trim() || addImageMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {addImageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload Image
        </button>
        {imageFeedback && (
          <div
            className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              imageFeedback.type === 'success'
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {imageFeedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {imageFeedback.message}
          </div>
        )}
      </div>
    </div>
  );
}
