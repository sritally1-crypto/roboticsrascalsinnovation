import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Database, Calendar, MapPin, Microscope, Zap, Ruler, Shield, AlertTriangle, Info, Search, Download, Beaker, Clock, Wrench } from "lucide-react";
import { toast } from "sonner";

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
}

export const AIAnalysis = ({ scanData, artifactImage }: AIAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setResults(null);

    const steps = [
      { name: "Extracting visual features", duration: 1000 },
      { name: "Analyzing material composition", duration: 1500 },
      { name: "Comparing with global databases", duration: 2000 },
      { name: "Determining cultural context", duration: 1200 },
      { name: "Generating final assessment", duration: 800 }
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i].name);
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      setProgress((i + 1) * 20);
    }

    // Enhanced AI analysis results with professional archaeological data
    const mockResults: AnalysisResult = {
      material: "Ceramic pottery with temper inclusions",
      confidence: 94,
      period: "Late Bronze Age (1200-800 BCE)",
      culture: "Canaanite",
      function: "Storage vessel for grain or liquids",
      location: "Southern Levant region (95% probability)",
      dimensions: {
        length: 64.5,
        width: 42.3,
        height: 38.7,
        volume: 125.8,
        accuracy: "±0.02mm"
      },
      condition: {
        overall: "Good preservation",
        damage: ["Minor rim chip", "Surface weathering", "Small crack at base"],
        preservation: 0.78,
        recommendations: ["Humidity control required", "Handle with support", "Document crack progression"]
      },
      verification: {
        datasetSize: "250,000+ validated artifacts",
        validationScore: 0.91,
        crossReferences: 47,
        uncertainties: ["Exact provenance requires excavation context", "Dating ±50 years due to stylistic variation"]
      },
      matches: [
        {
          name: "Storage Jar Fragment",
          similarity: 89,
          museum: "Israel Museum",
          period: "1000-800 BCE",
          confidence: 92,
          verified: true
        },
        {
          name: "Canaanite Pottery Vessel",
          similarity: 85,
          museum: "Metropolitan Museum",
          period: "1200-1000 BCE",
          confidence: 88,
          verified: true
        },
        {
          name: "Bronze Age Storage Jar",
          similarity: 82,
          museum: "British Museum",
          period: "1100-900 BCE",
          confidence: 84,
          verified: false
        }
      ]
    };

    setResults(mockResults);
    setIsAnalyzing(false);
    setCurrentStep("");
    toast.success("AI analysis complete!");
  };

  useEffect(() => {
    if (scanData && !results) {
      // Auto-run analysis when scan data is available
      setTimeout(runAnalysis, 1000);
    }
  }, [scanData, results]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-accent";
    if (confidence >= 60) return "text-discovery-gold";
    return "text-destructive";
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
        <div className="text-center space-y-4">
          <Button onClick={runAnalysis} size="lg" className="bg-gradient-to-r from-professional-blue to-accent">
            <Zap className="mr-2 h-5 w-5" />
            Start AI Analysis
          </Button>
          <p className="text-sm text-muted-foreground">
            Upload or scan an artifact to begin analysis
          </p>
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

          <Button variant="outline" className="w-full">
            Export Analysis Report
          </Button>
        </div>
      )}
    </Card>
  );
};