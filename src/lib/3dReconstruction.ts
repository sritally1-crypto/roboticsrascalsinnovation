import * as THREE from 'three';

export interface ReconstructionData {
  geometry: THREE.BufferGeometry;
  textures: THREE.Texture[];
  material: THREE.Material;
  boundingBox: THREE.Box3;
}

interface ScanData {
  images: string[];
  processedImages: string[];
  qualities: any[];
  timestamp: string;
  imageCount: number;
  quality: string;
  metadata: any;
  modelUrl?: string;
  modelFile?: File;
}

// Simple placeholder for documentation - real 3D models come from .glb files
export const processScannedData = async (scanData: ScanData): Promise<{
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  metadata: {
    vertices: number;
    faces: number;
    textureResolution: string;
    processingTime: number;
    accuracy: string;
  };
}> => {
  const startTime = Date.now();

  // For documentation mode, return simple placeholder
  const placeholderGeometry = new THREE.BoxGeometry(1, 1, 1);
  const placeholderMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.7,
    metalness: 0.2
  });
  
  return {
    geometry: placeholderGeometry,
    material: placeholderMaterial,
    metadata: {
      vertices: placeholderGeometry.attributes.position.count,
      faces: placeholderGeometry.index ? placeholderGeometry.index.count / 3 : 0,
      textureResolution: "Documentation mode",
      processingTime: Date.now() - startTime,
      accuracy: "Use .glb upload for real 3D models"
    }
  };
};

// Legacy reconstruction functions for backward compatibility
export async function reconstruct3DFromImages(
  images: string[], 
  processedImages: string[], 
  qualityMetrics: any[]
): Promise<ReconstructionData> {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
  
  geometry.computeBoundingBox();
  const boundingBox = geometry.boundingBox!;
  
  return {
    geometry,
    textures: [],
    material,
    boundingBox
  };
}

export function extractDominantColors(images: string[]): Promise<THREE.Color[]> {
  return Promise.resolve([new THREE.Color('#8B4513')]);
}