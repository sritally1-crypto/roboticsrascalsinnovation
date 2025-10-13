import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Scanner3D } from "@/components/Scanner3D";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ModelUploader } from "@/components/ModelUploader";
import { Viewer3D } from "@/components/Viewer3D";
import { AIAnalysis } from "@/components/AIAnalysis";
import { ReconstructionWorkflow } from "@/components/ReconstructionWorkflow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Users, Settings, Camera, FileBox, Cpu, LogOut } from "lucide-react";
import { analyzeImageQuality, removeBackground, loadImage, preprocessImage } from "@/lib/imageProcessing";
import { type ImageQualityMetrics } from "@/lib/imageProcessing";
import { toast } from "sonner";

const Professional = () => {
  const navigate = useNavigate();
  const [scanData, setScanData] = useState(null);
  const [activeTab, setActiveTab] = useState("scan");
  const [scanMode, setScanMode] = useState<'live' | 'upload' | 'model' | 'reconstruction'>('model');
  const [modelFile, setModelFile] = useState<{ file: File; url: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-stone-light to-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleScanComplete = (data: any) => {
    setScanData(data);
    setActiveTab("viewer");
    toast.success("3D scan completed successfully!");
  };

  const handlePhotosProcessed = async (photos: HTMLImageElement[], qualities: ImageQualityMetrics[]) => {
    // Photos are now for documentation and AI analysis only
    const reconstructionData = {
      images: photos.map(photo => photo.src),
      processedImages: photos.map(photo => photo.src),
      qualities: qualities,
      timestamp: new Date().toISOString(),
      imageCount: photos.length,
      quality: 'documentation',
      metadata: {
        cameraSpecs: `${photos.length} photos for documentation`,
        source: 'Photo upload',
      }
    };
    
    setScanData(reconstructionData);
    toast.success(`${photos.length} photos uploaded for AI analysis and documentation`);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processUploads = useCallback(async (filesInput: FileList | File[]) => {
    const files = Array.from(filesInput);
    if (!files.length) return;

    toast("Processing uploaded images for 3D reconstruction...");

    const capturedImages: string[] = [];
    const processedImages: string[] = [];
    const qualities: any[] = [];

    for (const file of files) {
      try {
        const img = await loadImage(file);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const quality = analyzeImageQuality(canvas);
        const enhancedCanvas = preprocessImage(canvas);
        const imageData = enhancedCanvas.toDataURL('image/jpeg', 0.95);
        capturedImages.push(imageData);

        try {
          const bgBlob = await removeBackground(img);
          const url = URL.createObjectURL(bgBlob);
          processedImages.push(url);
        } catch (bgErr) {
          console.warn('Background removal failed for', file.name, bgErr);
          processedImages.push(imageData);
        }

        qualities.push(quality);
      } catch (err) {
        console.error('Upload processing error:', err);
        toast.error(`Failed to process ${file.name}`);
      }
    }

    if (capturedImages.length === 0) {
      toast.error('No valid images processed.');
      return;
    }

    const avgQuality = qualities.reduce((s: number, q: any) => s + (q?.score || 0), 0) / qualities.length;
    const qualityGrade = avgQuality > 0.8 ? 'excellent' : avgQuality > 0.7 ? 'high' : avgQuality > 0.6 ? 'medium' : 'low';

    const data = {
      images: capturedImages,
      processedImages,
      qualities,
      timestamp: new Date().toISOString(),
      imageCount: capturedImages.length,
      qualityGrade,
      averageQuality: avgQuality,
      reconstructionQuality: Math.min(avgQuality * 1.2, 1),
      metadata: {
        cameraSpecs: 'Uploaded images',
        aiEnhanced: true,
        backgroundRemoved: processedImages.length > 0,
        processingTime: 0,
      },
    };

    handleScanComplete(data);
    toast.success(`Uploaded ${capturedImages.length} image${capturedImages.length > 1 ? 's' : ''}.`);
  }, [handleScanComplete]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processUploads(e.target.files);
      e.currentTarget.value = '';
    }
  };

  const handleModelUploaded = (file: File, url: string) => {
    setModelFile({ file, url });
    const data = {
      modelUrl: url,
      modelFile: file,
      timestamp: new Date().toISOString(),
      quality: 'external',
      metadata: {
        filename: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        source: 'Meshroom/Polycam',
      },
    };
    setScanData(data);
    setActiveTab('viewer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stone-light to-background">
      <div className="container mx-auto p-6">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Professional Workspace</h1>
            <p className="text-muted-foreground">Advanced tools for archaeological research and collaboration</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              3D Scanner
            </TabsTrigger>
            <TabsTrigger value="viewer" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              3D Viewer
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="collaborate" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaborate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-center gap-2 mb-6 flex-wrap">
                <Button
                  variant={scanMode === 'model' ? 'default' : 'outline'}
                  onClick={() => setScanMode('model')}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <FileBox className="h-5 w-5" />
                  Upload .glb Model
                </Button>
                <Button
                  variant={scanMode === 'reconstruction' ? 'default' : 'outline'}
                  onClick={() => setScanMode('reconstruction')}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Cpu className="h-5 w-5" />
                  3D Reconstruction (Free)
                </Button>
                <Button
                  variant={scanMode === 'upload' ? 'default' : 'outline'}
                  onClick={() => setScanMode('upload')}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photos
                </Button>
                <Button
                  variant={scanMode === 'live' ? 'default' : 'outline'}
                  onClick={() => setScanMode('live')}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Live Camera
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {scanMode === 'model' && (
                  <ModelUploader onModelUploaded={handleModelUploaded} />
                )}

                {scanMode === 'reconstruction' && (
                  <ReconstructionWorkflow 
                    onModelGenerated={(modelUrl) => {
                      toast.success('Model generated! Upload it using the "Upload .glb Model" button above.');
                    }}
                  />
                )}

                {scanMode === 'live' && (
                  <Scanner3D onScanComplete={handleScanComplete} />
                )}
                
                {scanMode === 'upload' && (
                  <PhotoUploader 
                    onPhotosProcessed={handlePhotosProcessed}
                    maxPhotos={20}
                  />
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="viewer" className="space-y-6">
            <Viewer3D scanData={scanData} artifactName="Scanned Artifact" />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <AIAnalysis scanData={scanData} />
          </TabsContent>

          <TabsContent value="collaborate" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Collaboration Hub</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-professional-blue" />
                  <h4 className="font-medium">Expert Network</h4>
                  <p className="text-sm text-muted-foreground">Connect with archaeologists worldwide</p>
                </Card>
                <Card className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-professional-blue" />
                  <h4 className="font-medium">Shared Projects</h4>
                  <p className="text-sm text-muted-foreground">Collaborate on excavation sites</p>
                </Card>
                <Card className="p-4 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-professional-blue" />
                  <h4 className="font-medium">Secure Archive</h4>
                  <p className="text-sm text-muted-foreground">Protected artifact database</p>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Professional;