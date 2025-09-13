import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Maximize, Download } from "lucide-react";
import * as THREE from 'three';
import { reconstruct3DFromImages, type ReconstructionData } from '@/lib/3dReconstruction';

interface Viewer3DProps {
  scanData?: any;
  artifactName?: string;
}

function ArtifactMesh({ scanData }: { scanData?: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [reconstructionData, setReconstructionData] = useState<ReconstructionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reconstruct 3D model from scan data
  useEffect(() => {
    if (!scanData?.images || scanData.images.length === 0) {
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
      ref={meshRef}
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

  const handleReset = () => {
    // Reset camera position - would need to access OrbitControls ref
    console.log('Reset camera position');
  };

  const handleExport = () => {
    // Export 3D model functionality
    console.log('Export 3D model');
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
        <div className="p-4 text-sm text-muted-foreground">
          <p>Scan Quality: <span className="text-accent">{scanData.quality}</span></p>
          <p>Processing Date: {new Date(scanData.timestamp).toLocaleString()}</p>
        </div>
      )}
    </Card>
  );
};