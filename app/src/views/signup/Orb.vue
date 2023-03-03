<template>
  <canvas ref="el" class="canvas" id="canvas"></canvas>
</template>

<script setup lang="ts">
import * as THREE from "three";
import { ref, onMounted } from "vue";
import perlin from "./perlin.js";

const SIZE = 1000;
const el = ref(null);
const isActive = ref(true);

onMounted(() => {
  // Observation listener
  if (el.value) {
    const options = {
      rootMargin: "0px",
      threshold: 0.4,
    };

    const observer = new IntersectionObserver((e) => {
      if (e[0].intersectionRatio > 0.1) {
        isActive.value = true;
      } else {
        isActive.value = false;
      }
    }, options);

    observer.observe(el.value);
  }

  var renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("canvas"),
    antialias: true,
    alpha: true,
  });
  // default bg canvas color //
  renderer.setClearColor(0x000000, 0);
  //  use device aspect ratio //
  renderer.setPixelRatio(window.devicePixelRatio);
  // set size of canvas within window //
  renderer.setSize(SIZE, SIZE);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, SIZE / SIZE, 0.1, 1000);
  camera.position.z = 5;

  const material = new THREE.MeshPhongMaterial({
    color: 0x9261b1,
    shininess: 40,
  });

  var sphere_geometry = new THREE.SphereGeometry(1, 128, 128);
  var sphere = new THREE.Mesh(sphere_geometry, material);
  scene.add(sphere);

  const ambientLight = new THREE.AmbientLight(0x361d4d);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0x717fa8, 1);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  sphere.geometry.attributes.position.needsUpdate = true;

  var update = function () {
    // change '0.003' for more aggressive animation
    var time = performance.now() * 0.002;
    //console.log(time)

    //go through vertices here and reposition them

    // change 'k' value for more spikes
    var k = 1;
    var v3 = new THREE.Vector3();
    const positions = sphere.geometry.attributes.position;
    for (var i = 0; i < positions.count; i++) {
      v3.fromBufferAttribute(positions, i).setLength(k);
      let n = perlin.perlin3(
        v3.x + time * 0.1,
        v3.y + time * 0.1,
        v3.z + time * 0.1
      );
      v3.setLength(1 + 0.3 * n);
      positions.setXYZ(i, v3.x, v3.y, v3.z);
    }
    positions.needsUpdate = true;
    sphere.geometry.computeVertexNormals(); // don't forget to call this
  };

  function animate() {
    if (isActive.value === true) {
      update();
    }

    /* render scene and camera */
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
</script>

<style>
.canvas {
  filter: opacity(0.5);
}

.dark-mode .canvas {
  filter: none;
}
</style>
