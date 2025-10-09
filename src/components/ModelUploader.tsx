import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileBox } from 'lucide-react';
import { toast } from 'sonner';

interface ModelUploaderProps {
  onModelUploaded: (file: File, url: string) => void;
}

export const ModelUploader = ({ onModelUploaded }: ModelUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      toast.error('Please upload a .glb or .gltf file');
      return;
    }

    const url = URL.createObjectURL(file);
    onModelUploaded(file, url);
    toast.success('3D model loaded successfully!');
    
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      toast.error('Please upload a .glb or .gltf file');
      return;
    }

    const url = URL.createObjectURL(file);
    onModelUploaded(file, url);
    toast.success('3D model loaded successfully!');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Card className="p-8">
      <div 
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <FileBox className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Upload 3D Model</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop your .glb file here, or click to browse
        </p>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Select .glb File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileBox className="h-5 w-5 text-primary" />
            How to Create 3D Models (Free Tools)
          </h4>
          
          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-sm mb-2">🖥️ Option 1: Meshroom (Desktop - Recommended)</h5>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Download free from <a href="https://alicevision.org/#meshroom" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">alicevision.org</a></li>
                <li>• Upload 8-20 photos of your artifact from different angles</li>
                <li>• Meshroom automatically creates a .glb 3D model</li>
                <li>• Takes 5-15 minutes depending on photo count</li>
                <li>• <strong>Best quality</strong> for archaeological artifacts</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-medium text-sm mb-2">📱 Option 2: Polycam (Mobile App)</h5>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Free tier available (iOS/Android)</li>
                <li>• Scan artifacts directly with your phone camera</li>
                <li>• LiDAR support for iPhone Pro models</li>
                <li>• Export as .glb file and upload here</li>
                <li>• <strong>Quick and convenient</strong> for field work</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <h5 className="font-medium text-sm mb-2">💡 Pro Tips for FLL Innovation Project</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Photography:</strong> Take 10-20 overlapping photos in a circle around the artifact</li>
            <li>• <strong>Lighting:</strong> Use diffused, consistent lighting (avoid harsh shadows)</li>
            <li>• <strong>Scale:</strong> Include a ruler or coin for accurate measurements</li>
            <li>• <strong>Processing:</strong> Meshroom uses your computer's GPU (free, no cloud costs)</li>
            <li>• <strong>Innovation:</strong> Show judges real photogrammetry with open-source tools!</li>
          </ul>
        </div>

        <div className="p-3 bg-muted/30 rounded border border-muted">
          <p className="text-xs text-muted-foreground text-center">
            📚 Need help? Search YouTube for "Meshroom tutorial" or "Polycam 3D scanning guide"
          </p>
        </div>
      </div>
    </Card>
  );
};