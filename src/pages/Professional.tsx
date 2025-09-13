import { useState, useRef, useCallback } from "react";
import { Scanner3D } from "@/components/Scanner3D";
import { Viewer3D } from "@/components/Viewer3D";
import { AIAnalysis } from "@/components/AIAnalysis";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Users, Settings } from "lucide-react";
import { analyzeImageQuality, removeBackground, loadImage, preprocessImage } from "@/lib/imageProcessing";
import { toast } from "sonner";

const Professional = () => {
  const [scanData, setScanData] = useState(null);
  const [activeTab, setActiveTab] = useState("scan");

  const handleScanComplete = (data: any) => {
    setScanData(data);
    setActiveTab("viewer");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stone-light to-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Professional Workspace</h1>
          <p className="text-muted-foreground">Advanced tools for archaeological research and collaboration</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Scanner3D onScanComplete={handleScanComplete} />
              
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Upload</h3>
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                    if (files.length) {
                      processUploads(files);
                    } else {
                      toast.error('Please drop image files');
                    }
                  }}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Drag and drop images or click to upload
                  </p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Select Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Upload artifact images"
                  />
                </div>
              </Card>
            </div>
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