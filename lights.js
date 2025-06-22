import * as THREE from 'three';

export function createLights(scene) {

  // Configure ambient light
  const ambient = new THREE.AmbientLight(0x93A741, 0.7);

  // Configure directional light
  const directional = new THREE.DirectionalLight(0xEFE2D7, 3);
  directional.position.set(1.2, 1.4, 2.4);
  directional.castShadow = true;
  directional.shadow.mapSize.width = 1024;
  directional.shadow.mapSize.height = 1024;
  directional.shadow.camera.near = 0.1;
  directional.shadow.camera.far = 5;
  directional.shadow.camera.left = -5;
  directional.shadow.camera.right = 5;
  directional.shadow.camera.top = 5;
  directional.shadow.camera.bottom = -5;
  directional.shadow.bias = -0.005;

  // Configure point lights
  const point = new THREE.PointLight(0xff8855, 9, 3);
  point.position.set(1.2, 1.4, 2.4);
  point.castShadow = true;

  // Add lights to scene
  scene.add(ambient);
  scene.add(directional);
  scene.add(point);

  return {
    ambient: ambient,
    directional: directional,
    point: point
  };
} 