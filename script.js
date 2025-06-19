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
      const vertexColors = geometry.attributes.color.array;
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

      shader.fragmentShader = shader.fragmentShader.replace(
        "gl_FragColor = vec4( diffuseColor.rgb, alpha );",
        "gl_FragColor = vec4( diffuseColor.rgb/abs(sin(vUv.x)), diffuseColor.r*.5+.5);"
      );
    };
    console.log(furMaterial);
    lines = new LineSegments2(linesGeometry, furMaterial);
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