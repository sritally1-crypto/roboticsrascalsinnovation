import { useState } from "react";
import { ModeSelector } from "@/components/ModeSelector";
import { useNavigate } from "react-router-dom";
import Professional from "./Professional";
import Public from "./Public";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe, Users, LogIn } from "lucide-react";

const Index = () => {
  const [selectedMode, setSelectedMode] = useState<'professional' | 'public' | null>(null);
  const navigate = useNavigate();

  if (selectedMode === 'professional') {
    return <Professional />;
  }

  if (selectedMode === 'public') {
    return <Public />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stone-light to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-earth-warm to-accent bg-clip-text text-transparent">
              ArchaeoLink
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Connect ancient discoveries with modern technology. Scan artifacts with AI, explore 3D models, 
            and join a global community of archaeologists and history enthusiasts.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign In to Start Scanning
          </Button>
        </div>

        {/* Mode Selection */}
        <ModeSelector selectedMode={selectedMode} onModeChange={setSelectedMode} />

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-earth-warm/20 rounded-full flex items-center justify-center">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-muted-foreground">
              Advanced computer vision instantly identifies artifacts and provides historical context from global databases.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent/20 to-professional-blue/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3D Scanning & Preservation</h3>
            <p className="text-muted-foreground">
              Create detailed 3D models of artifacts for digital preservation and interactive study without physical handling.
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-discovery-gold/20 to-earth-warm/20 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-discovery-gold" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Global Collaboration</h3>
            <p className="text-muted-foreground">
              Connect with archaeologists worldwide, share discoveries, and bring ancient history to life for everyone.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
