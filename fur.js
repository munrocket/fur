import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

let fur = null;
export function createFur(meshes, windowWidth, windowHeight) {
  // const furPositions = [];
  // const furColors = [];
  
  // // Process all meshes
  // meshes.forEach((mesh, meshIndex) => {
  //   if (meshIndex !== 0) return; // Only process first mesh
    
  //   const geometry = mesh.geometry;
  //   const positions = geometry.attributes.position.array;
  //   const normals = geometry.attributes.normal.array;
    
  //   // Process every vertex
  //   for (let i = 0; i < positions.length; i += 3) {
  //     const x0 = positions[i];
  //     const y0 = positions[i + 1];
  //     const z0 = positions[i + 2];
      
  //     const nx = normals[i];
  //     const ny = normals[i + 1];
  //     const nz = normals[i + 2];
      
  //     const cr = nx;
  //     const cg = ny;
  //     const cb = nz;
      
  //     // Create fur strands
  //     const strandLength = 0.01;
  //     const segments = 5;
  //     const offsetY = 0.8;

  //     let x = x0, y = y0, z = z0; 
  //     for (let j = 0; j < segments; j++) {
  //       furPositions.push(x, y, z);
  //       furColors.push(cr, cg, cb);
  //       const n = new THREE.Vector3(nx, ny, nz);
  //       n.add(new THREE.Vector3(0, -offsetY * (j+1) / segments, 0)).normalize();
  //       x += n.x * strandLength;
  //       y += n.y * strandLength;
  //       z += n.z * strandLength;
  //       furPositions.push(x, y, z);
  //       furColors.push(cr, cg, cb);
  //     }
  //   }
  // });
  
  // // Create LineSegments2 geometry and mesh
  // const furGeometry = new LineSegmentsGeometry();
  // furGeometry.setPositions(furPositions);
  // furGeometry.setColors(furColors);
  // furGeometry.computeBoundingSphere();
  
  // const furMaterial = new LineMaterial({
  //   color: 0xff8844,
  //   vertexColors: true,
  //   linewidth: 6,
  //   alphaToCoverage: true,
  //   resolution: new THREE.Vector2(windowWidth, windowHeight)
  // });
  
  // // Add time uniform to material
  // furMaterial.uniforms.time = { value: 0.0 };
  
  // // Add onBeforeCompile to modify vertex positions based on index
  // furMaterial.onBeforeCompile = function(shader) {
  //   shader.uniforms.time = { value: 0.0 };
    
  //   shader.vertexShader = shader.vertexShader.replace(
  //     'void main() {',
  //     `uniform float time;
  //     void main() {`
  //   );
  // };
  
  // const fur = new LineSegments2(furGeometry, furMaterial);
  // fur.computeLineDistances();
  
  return fur;
} 