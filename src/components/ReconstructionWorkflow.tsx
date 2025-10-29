import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, FileImage, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { reconstructFrom3DPhotos } from '@/lib/browserPhotogrammetry';

interface ReconstructionWorkflowProps {
  onModelGenerated?: (modelUrl: string) => void;
}

export const ReconstructionWorkflow = ({ onModelGenerated }: ReconstructionWorkflowProps) => {
  const [artifactName, setArtifactName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modelBlob, setModelBlob] = useState<Blob | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length < 3) {
      toast.error('Please upload at least 3 photos for reconstruction');
      return;
    }
    if (files.length > 20) {
      toast.error('Maximum 20 photos allowed for browser processing');
      return;
    }
    setPhotos(files);
    toast.success(`${files.length} photos selected`);
  };

  const handleReconstruct = async () => {
    if (!artifactName.trim()) {
      toast.error('Please enter an artifact name');
      return;
    }

    if (photos.length < 3) {
      toast.error('Please upload at least 3 photos');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus('loading');
      toast.info('Starting in-browser 3D reconstruction...');

      // Process images in the browser using depth estimation
      const result = await reconstructFrom3DPhotos(photos, (progress, status) => {
        setUploadProgress(progress);
        setProcessingStatus(status);
      });

      // Export to GLB
      const blob = await result.exportGLB();
      setModelBlob(blob);
      
      // Create a URL for the model
      const modelUrl = URL.createObjectURL(blob);
      onModelGenerated?.(modelUrl);
      
      setIsProcessing(false);
      toast.success('3D model generated successfully in your browser!');
      
    } catch (error) {
      console.error('Reconstruction error:', error);
      toast.error('Failed to reconstruct 3D model. Please try different photos.');
      setIsProcessing(false);
    }
  };

  const resetWorkflow = () => {
    setPhotos([]);
    setArtifactName('');
    setModelBlob(null);
    setProcessingStatus('');
    setUploadProgress(0);
  };

  const handleDownload = () => {
    if (!modelBlob) return;
    
    const url = URL.createObjectURL(modelBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifactName.replace(/\s+/g, '_')}_3d_model.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Model downloaded successfully!');
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          In-Browser 3D Reconstruction
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload 3+ photos from different angles. AI-powered depth estimation will generate a 3D model right in your browser - completely free, no cloud processing!
        </p>
      </div>

      {!modelBlob ? (
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
              Photos (3-20 images)
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
            {photos.length > 0 && photos.length < 3 && (
              <p className="text-sm text-destructive mt-1">
                At least 3 photos required for reconstruction
              </p>
            )}
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Photo Tips:</strong>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Take 5-15 photos from different angles (360° coverage works best)</li>
                <li>Use consistent, even lighting</li>
                <li>Keep artifact in sharp focus</li>
                <li>Avoid extreme shadows and reflections</li>
                <li>More photos = better reconstruction quality</li>
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
                {processingStatus || 'Processing in your browser...'}
              </p>
            </div>
          )}

          <Button
            onClick={handleReconstruct}
            disabled={isProcessing || photos.length < 3 || !artifactName.trim()}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing in Browser...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate 3D Model (Free & In-Browser)
              </>
            )}
          </Button>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Powered by AI Depth Estimation:</strong> Uses advanced computer vision to estimate depth from photos and generate 3D meshes. All processing happens in your browser using your device's GPU - completely free, private, and offline-capable!
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert className="bg-primary/10 border-primary">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>3D Model Generated Successfully!</strong>
              <p className="mt-2 text-sm">Your artifact has been reconstructed in your browser.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-card space-y-3">
              <div>
                <h4 className="font-semibold mb-1">Artifact: {artifactName}</h4>
                <p className="text-sm text-muted-foreground">
                  Generated from {photos.length} photos using AI depth estimation
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download .glb Model
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-sm">
                <strong>What just happened?</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>AI analyzed your photos and estimated depth maps</li>
                  <li>Generated a 3D mesh with texture mapping</li>
                  <li>All processing done locally in your browser (100% private)</li>
                  <li>Download the model and upload it above to view with full features!</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <Button
            variant="outline"
            onClick={resetWorkflow}
            className="w-full"
          >
            Start New Reconstruction
          </Button>
        </div>
      )}
    </Card>
  );
};
