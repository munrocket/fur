import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
//import { GroundedSkybox } from 'three/addons/objects/GroundedSkybox.js';

export function loadEnvironment(environment, scene, renderer, progressCallback) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  return new Promise((resolve, reject) => {
    new EXRLoader().load(environment, 
      function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        scene.background = texture; // Use the original texture as background
        
        // Update materials
        scene.traverse((child) => {
          if (child.isMesh && child.material) {
            if (child.material.envMapIntensity !== undefined) {
              child.material.envMapIntensity = 0.6;
            }
            if (child.material.needsUpdate !== undefined) {
              child.material.needsUpdate = true;
            }
            child.material.envMap = envMap;
          }
        });
        
        pmremGenerator.dispose();
        console.log('Environment map loaded successfully');
        resolve(envMap);
      },
      function(progress) {
        const percent = (progress.loaded / progress.total * 100);
        progressCallback(percent);
      },
      reject
    );
  });
} 