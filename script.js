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
scene.background = new THREE.Color(0xc8d9e7); // Blue background matching CSS
scene.fog = new THREE.Fog(0xc8d9e7, 2, 50);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.y = .45;
camera.position.z = 1.8;

const webglRenderer = new THREE.WebGLRenderer({
  antialias: true
});
webglRenderer.shadowMap.enabled = true;
webglRenderer.setSize(window.innerWidth, window.innerHeight);
webglRenderer.setClearColor(0xc8d9e7);
webglRenderer.setPixelRatio( window.devicePixelRatio );

// Add ACES filmic tonemapping
webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
webglRenderer.toneMappingExposure = 1.0;
webglRenderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById('container').appendChild(webglRenderer.domElement);

/* CONTROLS */
const controls = new OrbitControls(camera, webglRenderer.domElement);
controls.target.set(0, .45, -.6);
controls.update();

/* LIGHTS */
const ambientLight = new THREE.AmbientLight(0xaaccff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.7);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

let lines;
let modelsLoaded = 0;
const totalModels = 2; // leo2.glb and forest.glb

/* LOAD MODELS */
const loader = new GLTFLoader();

// Show the fancy loading widget when starting to load
showLoadingWidget();

// Function to check if all models are loaded
function checkAllModelsLoaded() {
  modelsLoaded++;
  if (modelsLoaded >= totalModels) {
    // Hide loading widget
    hideLoadingWidget();
    
    // Start animation
    requestAnimationFrame(render);
  }
}

// Load leo2.glb
loader.load(
  'leo2.glb',
  function (gltf) {
    const leo = gltf.scene;
    scene.add(leo);
    
    // Enable shadow casting for leo model
    leo.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Find all meshes with geometry
    const meshes = [];
    leo.traverse((child) => {
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
      const vertexColors = new Float32Array(geometry.attributes.normal.array.length);
      console.log(vertexColors);
      
      console.log('Has vertex colors:', !!vertexColors);
      
      // Process every vertex
      for (let i = 0; i < positions.length; i += 3) {
        const x0 = positions[i];
        const y0 = positions[i + 1];
        const z0 = positions[i + 2];
        
        const nx = normals[i];
        const ny = normals[i + 1];
        const nz = normals[i + 2];
        
        const cr = nx;
        const cg = ny;
        const cb = nz;
        
        // Create fur strands
        const strandLength = 0.01;
        const segments = 5;
        const offsetY = .8;

        let x = x0, y = y0, z = z0; 
        for (let j = 0; j < segments; j++) {
          furPositions.push(x, y, z);
          furColors.push(cr, cg, cb);
          const n = new THREE.Vector3(nx, ny, nz);
          n.add(new THREE.Vector3(0, - offsetY * (j+1) / segments, 0)).normalize();
          x += n.x * strandLength;
          y += n.y * strandLength;
          z += n.z * strandLength;
          furPositions.push(x, y, z);
          furColors.push(cr, cg, cb);
        }
      }
    });
    console.log(furPositions.length, furColors.length);
    
    console.log('Total fur positions:', furPositions.length);
    
    // Create LineSegments2 geometry and mesh
    const linesGeometry = new LineSegmentsGeometry();
    linesGeometry.setPositions(furPositions);
    linesGeometry.setColors(furColors);
    linesGeometry.computeBoundingSphere();
    
    const furMaterial = new LineMaterial({
      color: 0xff8844,
      vertexColors: true,
      linewidth: 6,
      alphaToCoverage: true,
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
    });
    
    // Add time uniform to material
    furMaterial.uniforms.time = { value: 0.0 };
    
    //Add onBeforeCompile to modify vertex positions based on index
    furMaterial.onBeforeCompile = function(shader) {

      console.log('=== ORIGINAL VERTEX SHADER ===');
      console.log(shader.vertexShader);
      console.log('=== ORIGINAL FRAGMENT SHADER ===');
      console.log(shader.fragmentShader);
      
      // Add time uniform to shader
      shader.uniforms.time = { value: 0.0 };
      
      // Modify vertex positions based on index
      shader.vertexShader = shader.vertexShader.replace(
        'void main() {',
        `uniform float time;
        void main() {`
      );

      // shader.fragmentShader = shader.fragmentShader.replace(
      //   'void main() {',
      //   `void main() {`
      // );

      // shader.fragmentShader = shader.fragmentShader.replace(
      //   "gl_FragColor = vec4( diffuseColor.rgb, alpha );",
      //   "gl_FragColor = vec4( diffuseColor.rgb/abs(sin(vUv.x)), diffuseColor.r*.5+.5);"
      // );
    };
    lines = new LineSegments2(linesGeometry, furMaterial);
    lines.computeLineDistances();
    leo.add(lines);
    
    checkAllModelsLoaded();
  },
  function (xhr) {
    const percent = (xhr.loaded / xhr.total * 100);
    updateLoadingProgress(percent);
  },
  function (error) {
    console.error('An error happened loading the leo2.glb file:', error);
    checkAllModelsLoaded();
  }
);

// Load forest.glb
loader.load(
  'forest.glb',
  function (gltf) {
    const forest = gltf.scene;
    
    // Position the forest model - adjust these values as needed
    //forest.position.set(0, 0, 0); // Center of the scene
    //forest.scale.set(1, 1, 1); // Adjust scale if needed
    
    // Enable double-sided rendering and shadow receiving for forest objects
    forest.traverse((child) => {
      if (child.isMesh) {
        child.receiveShadow = true;
        
        // // Make materials double-sided
        // if (child.material) {
        //   let mat = child.material.map;
        //   child.material = new THREE.MeshBasicMaterial({
        //     map: mat.map,
        //     side: THREE.DoubleSide
        //   });
        // }
      }
    });
    
    scene.add(forest);
    console.log('Forest model loaded successfully with double-sided rendering');
    
    checkAllModelsLoaded();
  },
  function (xhr) {
    const percent = (xhr.loaded / xhr.total * 100);
    updateLoadingProgress(percent);
  },
  function (error) {
    console.error('An error happened loading the forest.glb file:', error);
    checkAllModelsLoaded();
  }
);

/* ANIMATION */
function render(time) {
  requestAnimationFrame(render);
  
  // Animate fur if lines exist
  if (lines) {
    lines.material.uniforms.time.value = time * 0.001;
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