import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

export function loadEnvironment(environment, scene, renderer, progressCallback) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  return new Promise((resolve, reject) => {
    new EXRLoader().load(environment, 
      function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        
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

        // Create sphere with environment texture
        const radius = 5;
        const height = 1;
        const superb = 5;
        const sphereGeometry = new THREE.IcosahedronGeometry(radius, 15);
        const positions = sphereGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const y = positions.getY(i);
          const z = positions.getZ(i);
          if (y < 0) {
            const k = Math.abs(y) / Math.sqrt(x*x + z*z);
            const x0 = Math.pow(Math.pow(1 / radius, superb) + Math.pow(k / height, superb), -1 / superb);
            const mult = Math.sqrt(1 + k*k) * x0 / radius;
            positions.setX(i, x * mult);
            positions.setY(i, y * mult);
            positions.setZ(i, z * mult);
          }
        }
        const sphereMaterial = new THREE.MeshStandartMaterial({
          map: texture.clone(),
          side: THREE.BackSide
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(0, height, 0);
        sphere.rotation.y = 2.1;
        sphere.receiveShadow = true;
        scene.add(sphere);        
        
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