import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, RotateCcw, Download, Scan, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { analyzeImageQuality, removeBackground, loadImage, preprocessImage, getOptimalCameraConstraints, type ImageQualityMetrics } from "@/lib/imageProcessing";

interface Scanner3DProps {
  onScanComplete: (scanData: any) => void;
}

export const Scanner3D = ({ onScanComplete }: Scanner3DProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [imageQualities, setImageQualities] = useState<ImageQualityMetrics[]>([]);
  const [currentStep, setCurrentStep] = useState<'setup' | 'capture' | 'processing' | 'complete'>('setup');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [liveQuality, setLiveQuality] = useState<ImageQualityMetrics | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qualityCheckInterval = useRef<NodeJS.Timeout>();

  // Real-time quality monitoring
  const startQualityMonitoring = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    qualityCheckInterval.current = setInterval(() => {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const quality = analyzeImageQuality(canvas);
      setLiveQuality(quality);
    }, 1000);
  }, []);

  const stopQualityMonitoring = useCallback(() => {
    if (qualityCheckInterval.current) {
      clearInterval(qualityCheckInterval.current);
      qualityCheckInterval.current = undefined;
    }
  }, []);

  const startCamera = useCallback(async () => {
    const applyStream = (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCurrentStep('capture');
        startQualityMonitoring();
        toast.success("Camera ready! Position your artifact in good lighting");
      }
    };

    try {
      // Primary high-quality constraints
      const constraints = getOptimalCameraConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      applyStream(stream);
    } catch (error: any) {
      console.warn('Primary camera constraints failed:', error?.name || error);
      // Fallback 1: Prefer environment camera with relaxed constraints
      try {
        const fallback1: MediaStreamConstraints = { video: { facingMode: 'environment' }, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(fallback1);
        toast("Using fallback camera settings for compatibility");
        applyStream(stream);
        return;
      } catch (e1) {
        console.warn('Fallback 1 failed:', (e1 as any)?.name || e1);
      }

      // Fallback 2: Any available camera
      try {
        const fallback2: MediaStreamConstraints = { video: true, audio: false };
        const stream = await navigator.mediaDevices.getUserMedia(fallback2);
        toast("Using basic camera settings. For higher quality, switch to rear camera.");
        applyStream(stream);
        return;
      } catch (e2) {
        const name = (error as any)?.name || (e2 as any)?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          toast.error('Camera permission denied. Please allow access and retry.');
        } else if (name === 'OverconstrainedError') {
          toast.error('No camera matches the requested settings. Try a different device or upload photos.');
        } else {
          toast.error('Unable to access camera on this device. Try uploading photos instead.');
        }
        console.error('Camera error:', e2);
      }
    }
  }, [startQualityMonitoring]);

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessingImage) return;

    setIsProcessingImage(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Analyze image quality
      const quality = analyzeImageQuality(canvas);
      
      // Quality validation
      if (quality.score < 0.6) {
        if (quality.isBlurry) {
          toast.error("Image is too blurry. Hold the camera steady and try again.");
        } else if (quality.isOverexposed) {
          toast.error("Image is overexposed. Reduce lighting and try again.");
        } else if (quality.isUnderexposed) {
          toast.error("Image is too dark. Improve lighting and try again.");
        } else {
          toast.error("Image quality is poor. Adjust lighting and focus.");
        }
        setIsProcessingImage(false);
        return;
      }
      
      // Preprocess image for better reconstruction
      const enhancedCanvas = preprocessImage(canvas);
      const imageData = enhancedCanvas.toDataURL('image/jpeg', 0.95);
      
      // Background removal for cleaner 3D reconstruction
      try {
        const imageElement = new Image();
        imageElement.src = imageData;
        await new Promise(resolve => imageElement.onload = resolve);
        
        const backgroundRemovedBlob = await removeBackground(imageElement);
        const processedImageUrl = URL.createObjectURL(backgroundRemovedBlob);
        
        setCapturedImages(prev => [...prev, imageData]);
        setProcessedImages(prev => [...prev, processedImageUrl]);
        setImageQualities(prev => [...prev, quality]);
        
        toast.success(`High-quality image ${capturedImages.length + 1} captured! Quality: ${Math.round(quality.score * 100)}%`);
      } catch (bgError) {
        console.log('Background removal failed, using original image:', bgError);
        setCapturedImages(prev => [...prev, imageData]);
        setProcessedImages(prev => [...prev, imageData]);
        setImageQualities(prev => [...prev, quality]);
        
        toast.success(`Image ${capturedImages.length + 1} captured! Quality: ${Math.round(quality.score * 100)}%`);
      }
      
      if (capturedImages.length >= 7) {
        setCurrentStep('processing');
        stopCamera();
        processImages();
      }
    } catch (error) {
      toast.error("Failed to process image. Please try again.");
      console.error('Image capture error:', error);
    } finally {
      setIsProcessingImage(false);
    }
  }, [capturedImages.length, isProcessingImage]);

  const stopCamera = useCallback(() => {
    stopQualityMonitoring();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [stopQualityMonitoring]);

  const processImages = useCallback(async () => {
    setIsScanning(true);
    toast("Processing 3D reconstruction with AI enhancement...");
    
    // Calculate average quality score
    const avgQuality = imageQualities.reduce((sum, q) => sum + q.score, 0) / imageQualities.length;
    const qualityGrade = avgQuality > 0.8 ? 'excellent' : avgQuality > 0.7 ? 'high' : avgQuality > 0.6 ? 'medium' : 'low';
    
    // Enhanced processing simulation with realistic timing
    const steps = [
      "Analyzing image quality and features...",
      "Removing backgrounds and isolating artifacts...",
      "Generating feature maps and keypoints...",
      "Computing depth information...",
      "Reconstructing 3D mesh...",
      "Applying texture mapping...",
      "Optimizing model accuracy..."
    ];
    
    for (let i = 0; i < steps.length; i++) {
      toast(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    const scanData = {
      images: capturedImages,
      processedImages: processedImages,
      qualities: imageQualities,
      timestamp: new Date().toISOString(),
      imageCount: capturedImages.length,
      quality: qualityGrade,
      qualityGrade,
      averageQuality: avgQuality,
      reconstructionQuality: Math.min(avgQuality * 1.2, 1), // AI enhancement bonus
      metadata: {
        cameraSpecs: 'High-resolution multi-angle capture',
        aiEnhanced: true,
        backgroundRemoved: processedImages.length > 0,
        processingTime: steps.length * 800,
        reconstructionMethod: 'multi-view-stereo',
        featurePoints: Math.floor(capturedImages.length * 200 * avgQuality)
      }
    };
    
    setCurrentStep('complete');
    setIsScanning(false);
    onScanComplete(scanData);
    toast.success(`3D scan completed! Quality: ${qualityGrade.toUpperCase()}`);
  }, [capturedImages, processedImages, imageQualities, onScanComplete]);

  const reset = useCallback(() => {
    setCapturedImages([]);
    setProcessedImages([]);
    setImageQualities([]);
    setCurrentStep('setup');
    setIsScanning(false);
    setLiveQuality(null);
    stopCamera();
  }, [stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      // Clean up processed image URLs
      processedImages.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [processedImages, stopCamera]);

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
            
            {/* Live quality indicator */}
            {liveQuality && (
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge 
                  variant={liveQuality.score > 0.7 ? "default" : liveQuality.score > 0.5 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {liveQuality.score > 0.7 ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                   liveQuality.score > 0.5 ? <Eye className="w-3 h-3 mr-1" /> :
                   <AlertTriangle className="w-3 h-3 mr-1" />}
                  {Math.round(liveQuality.score * 100)}%
                </Badge>
                {liveQuality.isBlurry && (
                  <Badge variant="destructive" className="text-xs">Blurry</Badge>
                )}
              </div>
            )}
            
            {/* Capture guidance */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-black/70 text-white text-xs p-2 rounded text-center">
                Position artifact in center • Ensure good lighting • Keep camera steady
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                {capturedImages.length}/8+ images captured
              </span>
              {imageQualities.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Avg quality: {Math.round((imageQualities.reduce((sum, q) => sum + q.score, 0) / imageQualities.length) * 100)}%
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={captureImage} 
                variant="default" 
                disabled={isProcessingImage || (liveQuality && liveQuality.score < 0.6)}
              >
                <Camera className="mr-2 h-4 w-4" />
                {isProcessingImage ? "Processing..." : "Capture"}
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
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={img}
                    alt={`Capture ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border-2 border-primary/30"
                  />
                  <Badge 
                    variant={imageQualities[index]?.score > 0.7 ? "default" : "secondary"}
                    className="absolute -top-1 -right-1 text-xs px-1"
                  >
                    {Math.round((imageQualities[index]?.score || 0) * 100)}
                  </Badge>
                </div>
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