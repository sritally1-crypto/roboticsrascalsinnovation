import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ruler, Target, Zap, Eye, Info } from 'lucide-react';
import { Canvas, useThree } from '@react-three/fiber';
import { Line, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface MeasurementPoint {
  id: string;
  position: [number, number, number];
  label: string;
  confidence: number;
}

interface Measurement {
  id: string;
  points: [MeasurementPoint, MeasurementPoint];
  distance: number;
  accuracy: string;
  type: 'length' | 'width' | 'height' | 'diameter';
}

interface MeasurementOverlayProps {
  measurements?: Measurement[];
  onMeasure?: (measurement: Measurement) => void;
  scanAccuracy?: string;
  calibrationStatus?: boolean;
}

function MeasurementLine({ measurement }: { measurement: Measurement }) {
  const { camera } = useThree();
  const [start, end] = measurement.points.map(p => p.position);
  
  // Calculate midpoint for label
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  return (
    <group>
      {/* Measurement line */}
      <Line
        points={[start, end]}
        color="hsl(var(--primary))"
        lineWidth={3}
      />
      
      {/* Start point marker */}
      <mesh position={start}>
        <sphereGeometry args={[0.02]} />
        <meshBasicMaterial color="hsl(var(--primary))" />
      </mesh>
      
      {/* End point marker */}
      <mesh position={end}>
        <sphereGeometry args={[0.02]} />
        <meshBasicMaterial color="hsl(var(--primary))" />
      </mesh>
      
      {/* Measurement label */}
      <Html position={midpoint} center>
        <div className="bg-black/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-primary/30 text-white text-xs font-mono">
          <div className="flex items-center gap-2">
            <Ruler className="h-3 w-3 text-primary" />
            <span className="font-semibold">{measurement.distance.toFixed(2)} mm</span>
          </div>
          <div className="text-primary/80 text-xs mt-1">
            {measurement.accuracy} • {Math.round(measurement.points[0].confidence * 100)}% confidence
          </div>
        </div>
      </Html>
    </group>
  );
}

export const MeasurementOverlay = ({ 
  measurements = [], 
  onMeasure,
  scanAccuracy = "±0.02mm",
  calibrationStatus = true 
}: MeasurementOverlayProps) => {
  const [selectedTool, setSelectedTool] = useState<'length' | 'diameter' | 'analyze' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mockMeasurements: Measurement[] = [
    {
      id: '1',
      points: [
        { id: 'p1', position: [-0.8, 0.5, 0], label: 'Point A', confidence: 0.97 },
        { id: 'p2', position: [0.8, 0.5, 0], label: 'Point B', confidence: 0.95 }
      ],
      distance: 64.5,
      accuracy: '±0.01mm',
      type: 'length'
    },
    {
      id: '2',
      points: [
        { id: 'p3', position: [0, 0.8, 0], label: 'Point C', confidence: 0.96 },
        { id: 'p4', position: [0, -0.8, 0], label: 'Point D', confidence: 0.94 }
      ],
      distance: 42.3,
      accuracy: '±0.02mm',
      type: 'height'
    }
  ];

  const activeMeasurements = measurements.length > 0 ? measurements : mockMeasurements;

  const handleAutoAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      // Trigger auto-measurement detection
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Measurement Tools */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Precision Measurements
            </h3>
            <p className="text-sm text-muted-foreground">
              Calibrated scale • {scanAccuracy} accuracy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={calibrationStatus ? "default" : "destructive"}>
              {calibrationStatus ? "Calibrated" : "Uncalibrated"}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={selectedTool === 'length' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTool(selectedTool === 'length' ? null : 'length')}
          >
            <Ruler className="h-4 w-4 mr-2" />
            Length
          </Button>
          <Button
            variant={selectedTool === 'diameter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTool(selectedTool === 'diameter' ? null : 'diameter')}
          >
            <Target className="h-4 w-4 mr-2" />
            Diameter
          </Button>
          <Button
            variant={selectedTool === 'analyze' ? 'default' : 'outline'}
            size="sm"
            onClick={handleAutoAnalyze}
            disabled={isAnalyzing}
          >
            <Zap className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Auto-Analyze'}
          </Button>
        </div>

        {/* Measurement Results */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground mb-2">Active Measurements</div>
          {activeMeasurements.map((measurement) => (
            <div key={measurement.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div>
                  <div className="font-mono font-semibold">
                    {measurement.distance.toFixed(2)} mm
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {measurement.type} measurement • {measurement.accuracy}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-xs">
                  {Math.round((measurement.points[0].confidence + measurement.points[1].confidence) / 2 * 100)}% confidence
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3D Measurement Visualization */}
      <Card className="h-64 overflow-hidden">
        <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />
          
          {/* Render measurement lines */}
          {activeMeasurements.map((measurement) => (
            <MeasurementLine key={measurement.id} measurement={measurement} />
          ))}
          
          {/* Reference grid */}
          <gridHelper args={[4, 20, 'hsl(var(--primary))', 'hsl(var(--muted-foreground))']} />
        </Canvas>
      </Card>

      {/* Precision Information */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold text-primary mb-2">Measurement Precision</h4>
            <div className="text-sm space-y-1">
              <div>• Resolution: 0.05mm for small artifacts (±0.02mm accuracy)</div>
              <div>• Volumetric accuracy: 0.1mm + 0.2mm per meter for large objects</div>
              <div>• Calibrated scale system with reference markers</div>
              <div>• Multi-angle scanning reduces occlusion errors</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};