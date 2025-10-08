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

      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <FileBox className="h-4 w-4" />
          Free Photogrammetry Tools
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>Meshroom (AliceVision):</strong> Free desktop software for photogrammetry</li>
          <li>• <strong>Polycam:</strong> Mobile app with free tier (iOS/Android)</li>
          <li>• Process your photos externally and upload the resulting .glb file here</li>
        </ul>
      </div>
    </Card>
  );
};