import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileImage, Upload, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReconstructionWorkflowProps {
  onModelGenerated?: (modelUrl: string) => void;
}

export const ReconstructionWorkflow = ({ onModelGenerated }: ReconstructionWorkflowProps) => {
  const [artifactName, setArtifactName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length < 10) {
      toast.error('Please upload at least 10 photos for accurate reconstruction');
      return;
    }
    setPhotos(files);
  };

  const handleUpload = async () => {
    if (!artifactName.trim()) {
      toast.error('Please enter an artifact name');
      return;
    }

    if (photos.length < 10) {
      toast.error('Please upload at least 10 photos');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('artifactName', artifactName);
      photos.forEach(photo => formData.append('photos', photo));

      setUploadProgress(30);

      const { data, error } = await supabase.functions.invoke('upload-reconstruction-photos', {
        body: formData,
      });

      if (error) throw error;

      setUploadProgress(100);
      setJobId(data.jobId);
      setSignedUrls(data.signedUrls);
      
      toast.success(`Uploaded ${data.photoCount} photos successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const generateColabNotebook = () => {
    if (!jobId || signedUrls.length === 0) return;

    const notebookContent = `# Archaeo-Link 3D Reconstruction
# Artifact: ${artifactName}
# Job ID: ${jobId}

# Step 1: Install dependencies
!apt update && apt install -y colmap
!pip install trimesh pygltflib requests

# Step 2: Download photos from Supabase
import requests
import os
from pathlib import Path

photo_urls = ${JSON.stringify(signedUrls, null, 2)}

img_folder = Path("/content/images")
img_folder.mkdir(exist_ok=True)

for i, url in enumerate(photo_urls):
    response = requests.get(url)
    with open(img_folder / f"photo_{i+1}.jpg", 'wb') as f:
        f.write(response.content)
    print(f"Downloaded photo {i+1}/{len(photo_urls)}")

# Step 3: Run COLMAP photogrammetry
!mkdir -p /content/output/sparse /content/output/dense
!colmap feature_extractor --database_path /content/output/database.db --image_path /content/images
!colmap exhaustive_matcher --database_path /content/output/database.db
!colmap mapper --database_path /content/output/database.db --image_path /content/images --output_path /content/output/sparse
!colmap image_undistorter --image_path /content/images --input_path /content/output/sparse/0 --output_path /content/output/dense --output_type COLMAP
!colmap patch_match_stereo --workspace_path /content/output/dense --workspace_format COLMAP --PatchMatchStereo.geom_consistency true
!colmap stereo_fusion --workspace_path /content/output/dense --workspace_format COLMAP --input_type geometric --output_path /content/output/dense/fused.ply
!colmap poisson_mesher --input_path /content/output/dense/fused.ply --output_path /content/output/dense/meshed.ply

# Step 4: Convert to GLB
import trimesh
mesh = trimesh.load('/content/output/dense/meshed.ply')
mesh.export('/content/output/meshed.glb')

# Step 5: Download the result
from google.colab import files
files.download('/content/output/meshed.glb')

print("✅ 3D Model generated! Upload the .glb file to Archaeo-Link.")
`;

    const blob = new Blob([notebookContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archaeo_link_${jobId}.py`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Colab script downloaded! Follow the instructions below.');
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Free 3D Reconstruction with Google Colab
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload photos, then process them with free COLMAP photogrammetry in Google Colab
        </p>
      </div>

      {!jobId ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="artifact-name">Artifact Name</Label>
            <Input
              id="artifact-name"
              value={artifactName}
              onChange={(e) => setArtifactName(e.target.value)}
              placeholder="e.g., Ancient Pottery Fragment"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="photos">
              Photos (minimum 10, recommended 20-50)
            </Label>
            <div className="mt-2 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById('photo-input')?.click()}
                disabled={uploading}
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
            {photos.length > 0 && photos.length < 10 && (
              <p className="text-sm text-destructive mt-1">
                At least 10 photos required for quality reconstruction
              </p>
            )}
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Photo Tips:</strong>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>Take 20-50 photos from all angles</li>
                <li>Overlap each photo by 60-80%</li>
                <li>Use good lighting (avoid shadows)</li>
                <li>Keep the artifact in focus</li>
              </ul>
            </AlertDescription>
          </Alert>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Uploading {photos.length} photos...
              </p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || photos.length < 10 || !artifactName.trim()}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Photos
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert className="bg-primary/10 border-primary">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>Photos uploaded successfully!</strong> Follow the steps below to generate your 3D model.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Download Colab Script</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Download the Python script pre-configured with your photos
                </p>
                <Button variant="outline" size="sm" onClick={generateColabNotebook}>
                  Download Script
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Open Google Colab</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Free GPU processing (no account limits)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://colab.research.google.com/', '_blank')}
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Open Colab
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Run the Script</h4>
                <p className="text-sm text-muted-foreground">
                  Upload the script to Colab → Run all cells → Wait 10-20 minutes → Download the .glb file
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Upload 3D Model</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload the generated .glb file using the "Upload 3D Model" section above
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Processing Time:</strong> COLMAP reconstruction typically takes 10-20 minutes depending on photo count and quality. The process is completely free using Google Colab's GPU.
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            onClick={() => {
              setJobId(null);
              setPhotos([]);
              setArtifactName('');
              setSignedUrls([]);
            }}
            className="w-full"
          >
            Start New Reconstruction
          </Button>
        </div>
      )}
    </Card>
  );
};