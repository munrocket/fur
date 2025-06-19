import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

console.clear();

/* SETUP */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 8, 13);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.x = -1;
camera.position.y = 0.8;
camera.position.z = -4;

const webglRenderer = new THREE.WebGLRenderer({
  antialias: true
});
webglRenderer.shadowMap.enabled = true;
webglRenderer.setSize(window.innerWidth, window.innerHeight);
webglRenderer.setClearColor(0x000000);
webglRenderer.setPixelRatio( window.devicePixelRatio );
document.getElementById('container').appendChild(webglRenderer.domElement);

/* CONTROLS */
const controls = new OrbitControls(camera, webglRenderer.domElement);

/* LIGHTS */
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(-5, 5, -5);
directionalLight.castShadow = true;
scene.add(directionalLight);

let lines;

/* LOAD MODEL */
const loader = new GLTFLoader();
loader.load(
  'leo.glb',
  function (gltf) {
    const obj = gltf.scene;
    obj.rotation.y = Math.PI;
    scene.add(obj);
    
    // Find all meshes with geometry
    const meshes = [];
    obj.traverse((child) => {
      if (child.isMesh && child.geometry && child.geometry.attributes.position) {
        meshes.push(child);
      }
    });
    
    console.log('Found meshes:', meshes.length);
    
    const furPositions = [];
    const furColors = [];
    
    // Process all meshes
    meshes.forEach((mesh, meshIndex) => {
      if (meshIndex !== 0) return; // Only process first mesh
      
      console.log(`Processing mesh ${meshIndex}:`, mesh.name || 'unnamed');
      
      const geometry = mesh.geometry;
      const positions = geometry.attributes.position.array;
      const normals = geometry.attributes.normal.array;
      
      // Process every vertex
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        const nx = normals[i];
        const ny = normals[i + 1];
        const nz = normals[i + 2];
        
        // Create fur strands
        const strandLength = 0.1;
        const segments = 5;
        
        for (let j = 0; j < segments; j++) {
          const t = j / segments;
          const furX = x + nx * strandLength * t;
          const furY = y + ny * strandLength * t;
          const furZ = z + nz * strandLength * t;
          
          furPositions.push(x, y, z, furX, furY, furZ);
          
          // Orange leopard color
          const color = new THREE.Color(0xff6600);
          color.multiplyScalar(0.5 + t * 0.5);
          furColors.push(color.r, color.g, color.b, color.r, color.g, color.b);
        }
      }
    });
    
    console.log('Total fur positions:', furPositions.length);
    
    // Create LineSegments2 geometry and mesh
    const linesGeometry = new LineSegmentsGeometry();
    linesGeometry.setPositions(furPositions);
    linesGeometry.setColors(furColors);
    linesGeometry.computeBoundingSphere();
    
    const linesMaterial = new LineMaterial({
      color: 0xff6600,
      linewidth: 3,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });
    
    lines = new LineSegments2(linesGeometry, linesMaterial);
    lines.computeLineDistances();
    obj.add(lines);
    
    // Hide loading screen
    document.getElementById('loading').style.display = 'none';
    
    // Start animation
    requestAnimationFrame(render);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.error('An error happened loading the GLB file:', error);
    document.getElementById('loading').style.display = 'none';
    requestAnimationFrame(render);
  }
);

/* ANIMATION */
function render() {
  requestAnimationFrame(render);
  
  // Animate fur if lines exist
  if (lines) {
    const time = Date.now() * 0.001;
    const positions = lines.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length; i += 6) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Add some wave motion to the fur
      const wave = Math.sin(time * 2 + x * 10) * 0.01;
      positions[i + 1] = y + wave;
    }
    
    lines.geometry.attributes.position.needsUpdate = true;
  }
  
  webglRenderer.render(scene, camera);
}

/* RESIZE */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  webglRenderer.setSize(window.innerWidth, window.innerHeight);
  if (lines && lines.material.resolution) {
    lines.material.resolution.set(window.innerWidth, window.innerHeight);
  }
}

window.addEventListener("resize", onWindowResize, false);