import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

export function loadEnvironment(url, scene, renderer, lights, progressCallback) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  return new Promise((resolve, reject) => {
    new EXRLoader().load(url, 
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

        // Create deformed sphere with environment texture
        const radius = 5;
        const height = 1;
        const superb = 5;
        const envGeometry = new THREE.SphereGeometry(radius, 100);
        const positions = envGeometry.attributes.position;
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
        const envMaterial = new THREE.MeshLambertMaterial({
          map: texture.clone(),
          side: THREE.BackSide
        });
        const envMesh = new THREE.Mesh(envGeometry, envMaterial);
        envMesh.position.set(0, height, 0);
        //don't rotate here, rotate directional light instead
        envMesh.rotation.y = Math.atan2(lights.directional.position.z, lights.directional.position.x)+3.6;
        envMesh.receiveShadow = true;

        envMaterial.onBeforeCompile = function(shader) {
          shader.fragmentShader = shader.fragmentShader.replace(
            'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
            `vec3 outgoingLight = mix(diffuseColor.rgb, reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance, .8);`
          );
        };
        
        scene.add(envMesh);
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