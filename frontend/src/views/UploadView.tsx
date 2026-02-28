import { useState, useRef } from 'react';
import { useCommentLists, useAddTemplatesToList } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, CheckCircle, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { UploadComment } from '@/components/UploadComment';
import { BulkCommentGenerator } from '@/components/BulkCommentGenerator';
import { useAddImage } from '@/hooks/useQueries';
import { ExternalBlob } from '@/backend';

export function UploadView() {
  const { data: commentLists, isLoading } = useCommentLists();
  const addTemplates = useAddTemplatesToList();
  const addImage = useAddImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);

  const [selectedList, setSelectedList] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');

  // Image upload state
  const [imageName, setImageName] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [imageStatus, setImageStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [imageMessage, setImageMessage] = useState('');

  const handleUpload = async () => {
    if (!selectedList || !fileRef.current?.files?.[0]) return;
    const file = fileRef.current.files[0];
    setStatus('processing');
    setMessage('Processing file...');

    try {
      const text = await file.text();
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) {
        setStatus('error');
        setMessage('File is empty or has no valid lines.');
        return;
      }
      await addTemplates.mutateAsync({ listId: selectedList, templates: lines });
      setStatus('success');
      setMessage(`Successfully added ${lines.length} template(s) to the list.`);
      if (fileRef.current) fileRef.current.value = '';
      setFileName('');
    } catch {
      setStatus('error');
      setMessage('Failed to upload templates. Please try again.');
    }
  };

  const handleImageUpload = async () => {
    if (!imageName.trim() || !imageFileRef.current?.files?.[0]) return;
    const file = imageFileRef.current.files[0];
    setImageStatus('processing');
    setImageMessage('Uploading image...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes);
      await addImage.mutateAsync({
        name: imageName.trim(),
        tags: [],
        dataUrl: '',
        data: blob,
      });
      setImageStatus('success');
      setImageMessage('Image uploaded successfully!');
      setImageName('');
      setImageFileName('');
      if (imageFileRef.current) imageFileRef.current.value = '';
      setTimeout(() => setImageStatus('idle'), 3000);
    } catch {
      setImageStatus('error');
      setImageMessage('Failed to upload image. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="text-center pt-2">
        <h2 className="text-3xl font-display font-bold gradient-heading">Upload Section</h2>
        <p className="text-muted-foreground mt-1">Upload comments, generate bulk comments, and upload rating images</p>
      </div>

      {/* 1. Upload Comment */}
      <UploadComment />

      {/* 2. Bulk Comment Generator */}
      <BulkCommentGenerator />

      {/* 3. Bulk Comments (file upload) */}
      <div className="space-card p-0 overflow-hidden">
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}
          >
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Bulk Comments</h3>
            <p className="text-xs text-muted-foreground">Upload a .txt or .csv file to add templates to a list</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full bg-secondary" />
              <Skeleton className="h-10 w-full bg-secondary" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Target Comment List</label>
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  style={{ background: 'oklch(0.22 0.04 240)' }}
                >
                  <option value="">Choose a list...</option>
                  {commentLists && commentLists.length > 0 ? (
                    commentLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.displayName} ({list.templates.length} templates)
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No lists available</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Upload File (.txt or .csv)</label>
                <div
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
                  style={{ borderColor: 'oklch(0.28 0.04 240)' }}
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'oklch(0.72 0.18 175)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'oklch(0.28 0.04 240)')}
                >
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  {fileName ? (
                    <p className="text-foreground font-medium text-sm">{fileName}</p>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-sm">Click to select a .txt or .csv file</p>
                      <p className="text-xs text-muted-foreground mt-1">Each line will be added as a template</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.csv"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedList || !fileName || status === 'processing'}
                className="gradient-button w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
              >
                {status === 'processing' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Templates
                  </>
                )}
              </button>

              {status === 'success' && (
                <div className="flex items-center gap-2 rounded-xl p-3 animate-fade-in" style={{ background: 'oklch(0.75 0.22 155 / 0.1)', border: '1px solid oklch(0.75 0.22 155 / 0.3)' }}>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.75 0.22 155)' }} />
                  <p className="text-sm" style={{ color: 'oklch(0.75 0.22 155)' }}>{message}</p>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 rounded-xl p-3 animate-fade-in" style={{ background: 'oklch(0.6 0.22 25 / 0.1)', border: '1px solid oklch(0.6 0.22 25 / 0.3)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.6 0.22 25)' }} />
                  <p className="text-sm" style={{ color: 'oklch(0.6 0.22 25)' }}>{message}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4. Upload Rating Image */}
      <div className="space-card p-0 overflow-hidden">
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid oklch(0.28 0.04 240 / 0.5)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}
          >
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">Upload Rating Image</h3>
            <p className="text-xs text-muted-foreground">Upload your rating image with your name</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Your Name</label>
            <input
              type="text"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full rounded-xl px-3 py-2.5 text-sm text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              style={{ background: 'oklch(0.22 0.04 240)' }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Select Image</label>
            <div
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
              style={{ borderColor: 'oklch(0.28 0.04 240)' }}
              onClick={() => imageFileRef.current?.click()}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'oklch(0.72 0.18 175)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'oklch(0.28 0.04 240)')}
            >
              <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              {imageFileName ? (
                <p className="text-foreground font-medium text-sm">{imageFileName}</p>
              ) : (
                <p className="text-muted-foreground text-sm">Click to select an image</p>
              )}
            </div>
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFileName(e.target.files?.[0]?.name || '')}
            />
          </div>

          <button
            onClick={handleImageUpload}
            disabled={!imageName.trim() || !imageFileName || imageStatus === 'processing'}
            className="gradient-button w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm"
          >
            {imageStatus === 'processing' ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Image
              </>
            )}
          </button>

          {imageStatus === 'success' && (
            <div className="flex items-center gap-2 rounded-xl p-3 animate-fade-in" style={{ background: 'oklch(0.75 0.22 155 / 0.1)', border: '1px solid oklch(0.75 0.22 155 / 0.3)' }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.75 0.22 155)' }} />
              <p className="text-sm" style={{ color: 'oklch(0.75 0.22 155)' }}>{imageMessage}</p>
            </div>
          )}
          {imageStatus === 'error' && (
            <div className="flex items-center gap-2 rounded-xl p-3 animate-fade-in" style={{ background: 'oklch(0.6 0.22 25 / 0.1)', border: '1px solid oklch(0.6 0.22 25 / 0.3)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.6 0.22 25)' }} />
              <p className="text-sm" style={{ color: 'oklch(0.6 0.22 25)' }}>{imageMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
