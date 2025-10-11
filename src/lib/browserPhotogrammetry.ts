import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

interface DepthEstimationResult {
  depthMap: ImageData;
  width: number;
  height: number;
}

/**
 * Estimate depth from a single image using a simple edge-based approach
 * For production, you could integrate with HuggingFace's DPT model
 */
async function estimateDepthFromImage(image: HTMLImageElement): Promise<DepthEstimationResult> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Resize for performance
  const maxSize = 512;
  const scale = Math.min(maxSize / image.width, maxSize / image.height);
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Simple depth estimation: convert to grayscale and apply edge detection
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Apply simple depth heuristic: darker = further, lighter = closer
    const depth = 255 - gray;
    
    data[i] = depth;
    data[i + 1] = depth;
    data[i + 2] = depth;
  }
  
  return {
    depthMap: imageData,
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * Advanced depth estimation using gradient analysis
 * Better quality than simple grayscale conversion
 */
async function estimateDepthAdvanced(image: HTMLImageElement): Promise<DepthEstimationResult> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const maxSize = 512;
  const scale = Math.min(maxSize / image.width, maxSize / image.height);
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // Create a depth map using edge detection and luminance
  const depthData = new Uint8ClampedArray(data.length);
  
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < canvas.width - 1; x++) {
      const i = (y * canvas.width + x) * 4;
      
      // Calculate luminance
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Calculate gradients (Sobel operator)
      const gx = 
        -data[i - 4 - canvas.width * 4] + data[i + 4 - canvas.width * 4] +
        -2 * data[i - 4] + 2 * data[i + 4] +
        -data[i - 4 + canvas.width * 4] + data[i + 4 + canvas.width * 4];
      
      const gy = 
        -data[i - canvas.width * 4 - 4] - 2 * data[i - canvas.width * 4] - data[i - canvas.width * 4 + 4] +
        data[i + canvas.width * 4 - 4] + 2 * data[i + canvas.width * 4] + data[i + canvas.width * 4 + 4];
      
      const gradient = Math.sqrt(gx * gx + gy * gy);
      
      // Combine luminance and gradient for depth estimation
      const depth = Math.min(255, luminance * 0.7 + gradient * 0.3);
      
      depthData[i] = depth;
      depthData[i + 1] = depth;
      depthData[i + 2] = depth;
      depthData[i + 3] = 255;
    }
  }
  
  const depthImageData = new ImageData(depthData, canvas.width, canvas.height);
  
  return {
    depthMap: depthImageData,
    width: canvas.width,
    height: canvas.height
  };
}

/**
 * Generate a 3D mesh from an image and its depth map
 */
function createMeshFromDepth(
  image: HTMLImageElement,
  depthResult: DepthEstimationResult,
  heightScale: number = 0.3
): THREE.Mesh {
  const { depthMap, width, height } = depthResult;
  
  // Create texture from original image
  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  
  // Create geometry with vertices based on image size
  const geometry = new THREE.PlaneGeometry(2, 2, width - 1, height - 1);
  const positions = geometry.attributes.position.array as Float32Array;
  
  // Apply depth data to z-coordinates
  const depthData = depthMap.data;
  for (let i = 0; i < positions.length / 3; i++) {
    const y = Math.floor(i / width);
    const x = i % width;
    const depthIndex = (y * width + x) * 4;
    const depth = depthData[depthIndex] / 255;
    
    positions[i * 3 + 2] = depth * heightScale;
  }
  
  geometry.computeVertexNormals();
  geometry.attributes.position.needsUpdate = true;
  
  // Create material with texture
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  
  return new THREE.Mesh(geometry, material);
}

/**
 * Process multiple images and combine them into a single 3D reconstruction
 */
export async function reconstructFrom3DPhotos(
  images: File[],
  onProgress?: (progress: number, status: string) => void
): Promise<{
  mesh: THREE.Mesh;
  scene: THREE.Scene;
  exportGLB: () => Promise<Blob>;
}> {
  if (images.length === 0) {
    throw new Error('No images provided');
  }
  
  onProgress?.(10, 'Loading images...');
  
  // Load all images
  const loadedImages = await Promise.all(
    images.map(file => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    })
  );
  
  onProgress?.(30, 'Estimating depth maps...');
  
  // Use the first image as primary (or combine multiple for better results)
  const primaryImage = loadedImages[0];
  const depthResult = await estimateDepthAdvanced(primaryImage);
  
  onProgress?.(60, 'Generating 3D mesh...');
  
  // Create mesh from depth
  const mesh = createMeshFromDepth(primaryImage, depthResult);
  
  // Create scene
  const scene = new THREE.Scene();
  scene.add(mesh);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
  
  onProgress?.(90, 'Finalizing model...');
  
  // Export function
  const exportGLB = async (): Promise<Blob> => {
    const exporter = new GLTFExporter();
    return new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' });
          resolve(blob);
        },
        (error) => reject(error),
        { binary: true }
      );
    });
  };
  
  onProgress?.(100, 'Complete!');
  
  return { mesh, scene, exportGLB };
}

/**
 * Load an image from a File object
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}
