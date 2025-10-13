import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Brain, Database, Calendar, MapPin, Microscope, Zap, Upload, FileImage, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIAnalysisProps {
  scanData?: any;
  artifactImage?: string;
}

interface AnalysisResult {
  material: string;
  confidence: number;
  period: string;
  culture: string;
  function: string;
  location: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    volume: number;
    accuracy: string;
  };
  condition: {
    overall: string;
    damage: string[];
    preservation: number;
    recommendations: string[];
  };
  verification: {
    datasetSize: string;
    validationScore: number;
    crossReferences: number;
    uncertainties: string[];
  };
  matches: Array<{
    name: string;
    similarity: number;
    museum: string;
    period: string;
    confidence: number;
    verified: boolean;
  }>;
  detailedAnalysis?: string;
}

export const AIAnalysis = ({ scanData, artifactImage }: AIAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(artifactImage || null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        toast.success("Image uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!uploadedImage) {
      toast.error("Please upload an artifact image first");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setResults(null);

    try {
      const steps = [
        "Uploading image to AI...",
        "Analyzing visual features...",
        "Identifying material composition...",
        "Cross-referencing databases...",
        "Generating report..."
      ];

      let currentStepIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentStepIndex < steps.length) {
          setCurrentStep(steps[currentStepIndex]);
          setProgress((currentStepIndex + 1) * 20);
          currentStepIndex++;
        }
      }, 1500);

      console.log("Calling analyze-artifact function...");
      const { data, error } = await supabase.functions.invoke("analyze-artifact", {
        body: {
          imageData: uploadedImage,
          scanData: scanData
        }
      });

      clearInterval(progressInterval);

      if (error) {
        console.error("Analysis error:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No analysis data received");
      }

      console.log("Analysis complete:", data);
      setResults(data as AnalysisResult);
      setProgress(100);
      toast.success("AI analysis complete!");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Analysis failed. Please try again.");
      setResults(null);
    } finally {
      setIsAnalyzing(false);
      setCurrentStep("");
    }
  };

  useEffect(() => {
    if (artifactImage) {
      setUploadedImage(artifactImage);
    }
  }, [artifactImage]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-accent";
    if (confidence >= 60) return "text-discovery-gold";
    return "text-destructive";
  };

  const handlePostToFeed = async () => {
    if (!results || !uploadedImage) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to post to the public feed");
        return;
      }

      const { error } = await supabase.from('discoveries').insert([{
        user_id: user.id,
        title: `${results.material} - ${results.period}`,
        description: results.detailedAnalysis || `${results.function} from ${results.location}`,
        type: 'ai_analysis',
        thumbnail_url: uploadedImage,
        metadata: results as any
      }]);

      if (error) throw error;
      
      toast.success("Posted to public feed!");
    } catch (error) {
      console.error("Error posting to feed:", error);
      toast.error("Failed to post to public feed");
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-professional-blue/20 to-accent/20">
          <Brain className="h-6 w-6 text-professional-blue" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Analysis</h2>
          <p className="text-sm text-muted-foreground">Advanced artifact identification and classification</p>
        </div>
      </div>

      {!isAnalyzing && !results && (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-border rounded-lg">
            {uploadedImage ? (
              <div className="relative w-full max-w-md">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded artifact" 
                  className="w-full h-auto rounded-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setUploadedImage(null)}
                >
                  Change Image
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-3 py-8">
                <div className="p-4 rounded-full bg-muted">
                  <FileImage className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Upload Artifact Image</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click to select or drag and drop
                  </p>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
          
          <Button 
            onClick={runAnalysis} 
            size="lg" 
            className="w-full bg-gradient-to-r from-professional-blue to-accent"
            disabled={!uploadedImage}
          >
            <Brain className="mr-2 h-5 w-5" />
            Analyze with Gemini AI
          </Button>
        </div>
      )}

      {isAnalyzing && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-professional-blue/30 border-t-professional-blue rounded-full animate-spin" />
            <p className="font-medium text-foreground">Analyzing Artifact...</p>
            <p className="text-sm text-muted-foreground mt-1">{currentStep}</p>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-center text-sm text-muted-foreground">{progress}% Complete</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {uploadedImage && (
            <div className="mb-4">
              <img 
                src={uploadedImage} 
                alt="Analyzed artifact" 
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
          
          {/* Primary Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-primary" />
                <span className="font-medium">Material Analysis</span>
              </div>
              <div className="pl-7">
                <p className="text-lg font-semibold text-foreground">{results.material}</p>
                <p className={`text-sm font-medium ${getConfidenceColor(results.confidence)}`}>
                  {results.confidence}% confidence
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">Historical Period</span>
              </div>
              <div className="pl-7">
                <p className="text-lg font-semibold text-foreground">{results.period}</p>
                <p className="text-sm text-muted-foreground">{results.culture}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Origin Region</span>
              </div>
              <div className="pl-7">
                <p className="text-lg font-semibold text-foreground">{results.location}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <span className="font-medium">Function</span>
              </div>
              <div className="pl-7">
                <p className="text-lg font-semibold text-foreground">{results.function}</p>
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          {results.detailedAnalysis && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Detailed Analysis</h3>
              <p className="text-foreground leading-relaxed">{results.detailedAnalysis}</p>
            </div>
          )}

          {/* Similar Artifacts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Similar Artifacts in Global Database</h3>
            <div className="space-y-3">
              {results.matches.map((match, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{match.name}</p>
                    <p className="text-sm text-muted-foreground">{match.museum}</p>
                  </div>
                  <Badge variant="secondary" className="bg-accent/10 text-accent">
                    {match.similarity}% match
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePostToFeed} className="flex-1 bg-gradient-to-r from-primary to-accent">
              <Share2 className="mr-2 h-4 w-4" />
              Post to Public Feed
            </Button>
            <Button variant="outline" className="flex-1">
              Export Analysis Report
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};