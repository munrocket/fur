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

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
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
const lights = createLights(scene);

/* INITIALIZE */
let fur;
let environment;

async function init() {
  try {
    showLoadingWidget();

    // Load environment
    environment = await loadEnvironment('public/forest.exr', scene, renderer, lights, updateLoadingProgress);
    
    // Load model
    const leo = await loadModel('public/leo.glb', scene, environment, updateLoadingProgress);
    hideLoadingWidget();
    
    // Create fur
    const meshes = [];
    leo.traverse((child) => {
      if (child.isMesh && child.geometry && child.geometry.attributes.position) {
        meshes.push(child);
      }
    });
    
    fur = createFur(meshes, window.innerWidth, window.innerHeight);
    leo.add(fur);
    
    // Start animation
    requestAnimationFrame(render);
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

/* ANIMATION */
function render(time) {
  requestAnimationFrame(render);
  
  if (fur) {
    fur.material.uniforms.time.value = time * 0.001;
    fur.geometry.attributes.position.needsUpdate = true;
  }
  
  renderer.render(scene, camera);
}

/* RESIZE */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (fur && fur.material.resolution) {
    fur.material.resolution.set(window.innerWidth, window.innerHeight);
  }
}

window.addEventListener("resize", onWindowResize, false);
// Start the application
init();
