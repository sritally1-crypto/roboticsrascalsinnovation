import { Card } from "@/components/ui/card";
import { CheckCircle, Circle, Loader2, Upload, Camera, Cpu, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingPipelineProps {
  stage: 'upload' | 'processing' | 'reconstructing' | 'complete';
  photoCount?: number;
  progress?: number;
}

export const ProcessingPipeline = ({ stage, photoCount = 0, progress = 0 }: ProcessingPipelineProps) => {
  const stages = [
    { id: 'upload', label: 'Upload Photos', icon: Upload, description: `${photoCount} photos uploaded` },
    { id: 'processing', label: 'Analyze Quality', icon: Camera, description: 'Detecting features & overlap' },
    { id: 'reconstructing', label: '3D Reconstruction', icon: Cpu, description: 'Building point cloud & mesh' },
    { id: 'complete', label: 'View Model', icon: Eye, description: 'Ready for analysis' },
  ];

  const getStageIndex = (stageId: string) => stages.findIndex(s => s.id === stageId);
  const currentIndex = getStageIndex(stage);

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-accent/5">
      <h3 className="text-lg font-semibold mb-6 text-center">Photogrammetry Pipeline</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted mx-12">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
          />
        </div>

        {/* Stages */}
        <div className="relative grid grid-cols-4 gap-4">
          {stages.map((stageItem, index) => {
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex;
            const Icon = stageItem.icon;

            return (
              <div key={stageItem.id} className="flex flex-col items-center text-center">
                {/* Icon Circle */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 relative z-10",
                    isComplete && "bg-primary text-primary-foreground",
                    isActive && "bg-primary/20 text-primary border-2 border-primary animate-pulse",
                    !isActive && !isComplete && "bg-muted text-muted-foreground"
                  )}
                >
                  {isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isComplete ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Label */}
                <div className="space-y-1">
                  <p className={cn(
                    "font-medium text-sm",
                    (isActive || isComplete) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {stageItem.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stageItem.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar (for active stage) */}
        {progress > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing...</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Technical Details */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-muted">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Method:</span>
            <span className="ml-2 font-mono">Structure from Motion</span>
          </div>
          <div>
            <span className="text-muted-foreground">Algorithm:</span>
            <span className="ml-2 font-mono">Multi-View Stereo</span>
          </div>
          <div>
            <span className="text-muted-foreground">Feature Detection:</span>
            <span className="ml-2 font-mono">SIFT + Harris</span>
          </div>
          <div>
            <span className="text-muted-foreground">Accuracy:</span>
            <span className="ml-2 font-mono text-primary">±0.05mm</span>
          </div>
        </div>
      </div>
    </Card>
  );
};