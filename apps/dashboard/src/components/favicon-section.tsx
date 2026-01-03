'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Upload, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface FaviconSectionProps {
  facilitatorId: string;
  facilitatorUrl: string;
}

export function FaviconSection({ facilitatorId, facilitatorUrl }: FaviconSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: faviconData, isLoading } = useQuery({
    queryKey: ['favicon', facilitatorId],
    queryFn: () => api.getFavicon(facilitatorId),
  });

  const uploadMutation = useMutation({
    mutationFn: (base64: string) => api.uploadFavicon(facilitatorId, base64),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favicon', facilitatorId] });
      setPreviewUrl(null);
      toast({ title: 'Favicon uploaded', description: 'Your favicon has been updated.' });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload favicon',
        variant: 'destructive',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => api.removeFavicon(facilitatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favicon', facilitatorId] });
      toast({ title: 'Favicon removed', description: 'Your facilitator will use the default icon.' });
    },
    onError: (error) => {
      toast({
        title: 'Removal failed',
        description: error instanceof Error ? error.message : 'Failed to remove favicon',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a .ico, .png, .svg, or .jpg file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 100KB)
    if (file.size > 100 * 1024) {
      toast({
        title: 'File too large',
        description: 'Favicon must be under 100KB.',
        variant: 'destructive',
      });
      return;
    }

    // Read and convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      uploadMutation.mutate(base64);
    };
    reader.onerror = () => {
      toast({
        title: 'Read failed',
        description: 'Could not read the file.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    removeMutation.mutate();
  };

  const currentFavicon = previewUrl || faviconData?.favicon;
  const hasFavicon = !!currentFavicon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          Facilitator Icon
        </CardTitle>
        <CardDescription>
          Shown in browser tabs when users visit your facilitator URL
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-14 h-14 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : hasFavicon ? (
              <img
                src={currentFavicon!}
                alt="Favicon preview"
                className="w-8 h-8 object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Default</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".ico,.png,.svg,.jpg,.jpeg,image/x-icon,image/png,image/svg+xml,image/jpeg"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {hasFavicon ? 'Change Icon' : 'Upload Icon'}
                </>
              )}
            </Button>
            {hasFavicon && !uploadMutation.isPending && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={removeMutation.isPending}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                {removeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Recommended: 32×32px ICO or PNG · Max 100KB
        </p>

        {hasFavicon && (
          <p className="text-xs text-muted-foreground mt-2">
            Preview at{' '}
            <a
              href={`${facilitatorUrl}/favicon.ico`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {facilitatorUrl}/favicon.ico
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

