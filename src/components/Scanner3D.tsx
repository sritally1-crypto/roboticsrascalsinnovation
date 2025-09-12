import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, RotateCcw, Download, Scan } from "lucide-react";
import { toast } from "sonner";

interface Scanner3DProps {
  onScanComplete: (scanData: any) => void;
}

export const Scanner3D = ({ onScanComplete }: Scanner3DProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'setup' | 'capture' | 'processing' | 'complete'>('setup');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCurrentStep('capture');
        toast("Camera ready! Start capturing your artifact from multiple angles");
      }
    } catch (error) {
      toast.error("Camera access denied. Please enable camera permissions.");
      console.error('Camera error:', error);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImages(prev => [...prev, imageData]);
    
    toast(`Image ${capturedImages.length + 1} captured! ${8 - capturedImages.length - 1} more recommended`);
    
    if (capturedImages.length >= 7) {
      setCurrentStep('processing');
      stopCamera();
      processImages();
    }
  }, [capturedImages.length]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const processImages = useCallback(async () => {
    setIsScanning(true);
    toast("Processing 3D reconstruction...");
    
    // Simulate 3D processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const scanData = {
      images: capturedImages,
      timestamp: new Date().toISOString(),
      imageCount: capturedImages.length,
      quality: capturedImages.length >= 8 ? 'high' : 'medium'
    };
    
    setCurrentStep('complete');
    setIsScanning(false);
    onScanComplete(scanData);
    toast.success("3D scan completed successfully!");
  }, [capturedImages, onScanComplete]);

  const reset = useCallback(() => {
    setCapturedImages([]);
    setCurrentStep('setup');
    setIsScanning(false);
    stopCamera();
  }, [stopCamera]);

  return (
    <Card className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">3D Artifact Scanner</h2>
        <p className="text-muted-foreground">
          Capture your artifact from 8+ angles for accurate 3D reconstruction
        </p>
      </div>

      {currentStep === 'setup' && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
            <Scan className="h-10 w-10 text-primary" />
          </div>
          <Button onClick={startCamera} size="lg" className="bg-gradient-to-r from-primary to-accent">
            <Camera className="mr-2 h-5 w-5" />
            Start 3D Scan
          </Button>
        </div>
      )}

      {currentStep === 'capture' && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 border-2 border-dashed border-primary/50 m-4 rounded-lg pointer-events-none" />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {capturedImages.length}/8+ images captured
            </span>
            <div className="flex gap-2">
              <Button onClick={captureImage} variant="default">
                <Camera className="mr-2 h-4 w-4" />
                Capture
              </Button>
              {capturedImages.length >= 4 && (
                <Button onClick={processImages} variant="secondary">
                  Process Scan
                </Button>
              )}
            </div>
          </div>
          
          {capturedImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto p-2">
              {capturedImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Capture ${index + 1}`}
                  className="w-16 h-16 object-cover rounded border-2 border-primary/30"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {currentStep === 'processing' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Processing 3D reconstruction...</p>
        </div>
      )}

      {currentStep === 'complete' && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center">
            <Download className="h-10 w-10 text-accent" />
          </div>
          <p className="text-accent font-medium">3D scan completed!</p>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Scan Another Artifact
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
};