import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Camera, CheckCircle, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { analyzeImageQuality, type ImageQualityMetrics } from "@/lib/imageProcessing";

interface PhotoUploaderProps {
  onPhotosProcessed: (photos: HTMLImageElement[], qualities: ImageQualityMetrics[]) => void;
  maxPhotos?: number;
}

export const PhotoUploader = ({ onPhotosProcessed, maxPhotos = 20 }: PhotoUploaderProps) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [photoQualities, setPhotoQualities] = useState<ImageQualityMetrics[]>([]);
  const [processedImages, setProcessedImages] = useState<HTMLImageElement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList) => {
    const newPhotos = Array.from(files).filter(file => 
      file.type.startsWith('image/') && file.size < 20 * 1024 * 1024 // 20MB limit
    );

    if (newPhotos.length === 0) {
      toast.error("Please select valid image files (max 20MB each)");
      return;
    }

    if (uploadedPhotos.length + newPhotos.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed. Current: ${uploadedPhotos.length}, trying to add: ${newPhotos.length}`);
      return;
    }

    setIsProcessing(true);
    const updatedPhotos = [...uploadedPhotos, ...newPhotos];
    setUploadedPhotos(updatedPhotos);

    try {
      // Process each new photo for quality analysis
      const newQualities: ImageQualityMetrics[] = [];
      const newImages: HTMLImageElement[] = [];

      for (const photo of newPhotos) {
        const img = await loadImageFromFile(photo);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        
        const quality = analyzeImageQuality(canvas);
        newQualities.push(quality);
        newImages.push(img);
        
        if (quality.score < 0.6) {
          toast.warning(`Photo ${photo.name}: Quality ${Math.round(quality.score * 100)}% - Consider retaking for better reconstruction`);
        }
      }

      const allQualities = [...photoQualities, ...newQualities];
      const allImages = [...processedImages, ...newImages];
      
      setPhotoQualities(allQualities);
      setProcessedImages(allImages);
      
      // Process photos for documentation and AI analysis
      if (updatedPhotos.length > 0) {
        toast.success(`${updatedPhotos.length} photos uploaded for AI analysis and documentation`);
        onPhotosProcessed(allImages, allQualities);
      }
    } catch (error) {
      console.error('Error processing photos:', error);
      toast.error("Failed to process some photos. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedPhotos, photoQualities, processedImages, maxPhotos, onPhotosProcessed]);

  const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removePhoto = useCallback((index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    const newQualities = photoQualities.filter((_, i) => i !== index);
    const newImages = processedImages.filter((_, i) => i !== index);
    
    setUploadedPhotos(newPhotos);
    setPhotoQualities(newQualities);
    setProcessedImages(newImages);
    
    if (newImages.length > 0) {
      onPhotosProcessed(newImages, newQualities);
    }
    
    toast(`Removed photo. ${newPhotos.length} photos remaining.`);
  }, [uploadedPhotos, photoQualities, processedImages, onPhotosProcessed]);

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getQualityBadgeVariant = (score: number) => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'destructive';
  };

  const averageQuality = photoQualities.length > 0 
    ? photoQualities.reduce((sum, q) => sum + q.score, 0) / photoQualities.length 
    : 0;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Upload Photos for Documentation & AI Analysis</h3>
          <p className="text-muted-foreground text-sm">
            Upload photos of your artifact for AI analysis and documentation
          </p>
          <div className="mt-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm text-muted-foreground">
              ⚠️ For 3D models, use <strong>Meshroom</strong> or <strong>Polycam</strong> to create .glb files, then upload them in the "Upload .glb Model" section.
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">Drop photos here or click to upload</h4>
          <p className="text-sm text-muted-foreground mb-4">
            JPEG, PNG, WebP • Max 20MB per file • {maxPhotos - uploadedPhotos.length} slots remaining
          </p>
          <Button variant="outline">
            <ImageIcon className="mr-2 h-4 w-4" />
            Select Photos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          />
        </div>

        {/* Photo Requirements */}
        <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
          <h4 className="font-semibold mb-2 flex items-center">
            <Camera className="mr-2 h-4 w-4" />
            Photography Guidelines for Documentation
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Use consistent, diffused lighting</li>
            <li>• Include scale reference (coin, ruler) for context</li>
            <li>• Capture multiple angles for comprehensive documentation</li>
            <li>• These photos will be used for AI analysis and visual records</li>
          </ul>
        </div>

        {/* Upload Progress */}
        {uploadedPhotos.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">
                Uploaded Photos ({uploadedPhotos.length}/{maxPhotos})
              </h4>
              {photoQualities.length > 0 && (
                <Badge variant={getQualityBadgeVariant(averageQuality)}>
                  Avg Quality: {Math.round(averageQuality * 100)}%
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {uploadedPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-muted">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Quality indicator */}
                  {photoQualities[index] && (
                    <div className="absolute top-2 left-2">
                      <Badge variant={getQualityBadgeVariant(photoQualities[index].score)} className="text-xs">
                        {Math.round(photoQualities[index].score * 100)}%
                      </Badge>
                    </div>
                  )}

                  {/* Quality status icon */}
                  {photoQualities[index] && (
                    <div className="absolute top-2 right-8">
                      {photoQualities[index].score >= 0.7 ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  )}

                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* Photo info */}
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {photo.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Documentation Status */}
            <div className="bg-card border rounded-lg p-4">
              <h5 className="font-medium mb-2">Documentation Status</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Photos uploaded:</span>
                  <span className="text-green-500">✓ {uploadedPhotos.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average quality:</span>
                  <span className={averageQuality >= 0.7 ? 'text-green-500' : 'text-yellow-500'}>
                    {Math.round(averageQuality * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ready for AI analysis:</span>
                  <span className="text-green-500">✓ Ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
            <span className="text-sm text-muted-foreground">Processing photos...</span>
          </div>
        )}
      </div>
    </Card>
  );
};