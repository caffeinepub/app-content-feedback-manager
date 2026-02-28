import { useState, useRef } from 'react';
import { useImages, useAddImage } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, Upload, Tag } from 'lucide-react';

export function AdminImages() {
  const { data: images, isLoading } = useImages();
  const addImage = useAddImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [preview, setPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;
    setIsUploading(true);
    setError('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(pct => setUploadProgress(pct));
      const tagList = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      await addImage.mutateAsync({ name: name.trim(), tags: tagList, dataUrl: '', data: blob });
      setName('');
      setTags('');
      setPreview('');
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-neon-teal" />
          <h3 className="font-display font-semibold text-lg">Upload Image</h3>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Image name..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-secondary border-border"
          />
          <Input
            placeholder="Tags (comma-separated)..."
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="bg-secondary border-border"
          />

          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-neon-teal transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Click to select an image</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {isUploading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, oklch(0.55 0.18 200), oklch(0.65 0.2 160))' }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            onClick={handleUpload}
            disabled={!name.trim() || !fileRef.current?.files?.[0] || isUploading}
            className="gradient-btn text-white font-semibold w-full"
          >
            {isUploading ? 'Uploading...' : <><Upload className="w-4 h-4 mr-2" />Upload Image</>}
          </Button>
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-lg">Image Gallery</h3>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 bg-secondary rounded-xl" />)}
          </div>
        ) : images && images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {images.map(img => (
              <div key={String(img.id)} className="glass-card rounded-xl overflow-hidden">
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
                  <div className="w-full h-32 bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground truncate">{img.name}</p>
                  {img.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Tag className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      {img.tags.map((tag, i) => (
                        <span key={i} className="text-xs text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">No images uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
