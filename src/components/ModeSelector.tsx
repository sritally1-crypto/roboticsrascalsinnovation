import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Eye, Microscope, TrendingUp } from "lucide-react";

interface ModeSelectorProps {
  selectedMode: 'professional' | 'public';
  onModeChange: (mode: 'professional' | 'public') => void;
}

export const ModeSelector = ({ selectedMode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="flex gap-4 p-6 max-w-4xl mx-auto">
      <Card 
        className={`flex-1 p-6 cursor-pointer transition-all duration-300 ${
          selectedMode === 'professional' 
            ? 'bg-gradient-to-br from-professional-blue/10 to-accent/10 border-professional-blue shadow-professional' 
            : 'hover:shadow-md'
        }`}
        onClick={() => onModeChange('professional')}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-professional-blue/10">
            <Microscope className="h-6 w-6 text-professional-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Professional Mode</h3>
            <p className="text-sm text-muted-foreground">Advanced tools for archaeologists and researchers</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-professional-blue">
          <Users className="h-4 w-4" />
          <span>Collaboration Hub</span>
        </div>
      </Card>

      <Card 
        className={`flex-1 p-6 cursor-pointer transition-all duration-300 ${
          selectedMode === 'public' 
            ? 'bg-gradient-to-br from-discovery-gold/10 to-primary/10 border-discovery-gold shadow-artifact' 
            : 'hover:shadow-md'
        }`}
        onClick={() => onModeChange('public')}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-discovery-gold/10">
            <Eye className="h-6 w-6 text-discovery-gold" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Public Mode</h3>
            <p className="text-sm text-muted-foreground">Discover archaeology in an engaging feed</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-discovery-gold">
          <TrendingUp className="h-4 w-4" />
          <span>Discovery Feed</span>
        </div>
      </Card>
    </div>
  );
};