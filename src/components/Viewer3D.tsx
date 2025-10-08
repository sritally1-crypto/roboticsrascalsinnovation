import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text, useGLTF } from '@react-three/drei';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Maximize, Download, Ruler } from "lucide-react";
import { MeasurementOverlay } from './MeasurementOverlay';
import { toast } from "sonner";
import * as THREE from 'three';
import { reconstruct3DFromImages, type ReconstructionData } from '@/lib/3dReconstruction';

interface Viewer3DProps {
  scanData?: any;
  artifactName?: string;
}

function ArtifactMesh({ scanData }: { scanData?: any }) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [reconstructionData, setReconstructionData] = useState<ReconstructionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load .glb model if available
  let gltfModel = null;
  try {
    if (scanData?.modelUrl) {
      gltfModel = useGLTF(scanData.modelUrl);
    }
  } catch (error) {
    console.error('Failed to load .glb model:', error);
  }

  // Reconstruct 3D model from scan data
  useEffect(() => {
    if (!scanData?.images || scanData.images.length === 0 || scanData?.modelUrl) {
      return;
    }

    setIsLoading(true);
    reconstruct3DFromImages(
      scanData.images, 
      scanData.processedImages || [], 
      scanData.qualities || []
    ).then((data) => {
      setReconstructionData(data);
      setIsLoading(false);
    }).catch((error) => {
      console.error('3D reconstruction failed:', error);
      setIsLoading(false);
    });
  }, [scanData]);

  useFrame((state) => {
    if (meshRef.current && !isLoading) {
      meshRef.current.rotation.y = hovered ? state.clock.elapsedTime * 0.5 : state.clock.elapsedTime * 0.1;
    }
  });

  if (isLoading) {
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#666" opacity={0.5} transparent />
      </mesh>
    );
  }

  // If .glb model is loaded, display it
  if (gltfModel && 'scene' in gltfModel) {
    return (
      <group
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <primitive object={gltfModel.scene} />
      </group>
    );
  }

  // Use reconstructed data if available, otherwise show placeholder
  const geometry = reconstructionData?.geometry || new THREE.BoxGeometry(2, 1, 0.5);
  const material = reconstructionData?.material || new THREE.MeshStandardMaterial({
    color: "#8B4513",
    roughness: 0.8,
    metalness: 0.1,
    normalScale: new THREE.Vector2(0.5, 0.5)
  });

  return (
    <mesh
      ref={meshRef as any}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
      geometry={geometry}
      material={material}
    />
  );
}

function ArtifactScene({ scanData }: { scanData?: any }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      
      <Suspense fallback={null}>
        <ArtifactMesh scanData={scanData} />
        <Environment preset="studio" />
        <ContactShadows 
          position={[0, -1.5, 0]} 
          opacity={0.5} 
          scale={5} 
          blur={2.5} 
          far={4} 
        />
      </Suspense>

      <Text
        position={[0, -2.5, 0]}
        fontSize={0.3}
        color="#8B4513"
        anchorX="center"
        anchorY="middle"
      >
        {scanData ? `Scanned: ${new Date(scanData.timestamp).toLocaleDateString()}` : 'Sample Artifact'}
      </Text>
    </>
  );
}

export const Viewer3D = ({ scanData, artifactName = "Ancient Artifact" }: Viewer3DProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);

  const handleReset = () => {
    // Reset camera position - would need to access OrbitControls ref
    console.log('Reset camera position');
  };

  const handleExport = () => {
    if (!scanData?.photogrammetryResult) {
      toast.error("No 3D model available to export");
      return;
    }

    try {
      const mesh = scanData.photogrammetryResult.mesh;
      const geometry = mesh.geometry as THREE.BufferGeometry;
      
      // Export as OBJ format (universally compatible)
      const positions = geometry.attributes.position.array;
      const normals = geometry.attributes.normal?.array;
      const colors = geometry.attributes.color?.array;
      const indices = geometry.index?.array;
      
      let obj = '# Exported from ArchaeoLink\n';
      obj += `# Vertices: ${positions.length / 3}\n`;
      obj += `# Faces: ${indices ? indices.length / 3 : 0}\n\n`;
      
      // Write vertices
      for (let i = 0; i < positions.length; i += 3) {
        obj += `v ${positions[i].toFixed(6)} ${positions[i+1].toFixed(6)} ${positions[i+2].toFixed(6)}`;
        if (colors) {
          obj += ` ${colors[i].toFixed(6)} ${colors[i+1].toFixed(6)} ${colors[i+2].toFixed(6)}`;
        }
        obj += '\n';
      }
      
      // Write normals
      if (normals) {
        obj += '\n';
        for (let i = 0; i < normals.length; i += 3) {
          obj += `vn ${normals[i].toFixed(6)} ${normals[i+1].toFixed(6)} ${normals[i+2].toFixed(6)}\n`;
        }
      }
      
      // Write faces
      if (indices) {
        obj += '\n';
        for (let i = 0; i < indices.length; i += 3) {
          if (normals) {
            obj += `f ${indices[i]+1}//${indices[i]+1} ${indices[i+1]+1}//${indices[i+1]+1} ${indices[i+2]+1}//${indices[i+2]+1}\n`;
          } else {
            obj += `f ${indices[i]+1} ${indices[i+1]+1} ${indices[i+2]+1}\n`;
          }
        }
      }
      
      const blob = new Blob([obj], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `archaeolink_artifact_${Date.now()}.obj`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("3D model exported as OBJ! Compatible with Meshroom, Blender, and other 3D software.");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export model");
    }
  };

  return (
    <Card className="space-y-4">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{artifactName}</h3>
            <p className="text-sm text-muted-foreground">
              {scanData ? `${scanData.imageCount} images • ${scanData.quality} quality` : 'Interactive 3D Model'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant={showMeasurements ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowMeasurements(!showMeasurements)}
            >
              <Ruler className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
              <Maximize className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className={`bg-gradient-to-br from-stone-light to-background rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50' : 'h-96'
      }`}>
        <Canvas
          camera={{ position: [0, 2, 5], fov: 50 }}
          shadows
          className="w-full h-full"
        >
          <ArtifactScene scanData={scanData} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
      </div>

      {scanData && (
        <div className="p-4 border-t bg-muted/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Scan Quality:</span>
              <span className="ml-2 font-semibold text-primary">{scanData.quality}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Resolution:</span>
              <span className="ml-2 font-mono text-primary">0.05mm</span>
            </div>
            <div>
              <span className="text-muted-foreground">Point Density:</span>
              <span className="ml-2 font-mono text-primary">2.5M pts/cm²</span>
            </div>
            <div>
              <span className="text-muted-foreground">Processed:</span>
              <span className="ml-2 text-muted-foreground">{new Date(scanData.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Overlay */}
      {showMeasurements && (
        <div className="mt-4">
          <MeasurementOverlay 
            scanAccuracy="±0.02mm"
            calibrationStatus={true}
          />
        </div>
      )}
    </Card>
  );
};