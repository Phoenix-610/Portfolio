import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const loader = new GLTFLoader();
loader.load( './Portfolio.glb', function ( glb ) {
  scene.add( glb.scene );
}, undefined, function ( error ) {
  console.error( error );
} );

const light = new THREE.AmbientLight( 0x404040, 5); // soft white light
scene.add( light );

const camera = new THREE.PerspectiveCamera( 75, sizes.width / sizes.height, 0.1, 1000 );
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 1;

const controls = new OrbitControls( camera, canvas );
controls.update();


function handleResize(){
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("resize", handleResize); 

function animate() { 
  // console.log(camera.position);
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );