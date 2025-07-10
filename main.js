import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';


const scene = new THREE.Scene();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};


// Physics stuff
const GRAVITY = 30;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1;
const JUMP_HEIGHT = 10;  
const MOVE_SPEED = 10;    

let character = {
    instance: null,
    isMoving: false,
    spawnPosition: new THREE.Vector3(),
};
let targetRotation = 0;


const colliderOctree = new Octree();
const playerCollider = new Capsule(new THREE.Vector3(0, CAPSULE_RADIUS,0),
                                   new THREE.Vector3(0, CAPSULE_HEIGHT,0),
                                   CAPSULE_RADIUS );

let playerVelocity = new THREE.Vector3();                                   
let playerOnFloor = false;                                   

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const modelcontent = {
    "Project_1_2": {
        title: "Hospital Management System",
        content: "A full-featured web-based Hospital Management System designed to streamline 📝 patient registration, 🧑‍⚕️ doctor scheduling, 📁 medical records, and 🧾 inventory. Built with a responsive UI and robust backend to support multi-role access for administrators, doctors, and staff. Focused on reliability and usability in real-world healthcare scenarios.",
        link: "https://github.com/Phoenix-610/HMIS",
    },
    "Project_2_2": {
        title: "Bus Management System",
        content: "This project automates the management of 🚍 buses, 👨‍✈️ drivers, 📍 routes, and 🎟️ bookings in a transport system. It provides role-based dashboards for admins and operators, along with route optimization logic and real-time seat availability tracking. Built to scale for both urban 🏙️ and intercity 🌆 environments.",
        link: "https://github.com/Phoenix-610/Bus-Management-System",
    },
    "Project_3_2": {
        title: "RideX: Ride Booking App",
        content: "RideX is a modern ride-hailing web app inspired by Uber/Ola. It enables users to 🧍‍♂️ book rides in real time, 🧭 track drivers on a live map, and 📜 manage trip history. The platform features a clean, intuitive interface and is powered by 📡 geolocation APIs, 🔐 secure authentication, and scalable architecture for both riders and drivers.",
        link: "https://github.com/Phoenix-610",
    },
    "Phoenix": {
        title: "About Me",
        content: "Hey! I'm Tarun Kumar, a passionate technologist with a love for all things 3D 🧊 and code 💻. I enjoy crafting immersive web experiences using technologies like Three.js, and I have solid skills in C++, JavaScript, Python, and full-stack frameworks. Whether it's building interactive UIs 🎨 or experimenting with motion and 3D scenes 🚀, I thrive at the intersection of creativity and technology. Outside the digital world, you’ll find me 🎸 strumming my guitar or exploring the latest tech trends 📱. I believe in constant learning, meaningful design, and creating things that inspire 🌟.",
    },
};



const model = document.querySelector(".model");
const modelTitle = document.querySelector(".model-title");
const modelProjectDescription = document.querySelector(".model-project-description");
const modelExitButton = document.querySelector(".model-exit-button");
const modelProjectVisitButton = document.querySelector(".model-project-visit-button");

function showModel(id){
    const content = modelcontent[id];
    if(content){
        modelTitle.textContent = content.title;
        modelProjectDescription.textContent = content.content;

        if(content.link){
            modelProjectVisitButton.href = content.link;
            modelProjectVisitButton.classList.remove("hidden");
        }else{
            modelProjectVisitButton.classList.add("hidden");
        }    
        model.classList.remove("hidden");
    }    
}

function hideModel(){
    model.classList.add("hidden");
}


let intersectedObject = "";
const intersectObjects = [];
const intersectObjectsNames = [
      "Project_1_2",
      "Project_2_2",
      "Project_3_2",
      "Project_1_1",
      "Project_2_1",
      "Project_3_1",
      "Phoenix",
      // "Projects",
      "Baby_Goku_Halloween",
      "Baby_Goku_Super_Saiyan_IV",
      "Baby_Goku_Super_Saiyan",
      "Baby_Goku_Super_Saiyan_III",
];

const loader = new GLTFLoader();
loader.load( './Portfolio.glb', function ( glb ) {
   glb.scene.traverse((child) => {
     if(intersectObjectsNames.includes(child.name)) {
      // console.log("Found intersectable object:", child.name);
       intersectObjects.push(child);
     }
     if(child.isMesh) {
     // console.log("Found mesh:", child.name);
       child.castShadow = true; // Enable shadow casting
       child.receiveShadow = true; // Enable shadow receiving
     }
     
     if(child.name === "Minecraft_style_Goku_Model"){
          character.spawnPosition.copy(child.position);
          character.instance = child;
          playerCollider.start.copy( child.position).add(new THREE.Vector3(0, CAPSULE_RADIUS,0));
          playerCollider.end.copy( child.position).add(new THREE.Vector3(0, CAPSULE_HEIGHT,0));
     }

     if(child.name === "Ground_Collider"){
          colliderOctree.fromGraphNode(child);
          child.visible = false;
     }

   }) 
  scene.add( glb.scene );
}, undefined, function ( error ) {
  console.error( error );
} );

const light = new THREE.AmbientLight( 0x404040, 4); // soft white light
scene.add( light );

const sun = new THREE.DirectionalLight( 0xFFF3D8,1.5);
sun.castShadow = true; // Enable shadow casting
sun.position.set( 100, 150, 25 );
sun.shadow.mapSize.width = 4096; // default
sun.shadow.mapSize.height = 4096; // default
sun.shadow.camera.left = -200;
sun.shadow.camera.right = 200;
sun.shadow.camera.top = 200;
sun.shadow.camera.bottom = -200;
sun.shadow.normalBias = 0.5; // Adjust to reduce shadow acne
scene.add( sun );

// const shadowHelper = new THREE.CameraHelper( sun.shadow.camera );
// scene.add( shadowHelper )
// // const helper = new THREE.DirectionalLightHelper( sun, 5 );
// // scene.add( helper );

const aspect = sizes.width / sizes.height;
const camera = new THREE.OrthographicCamera( -aspect*50, aspect*50, 50, -50, -1000, 1000 );
const DEFAULT_ZOOM = 2;

camera.position.x = 50;
camera.position.y = 50;
camera.position.z = 50;
camera.zoom = DEFAULT_ZOOM; // Set initial zoom
camera.updateProjectionMatrix();
const cameraOffset = new THREE.Vector3(50, 50, 50);


// const controls = new OrbitControls( camera, canvas );
// controls.update();


function onResize(){
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    const aspect = sizes.width / sizes.height;
    camera.left = -aspect*50;
    camera.right = aspect*50;
    camera.top = 50; 
    camera.bottom = -50;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}



function jumpCharacter(meshID) {
 // if (!isCharacterReady) return;

  const mesh = scene.getObjectByName(meshID);
  const jumpHeight = 2;
  const jumpDuration = 0.5;

//   const currentScale = {
//     x: mesh.scale.x,
//     y: mesh.scale.y,
//     z: mesh.scale.z,
//   };

  const t1 = gsap.timeline();

  t1.to(mesh.scale, {
    x:  1.2,
    y:  0.8,
    z:  1.2,
    duration: jumpDuration * 0.2,
    ease: "power2.out",
  });

  t1.to(mesh.scale, {
    x:  0.8,
    y:  1.3,
    z:  0.8,
    duration: jumpDuration * 0.3,
    ease: "power2.out",
  });

  t1.to(
    mesh.position,
    {
      y: mesh.position.y + jumpHeight,
      duration: jumpDuration * 0.5,
      ease: "power2.out",
    },
    "<"
  );

  t1.to(mesh.scale, {
    x:  1,
    y:  1,
    z:  1,
    duration: jumpDuration * 0.3,
    ease: "power1.inOut",
  });

  t1.to(
    mesh.position,
    {
      y: mesh.position.y,
      duration: jumpDuration * 0.5,
      ease: "bounce.out",
    //   onComplete: () => {
    //     isCharacterReady = true;
    //   },
    },
    ">"
  );

 
    t1.to(mesh.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: jumpDuration * 0.2,
      ease: "elastic.out(1, 0.3)",
    });
}



function onPointerMove( event ) {
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onClick(){
    console.log("Clicked on: ", intersectedObject);
   if(intersectedObject !== ""){ 
        if(["Baby_Goku_Super_Saiyan","Baby_Goku_Halloween","Baby_Goku_Super_Saiyan_III","Baby_Goku_Super_Saiyan_IV"].includes(intersectedObject)){
            jumpCharacter(intersectedObject);
        }else{   
            showModel(intersectedObject);  
        }    
    }
}


function moveCharacter(targetPosition, targetRotation) {
    character.isMoving = true;

    // let rotationDiff = 
    //    ((((targetRotation - character.instance.rotation.y) % (2* Math.PI)) +
    //       3 & Math.PI) %
    //       (2 * Math.PI)) - Math.PI;
    // let finalRotation = character.instance.rotation.y + rotationDiff;      
       

    const t1= gsap.timeline({
        onComplete: () => {
            character.isMoving = false;
        },
    });

    t1.to(character.instance.position, {
        x: targetPosition.x,
        z: targetPosition.z,
        duration: character.moveDuration,
    });

    t1.to(character.instance.rotation, {
        y: targetRotation,
        duration: character.moveDuration,
    }, 0);

    t1.to(character.instance.position, {
        y: character.instance.position.y + character.jumpHeight,
        duration: character.moveDuration /2,
        yoyo: true,
        repeat: 1,
    }, 0);
}


// Movement and Gameplay functions
function respawnCharacter() {
  character.instance.position.copy(character.spawnPosition);

  playerCollider.start
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
  playerCollider.end
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));

  playerVelocity.set(0, 0, 0);
  character.isMoving = false;

    // Reset rotation to face forward (0 degrees)
  character.instance.rotation.y = 0;
  targetRotation = 0;

  camera.zoom = DEFAULT_ZOOM;
  camera.updateProjectionMatrix();
}

function playerCollisions(){
    const result = colliderOctree.capsuleIntersect(playerCollider);
    playerOnFloor = false;

    if(result){
        playerOnFloor = result.normal.y > 0;
        playerCollider.translate(result.normal.multiplyScalar(result.depth));

        if (playerOnFloor) {
        character.isMoving = false;
        playerVelocity.x = 0;
        playerVelocity.z = 0;
        }
    }
}

function updatePlayer(){
    if( !character.instance ) return;

    if (character.instance.position.y < -20) {
    respawnCharacter();
    return;
    }
    
    if( !playerOnFloor){
        playerVelocity.y -= GRAVITY * 0.03;
    }

    playerCollider.translate(playerVelocity.clone().multiplyScalar(0.03));

    playerCollisions();

    character.instance.position.copy(playerCollider.start);
    character.instance.position.y -= CAPSULE_RADIUS;

    let rotationDiff =
    ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
      3 * Math.PI) %
      (2 * Math.PI)) -
    Math.PI;
    let finalRotation = character.instance.rotation.y + rotationDiff;

    character.instance.rotation.y = THREE.MathUtils.lerp(character.instance.rotation.y, finalRotation, 0.4);

}

function onKeydown(event){
  //  console.log(event);

    if (event.code.toLowerCase() === "keyr") {
    respawnCharacter();
    return;
    }

    if( character.isMoving) return;

    switch(event.key.toLowerCase()){
        case "w":
        case "arrowup":
            playerVelocity.z -= MOVE_SPEED;
            targetRotation = -Math.PI;
        break;
         case "s":
        case "arrowdown":
            playerVelocity.z += MOVE_SPEED;
            targetRotation = 0;
        break;
         case "a":
        case "arrowleft":
            playerVelocity.x -= MOVE_SPEED;
            targetRotation = -Math.PI/2;
        break;
         case "d":
        case "arrowright":
            playerVelocity.x += MOVE_SPEED;
            targetRotation = Math.PI/2;
        break;
        default:
            return;
    }
    playerVelocity.y = JUMP_HEIGHT;  
    character.isMoving = true; 
}



modelExitButton.addEventListener("click", hideModel);
window.addEventListener("resize", onResize); 
window.addEventListener("click", onClick); 
window.addEventListener( 'pointermove', onPointerMove );
window.addEventListener( 'keydown', onKeydown );

function animate() { 
  // console.log(camera.position);
    
    updatePlayer();
    
    if(character.instance){
            
             const targetCameraPosition = new THREE.Vector3(character.instance.position.x + cameraOffset.x,
                                                            cameraOffset.y,
                                                            character.instance.position.z + cameraOffset.z);
             camera.position.copy(targetCameraPosition);
             camera.lookAt(character.instance.position.x,
                           camera.position.y - 50,
                           character.instance.position.z
             );                                                
               
    }


	raycaster.setFromCamera( pointer, camera );
	const intersects = raycaster.intersectObjects( intersectObjects );

    if ( intersects.length > 0 ) {
        document.body.style.cursor = 'pointer';
    }else{
        document.body.style.cursor = 'default';
        intersectedObject = "";
    }    

	for ( let i = 0; i < intersects.length; i ++ ) {
       // console.log(intersects[0].object.parent.name);
        intersectedObject = intersects[0].object.name;
	}

  renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );


