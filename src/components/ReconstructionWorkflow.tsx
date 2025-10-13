import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, FileImage, Loader2, CheckCircle2, AlertCircle, ExternalLink, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReconstructionWorkflowProps {
  onModelGenerated?: (modelUrl: string) => void;
}

export const ReconstructionWorkflow = ({ onModelGenerated }: ReconstructionWorkflowProps) => {
  const [artifactName, setArtifactName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Poll for task status
  useEffect(() => {
    if (!taskId || !isProcessing) return;

    const pollInterval = setInterval(async () => {
      try {
        const formData = new FormData();
        formData.append('action', 'status');
        formData.append('taskId', taskId);

        const { data, error } = await supabase.functions.invoke('rodin-reconstruct', {
          body: formData,
        });

        if (error) throw error;

        console.log('Status update:', data);
        
        if (data.status === 'succeeded') {
          setProcessingStatus('completed');
          setModelUrl(data.modelUrl);
          setViewerUrl(data.viewerUrl);
          setIsProcessing(false);
          setUploadProgress(100);
          toast.success('3D model generated successfully!');
          if (data.modelUrl) {
            onModelGenerated?.(data.modelUrl);
          }
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setProcessingStatus('failed');
          setIsProcessing(false);
          toast.error('3D reconstruction failed. Please try again.');
          clearInterval(pollInterval);
        } else {
          setProcessingStatus(data.status);
          setUploadProgress(data.progress || 0);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [taskId, isProcessing, onModelGenerated]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length !== 8) {
      toast.error('Please upload exactly 8 photos for accurate reconstruction');
      return;
    }
    setPhotos(files);
    toast.success('8 photos selected - ready for reconstruction!');
  };

  const handleReconstruct = async () => {
    if (!artifactName.trim()) {
      toast.error('Please enter an artifact name');
      return;
    }

    if (photos.length !== 8) {
      toast.error('Please upload exactly 8 photos');
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress(10);
      setProcessingStatus('uploading');

      // Create FormData with images
      const formData = new FormData();
      formData.append('action', 'submit');
      formData.append('artifactName', artifactName);
      
      photos.forEach((photo, index) => {
        formData.append(`image_${index}`, photo);
      });

      setUploadProgress(30);
      setProcessingStatus('submitting');
      toast.info('Submitting to Rodin AI...');

      // Submit to Rodin via edge function
      const { data, error } = await supabase.functions.invoke('rodin-reconstruct', {
        body: formData,
      });

      if (error) throw error;

      setTaskId(data.taskId);
      setUploadProgress(50);
      setProcessingStatus('processing');
      toast.success('Reconstruction started! This may take 5-10 minutes...');
      
    } catch (error) {
      console.error('Reconstruction error:', error);
      toast.error('Failed to start reconstruction. Please check your API key.');
      setIsProcessing(false);
    }
  };

  const resetWorkflow = () => {
    setTaskId(null);
    setPhotos([]);
    setArtifactName('');
    setModelUrl(null);
    setViewerUrl(null);
    setProcessingStatus('');
    setUploadProgress(0);
  };

  const handlePostToFeed = async () => {
    if (!modelUrl || !artifactName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to post to the public feed");
        return;
      }

      const { error } = await supabase.from('discoveries').insert({
        user_id: user.id,
        title: artifactName,
        description: `Professional 3D reconstruction from ${photos.length} photos using Rodin AI`,
        type: '3d_scan',
        media_url: modelUrl,
        thumbnail_url: viewerUrl,
        metadata: {
          photoCount: photos.length,
          reconstructionMethod: 'Rodin AI',
          viewerUrl: viewerUrl
        }
      });

      if (error) throw error;
      
      toast.success("Posted to public feed!");
    } catch (error) {
      console.error("Error posting to feed:", error);
      toast.error("Failed to post to public feed");
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Professional 3D Reconstruction
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload exactly 8 high-quality photos from different angles. Rodin AI will reconstruct a professional 3D model!
        </p>
      </div>

      {!modelUrl ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="artifact-name">Artifact Name</Label>
            <Input
              id="artifact-name"
              value={artifactName}
              onChange={(e) => setArtifactName(e.target.value)}
              placeholder="e.g., Ancient Pottery Fragment"
              disabled={isProcessing}
            />
          </div>

          <div>
            <Label htmlFor="photos">
              Photos (Exactly 8 required)
            </Label>
            <div className="mt-2 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById('photo-input')?.click()}
                disabled={isProcessing}
                className="w-full"
              >
                <FileImage className="mr-2 h-4 w-4" />
                {photos.length > 0 ? `${photos.length} photos selected` : 'Select Photos'}
              </Button>
              <input
                id="photo-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
            {photos.length > 0 && photos.length !== 8 && (
              <p className="text-sm text-destructive mt-1">
                Exactly 8 photos required (currently: {photos.length})
              </p>
            )}
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>8-Photo Guide:</strong>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Top view, Bottom view (2 photos)</li>
                <li>Front, Back, Left, Right sides (4 photos)</li>
                <li>Two diagonal angles (2 photos)</li>
                <li>Use consistent lighting, sharp focus, and minimal shadows</li>
              </ul>
            </AlertDescription>
          </Alert>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{processingStatus.replace('_', ' ')}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                {processingStatus === 'processing' 
                  ? 'Rodin AI is reconstructing your 3D model... This may take 5-10 minutes.' 
                  : 'Uploading photos to Rodin...'}
              </p>
            </div>
          )}

          <Button
            onClick={handleReconstruct}
            disabled={isProcessing || photos.length !== 8 || !artifactName.trim()}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing with Rodin AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate 3D Model with Rodin AI
              </>
            )}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Powered by Hyper3D Rodin:</strong> Professional AI photogrammetry that reconstructs high-quality 3D models from your 8 photos. Processing takes 5-10 minutes.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert className="bg-primary/10 border-primary">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>3D Model Generated Successfully!</strong>
              <p className="mt-2 text-sm">Your artifact has been reconstructed by Rodin AI from your 8 photos.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-card space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Artifact: {artifactName}</h4>
                <p className="text-sm text-muted-foreground">
                  Reconstructed from 8 photos
                </p>
              </div>

              {viewerUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(viewerUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Rodin 3D Viewer
                </Button>
              )}

              {modelUrl && (
                <Button
                  className="w-full"
                  onClick={() => window.open(modelUrl, '_blank')}
                >
                  Download .glb Model
                </Button>
              )}
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>Next Steps:</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>Download the .glb model file</li>
                  <li>Upload it using "Upload .glb Model" button above</li>
                  <li>Explore your 3D artifact with measurements and AI analysis</li>
                </ol>
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePostToFeed}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Post to Public Feed
            </Button>
            <Button
              variant="outline"
              onClick={resetWorkflow}
              className="flex-1"
            >
              Start New Reconstruction
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
