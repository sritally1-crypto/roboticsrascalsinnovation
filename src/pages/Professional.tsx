import { useState } from "react";
import { Scanner3D } from "@/components/Scanner3D";
import { Viewer3D } from "@/components/Viewer3D";
import { AIAnalysis } from "@/components/AIAnalysis";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Users, Settings } from "lucide-react";

const Professional = () => {
  const [scanData, setScanData] = useState(null);
  const [activeTab, setActiveTab] = useState("scan");

  const handleScanComplete = (data: any) => {
    setScanData(data);
    setActiveTab("viewer");
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
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Drag and drop images or click to upload
                  </p>
                  <Button variant="outline">
                    Select Files
                  </Button>
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