import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadModel(url, scene, environment, updateLoadingProgress) {
  const loader = new GLTFLoader();
  
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        
        // Enable shadow casting and environment mapping
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
              child.material.envMapIntensity = 0.6;
              child.material.needsUpdate = true;
              
              if (environment) {
                child.material.envMap = environment;
              }
            }
          }
        });
        
        resolve(model);
      },
      function (xhr) {
        const percent = (xhr.loaded / xhr.total * 100);
        updateLoadingProgress(percent);
      },
      reject
    );
  });
} 