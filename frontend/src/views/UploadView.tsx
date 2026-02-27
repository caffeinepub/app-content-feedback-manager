import { useState, useRef } from 'react';
import { useCommentLists, useAddTemplatesToList } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export function UploadView() {
  const { data: commentLists, isLoading } = useCommentLists();
  const addTemplates = useAddTemplatesToList();
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedList, setSelectedList] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [fileName, setFileName] = useState('');

  const handleUpload = async () => {
    if (!selectedList || !fileRef.current?.files?.[0]) return;
    const file = fileRef.current.files[0];
    setStatus('processing');
    setMessage('Processing file...');

    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold neon-text">Bulk Upload</h2>
        <p className="text-muted-foreground mt-1">Upload template files to comment lists</p>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-neon-teal" />
          <h3 className="font-display font-semibold text-lg">Upload Templates</h3>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-secondary" />
            <Skeleton className="h-10 w-full bg-secondary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Target Comment List</label>
              <Select value={selectedList} onValueChange={setSelectedList}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Choose a list..." />
                </SelectTrigger>
                <SelectContent>
                  {commentLists && commentLists.length > 0 ? (
                    commentLists.map(list => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.displayName} ({list.templates.length} templates)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none" disabled>No lists available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Upload File (.txt or .csv)</label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-neon-teal transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                {fileName ? (
                  <p className="text-foreground font-medium">{fileName}</p>
                ) : (
                  <>
                    <p className="text-muted-foreground">Click to select a .txt or .csv file</p>
                    <p className="text-xs text-muted-foreground mt-1">Each line will be added as a template</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={e => setFileName(e.target.files?.[0]?.name || '')}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedList || !fileName || status === 'processing'}
              className="gradient-btn text-white font-semibold w-full"
            >
              {status === 'processing' ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Templates
                </span>
              )}
            </Button>

            {status === 'success' && (
              <div className="flex items-center gap-2 text-neon-green bg-secondary rounded-lg p-3 animate-fade-in">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{message}</p>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-destructive bg-secondary rounded-lg p-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
