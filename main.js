import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Octree } from 'three/addons/math/Octree.js';
import { Capsule } from 'three/addons/math/Capsule.js';

//Audio with Howler.js
const sounds = {
  backgroundMusic: new Howl({
    src: ["./sfx/music.ogg"],
    loop: true,
    volume: 0.3,
    preload: true,
  }),

  projectsSFX: new Howl({
    src: ["./sfx/projects.ogg"],
    volume: 0.5,
    preload: true,
  }),

  pokemonSFX: new Howl({
    src: ["./sfx/pokemon.ogg"],
    volume: 0.5,
    preload: true,
  }),

  jumpSFX: new Howl({
    src: ["./sfx/jumpsfx.ogg"],
    volume: 1.0,
    preload: true,
  }),
};

let touchHappened = false;

let isMuted = false;

function playSound(soundId) {
  if (!isMuted && sounds[soundId]) {
    sounds[soundId].play();
  }
}

function stopSound(soundId) {
  if (sounds[soundId]) {
    sounds[soundId].stop();
  }
}

//three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaec972);
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

// Renderer
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


let isModelOpen = false
const model = document.querySelector(".model");
const modelbgOverlay = document.querySelector(".model-bg-overlay");
const modelTitle = document.querySelector(".model-title");
const modelProjectDescription = document.querySelector(".model-project-description");
const modelExitButton = document.querySelector(".model-exit-button");
const modelProjectVisitButton = document.querySelector(".model-project-visit-button");

const themeToggleButton = document.querySelector(".theme-mode-toggle-button");
const firstIcon = document.querySelector(".first-icon");
const secondIcon = document.querySelector(".second-icon");

const audioToggleButton = document.querySelector(".audio-toggle-button");
const firstIconTwo = document.querySelector(".first-icon-two");
const secondIconTwo = document.querySelector(".second-icon-two");



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
        modelbgOverlay.classList.remove("hidden");
        isModelOpen = true;
    }    
}

function hideModel() {
  isModelOpen = false;
  model.classList.add("hidden");
  modelbgOverlay.classList.add("hidden");
  if (!isMuted) {
    playSound("projectsSFX");
  }
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



// Loading screen and loading manager
// See: https://threejs.org/docs/#api/en/loaders/managers/LoadingManager
const loadingScreen = document.getElementById("loadingScreen");
const loadingText = document.querySelector(".loading-text");
const enterButton = document.querySelector(".enter-button");
const instructions = document.querySelector(".instructions");

const manager = new THREE.LoadingManager();

manager.onLoad = function () {
  const t1 = gsap.timeline();

  t1.to(loadingText, {
    opacity: 0,
    duration: 0,
  });

  t1.to(enterButton, {
    opacity: 1,
    duration: 0,
  });
};

enterButton.addEventListener("click", () => {
  gsap.to(loadingScreen, {
    opacity: 0,
    duration: 0,
  });
  gsap.to(instructions, {
    opacity: 0,
    duration: 0,
    onComplete: () => {
      loadingScreen.remove();
    },
  });

  if (!isMuted) {
    playSound("projectsSFX");
    playSound("backgroundMusic");
  }
});



const loader = new GLTFLoader(manager);

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


// Lights
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
scene.add(sun.target);
scene.add(sun);

// const shadowHelper = new THREE.CameraHelper( sun.shadow.camera );
// scene.add( shadowHelper )
// // const helper = new THREE.DirectionalLightHelper( sun, 5 );
// // scene.add( helper );


// Camera setup
const aspect = sizes.width / sizes.height;
const camera = new THREE.OrthographicCamera( -aspect*50, aspect*50, 50, -50, -1000, 1000 );
const DEFAULT_ZOOM = 2;

camera.position.x = 50;
camera.position.y = 50;
camera.position.z = 50;
camera.zoom = DEFAULT_ZOOM; // Set initial zoom
camera.updateProjectionMatrix();
const cameraOffset = new THREE.Vector3(50, 50, 50);


const controls = new OrbitControls( camera, canvas );
controls.minZoom = 1;    // Prevents zooming out beyond this level
controls.maxZoom = 3;    // Limits maximum zoom in
controls.update();


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
  touchHappened = false;
}

function onTouchEnd(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  touchHappened = true;
  onClick();
}

function onClick(){
  //  console.log("Clicked on: ", intersectedObject);
   if(touchHappened) return;

   if(intersectedObject !== ""){ 
        if(["Baby_Goku_Super_Saiyan","Baby_Goku_Halloween","Baby_Goku_Super_Saiyan_III","Baby_Goku_Super_Saiyan_IV"].includes(intersectedObject)){
          if( !isMuted)  {
            playSound("pokemonSFX");
          }
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




// Toggle Theme Function
function toggleTheme() {
  if (!isMuted) {
    playSound("projectsSFX");
  }
  const isDarkTheme = document.body.classList.contains("dark-theme");
  document.body.classList.toggle("dark-theme");
  document.body.classList.toggle("light-theme");

  if (firstIcon.style.display === "none") {
    firstIcon.style.display = "block";
    secondIcon.style.display = "none";
  } else {
    firstIcon.style.display = "none";
    secondIcon.style.display = "block";
  }

  gsap.to(light.color, {
    r: isDarkTheme ? 1.0 : 0.25,
    g: isDarkTheme ? 1.0 : 0.31,
    b: isDarkTheme ? 1.0 : 0.78,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(light, {
    intensity: isDarkTheme ? 0.8 : 0.9,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(sun, {
    intensity: isDarkTheme ? 1 : 0.8,
    duration: 1,
    ease: "power2.inOut",
  });

  gsap.to(sun.color, {
    r: isDarkTheme ? 1.0 : 0.25,
    g: isDarkTheme ? 1.0 : 0.41,
    b: isDarkTheme ? 1.0 : 0.88,
    duration: 1,
    ease: "power2.inOut",
  });
}

// Toggle Audio Function
function toggleAudio() {
  if (!isMuted) {
    playSound("projectsSFX");
  }
  if (firstIconTwo.style.display === "none") {
    firstIconTwo.style.display = "block";
    secondIconTwo.style.display = "none";
    isMuted = false;
    sounds.backgroundMusic.play();
  } else {
    firstIconTwo.style.display = "none";
    secondIconTwo.style.display = "block";
    isMuted = true;
    sounds.backgroundMusic.pause();
  }
}

// Mobile controls
const mobileControls = {
  up: document.querySelector(".mobile-control.up-arrow"),
  left: document.querySelector(".mobile-control.left-arrow"),
  right: document.querySelector(".mobile-control.right-arrow"),
  down: document.querySelector(".mobile-control.down-arrow"),
};

const pressedButtons = {
  up: false,
  left: false,
  right: false,
  down: false,
};

function handleJumpAnimation() {
  if (!character.instance || !character.isMoving) return;

  const jumpDuration = 0.5;
  const jumpHeight = 2;

  const t1 = gsap.timeline();

  t1.to(character.instance.scale, {
    x: 1.08,
    y: 0.9,
    z: 1.08,
    duration: jumpDuration * 0.2,
    ease: "power2.out",
  });

  t1.to(character.instance.scale, {
    x: 0.92,
    y: 1.1,
    z: 0.92,
    duration: jumpDuration * 0.3,
    ease: "power2.out",
  });

  t1.to(character.instance.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: jumpDuration * 0.3,
    ease: "power1.inOut",
  });

  t1.to(character.instance.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: jumpDuration * 0.2,
  });
}


Object.entries(mobileControls).forEach(([direction, element]) => {
  element.addEventListener("touchstart", (e) => {
    e.preventDefault();
    pressedButtons[direction] = true;
  });

  element.addEventListener("touchend", (e) => {
    e.preventDefault();
    pressedButtons[direction] = false;
  });

  element.addEventListener("mousedown", (e) => {
    e.preventDefault();
    pressedButtons[direction] = true;
  });

  element.addEventListener("mouseup", (e) => {
    e.preventDefault();
    pressedButtons[direction] = false;
  });

  element.addEventListener("mouseleave", (e) => {
    pressedButtons[direction] = false;
  });

  element.addEventListener("touchcancel", (e) => {
    pressedButtons[direction] = false;
  });
});

window.addEventListener("blur", () => {
  Object.keys(pressedButtons).forEach((key) => {
    pressedButtons[key] = false;
  });
});



modelExitButton.addEventListener("click", hideModel);
modelbgOverlay.addEventListener("click", hideModel);
themeToggleButton.addEventListener("click", toggleTheme);
audioToggleButton.addEventListener("click", toggleAudio);
window.addEventListener("touchend", onTouchEnd, { passive: false });
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

