import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

console.clear();

/* UI LOGIC */
function updateLoadingProgress(percent) {
  const progressFill = document.getElementById('progress-fill');
  if (progressFill) {
    progressFill.style.width = percent + '%';
  }
}

function showLoadingWidget() {
  const loadingWidget = document.getElementById('loading-widget');
  const loading = document.getElementById('loading');
  if (loadingWidget) {
    loadingWidget.style.display = 'block';
  }
  if (loading) {
    loading.style.display = 'none';
  }
}

function hideLoadingWidget() {
  const loadingWidget = document.getElementById('loading-widget');
  if (loadingWidget) {
    loadingWidget.style.display = 'none';
  }
}

/* SETUP */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x667eea); // Blue background matching CSS
scene.fog = new THREE.Fog(0x667eea, 8, 13);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.y = .7;
camera.position.z = -1.5;

const webglRenderer = new THREE.WebGLRenderer({
  antialias: true
});
webglRenderer.shadowMap.enabled = true;
webglRenderer.setSize(window.innerWidth, window.innerHeight);
webglRenderer.setClearColor(0x667eea);
webglRenderer.setPixelRatio( window.devicePixelRatio );
document.getElementById('container').appendChild(webglRenderer.domElement);

/* CONTROLS */
const controls = new OrbitControls(camera, webglRenderer.domElement);
controls.target.set(0, .7, 0);
controls.update();

/* LIGHTS */
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(-5, 5, -5);
directionalLight.castShadow = true;
scene.add(directionalLight);

/* GROUND */
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshLambertMaterial({ 
  color: 0x4a5568,
  transparent: true,
  opacity: 0.3
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0; // Ground at Y = 0
ground.receiveShadow = true;
scene.add(ground);

let lines;

/* LOAD MODEL */
const loader = new GLTFLoader();

// Show the fancy loading widget when starting to load
showLoadingWidget();

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
      console.log('Mesh geometry attributes:', Object.keys(mesh.geometry.attributes));
      
      const geometry = mesh.geometry;
      const positions = geometry.attributes.position.array;
      const normals = geometry.attributes.normal.array;
      const vertexColors = geometry.attributes.color ? geometry.attributes.color.array : null;
      
      console.log('Has vertex colors:', !!vertexColors);
      
      // Process every vertex
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        
        const nx = normals[i];
        const ny = normals[i + 1];
        const nz = normals[i + 2];
        
        // Get vertex color if available
        let vertexColor = new THREE.Color(0xff6600); // Default orange
        if (vertexColors) {
          const colorIndex = i;
          vertexColor = new THREE.Color(
            vertexColors[colorIndex],
            vertexColors[colorIndex + 1],
            vertexColors[colorIndex + 2]
          );
        }
        
        // Create fur strands
        const strandLength = 0.05;
        const segments = 5;
        
        for (let j = 0; j < segments; j++) {
          const t = j / segments;
          const furX = x + nx * strandLength * t;
          const furY = y + ny * strandLength * t;
          const furZ = z + nz * strandLength * t;
          
          furPositions.push(x, y, z, furX, furY, furZ);
          
          // Use vertex color with variation
          const color = vertexColor.clone();
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
      color: 0xffffff, // Use white as base, colors come from geometry
      linewidth: 3,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });
    
    lines = new LineSegments2(linesGeometry, linesMaterial);
    lines.computeLineDistances();
    obj.add(lines);
    
    // Hide loading widget
    hideLoadingWidget();
    
    // Start animation
    requestAnimationFrame(render);
  },
  function (xhr) {
    const percent = (xhr.loaded / xhr.total * 100);
    updateLoadingProgress(percent);
  },
  function (error) {
    console.error('An error happened loading the GLB file:', error);
    hideLoadingWidget();
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