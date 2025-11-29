import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface ModelUploaderProps {
  onModelUploaded: (file: File, url: string) => void;
}

export const ModelUploader = ({ onModelUploaded }: ModelUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    const url = URL.createObjectURL(file);
    onModelUploaded(file, url);
    toast.success('Photo uploaded successfully!');
    
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    const url = URL.createObjectURL(file);
    onModelUploaded(file, url);
    toast.success('Photo uploaded successfully!');
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
        <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Upload Photo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop your photo here, or click to browse
        </p>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Select Photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="mt-6 space-y-4">
        <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Photography Tips
          </h4>
          
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>✓ <strong>Take multiple photos:</strong> Capture 10-20 shots from all angles around your artifact</li>
            <li>✓ <strong>Good lighting:</strong> Use even lighting without harsh shadows (natural light works great)</li>
            <li>✓ <strong>Include scale:</strong> Place a ruler or coin next to the artifact for size reference</li>
            <li>✓ <strong>Keep it stable:</strong> Make sure your artifact doesn't move between shots</li>
          </ul>
        </div>

        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <h5 className="font-medium text-sm mb-2">📱 Recommended Tools for 3D Scanning</h5>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <strong>Polycam</strong> (iOS/Android) - Scan with your phone camera, free version available</li>
            <li>• <strong>Meshroom</strong> (Desktop) - Free software for creating 3D models from photos</li>
          </ul>
        </div>

        <div className="p-3 bg-muted/30 rounded border border-muted">
          <p className="text-xs text-muted-foreground text-center">
            💡 Search YouTube for "3D scanning tutorial" for step-by-step guides
          </p>
        </div>
      </div>
    </Card>
  );
};