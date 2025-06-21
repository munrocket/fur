import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLights } from './lights.js';
import { loadEnvironment } from './environment.js';
import { createFur } from './fur.js';
import { loadModel } from './loader.js';

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
scene.background = new THREE.Color(0xc8d9e7);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.y = 0.45;
camera.position.z = 1.8;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = Math.pow(2, 0.0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById('container').appendChild(renderer.domElement);

/* CONTROLS */
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.45, 0.6);
controls.update();

/* LIGHTS */
const lights = createLights();
Object.values(lights).forEach(light => scene.add(light));

/* INITIALIZE */
let lines;
let environment;

async function init() {
  try {
    showLoadingWidget();

    // Load environment
    environment = await loadEnvironment('public/forest.exr', scene, renderer, updateLoadingProgress);
    
    // Load model
    const leo = await loadModel('public/leo2.glb', scene, environment, updateLoadingProgress);
    hideLoadingWidget();
    
    // Create fur
    const meshes = [];
    leo.traverse((child) => {
      if (child.isMesh && child.geometry && child.geometry.attributes.position) {
        meshes.push(child);
      }
    });
    
    lines = createFur(meshes, window.innerWidth, window.innerHeight);
    leo.add(lines);
    
    // Start animation
    requestAnimationFrame(render);
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

/* ANIMATION */
function render(time) {
  requestAnimationFrame(render);
  
  if (lines) {
    lines.material.uniforms.time.value = time * 0.001;
    lines.geometry.attributes.position.needsUpdate = true;
  }
  
  renderer.render(scene, camera);
}

/* RESIZE */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (lines && lines.material.resolution) {
    lines.material.resolution.set(window.innerWidth, window.innerHeight);
  }
}

window.addEventListener("resize", onWindowResize, false);
// Start the application
init();
