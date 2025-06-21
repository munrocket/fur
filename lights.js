import * as THREE from 'three';

export function createLights() {
  const lights = {
    ambient: new THREE.AmbientLight(0xffffff, 0.4),
    directional: new THREE.DirectionalLight(0xffffff, 5),
    point1: new THREE.PointLight(0xff8844, 0.8, 4),
    point2: new THREE.PointLight(0x4488ff, 0.8, 3)
  };

  // Configure directional light
  lights.directional.position.set(3, 5, 5);
  lights.directional.castShadow = true;
  lights.directional.shadow.mapSize.width = 2048;
  lights.directional.shadow.mapSize.height = 2048;
  lights.directional.shadow.camera.near = 0.1;
  lights.directional.shadow.camera.far = 50;
  lights.directional.shadow.camera.left = -10;
  lights.directional.shadow.camera.right = 10;
  lights.directional.shadow.camera.top = 10;
  lights.directional.shadow.camera.bottom = -10;
  lights.directional.shadow.bias = -0.0001;

  // Configure point lights
  lights.point1.position.set(2, 1, 2);
  lights.point2.position.set(-2, 0.5, -1);

  return lights;
} 