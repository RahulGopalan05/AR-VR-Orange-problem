import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 80, 300);

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 0.6;
renderer.physicallyCorrectLights = true;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Enhanced Lighting System
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Main directional light (Sun)
const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
sunLight.position.set(60, 80, 40);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -150;
sunLight.shadow.camera.right = 150;
sunLight.shadow.camera.top = 150;
sunLight.shadow.camera.bottom = -150;
sunLight.shadow.bias = -0.0001;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);

// Secondary directional light for fill
const fillLight = new THREE.DirectionalLight(0x8bb7f0, 0.4);
fillLight.position.set(-40, 50, -30);
scene.add(fillLight);

// Hemisphere light for natural ambient
const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4a4a4a, 0.6);
scene.add(hemisphereLight);

// Point lights for indoor areas
const pointLight1 = new THREE.PointLight(0xfff5e6, 0.8, 50);
pointLight1.position.set(0, 10, 0);
pointLight1.castShadow = true;
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xfff5e6, 0.6, 40);
pointLight2.position.set(-15, 8, 15);
pointLight2.castShadow = true;
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xfff5e6, 0.6, 40);
pointLight3.position.set(15, 8, -15);
pointLight3.castShadow = true;
scene.add(pointLight3);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a7d44,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Grid helper
const gridHelper = new THREE.GridHelper(500, 50, 0x000000, 0x555555);
gridHelper.material.opacity = 0.2;
gridHelper.material.transparent = true;
scene.add(gridHelper);

// Controls
let orbitControls, pointerLockControls;
let currentView = 'third-person';
let model, doorObject;
let isDoorOpen = false;
let doorRotation = 0;
const doorOpenAngle = Math.PI / 2;
const doorSpeed = 0.05;

// Physics and collision variables
let gravityEnabled = true;
let collisionsEnabled = true;
let isOnGround = false;
const gravity = -20.0;
const jumpVelocity = 8;
let verticalVelocity = 0;
const groundStickiness = 0.1; // Helps prevent bouncing
const groundSnapThreshold = 0.2; // Distance threshold for snapping to ground

// Collision detection arrays
const collisionMeshes = [];
const raycaster = new THREE.Raycaster();

// First person movement
const moveSpeed = 0.15;
const sprintMultiplier = 2;
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    jump: false
};

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Player collision properties
const playerHeight = 1.8;
const playerRadius = 0.5;
const playerCollisionBox = new THREE.Box3();

// Setup Third Person Controls
function setupThirdPersonView() {
    if (pointerLockControls) {
        pointerLockControls.unlock();
    }
    
    if (!orbitControls) {
        orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;
        orbitControls.minDistance = 5;
        orbitControls.maxDistance = 100;
        orbitControls.maxPolarAngle = Math.PI / 2;
    }
    
    orbitControls.enabled = true;
    
    if (model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        
        camera.position.set(
            center.x + distance * 0.7,
            center.y + distance * 0.5,
            center.z + distance * 0.7
        );
        
        orbitControls.target.copy(center);
    } else {
        camera.position.set(20, 15, 20);
        orbitControls.target.set(0, 0, 0);
    }
    
    orbitControls.update();
    currentView = 'third-person';
    document.getElementById('current-view').textContent = 'View: Third Person';
}

// Setup First Person Controls
function setupFirstPersonView() {
    if (orbitControls) {
        orbitControls.enabled = false;
    }
    
    if (!pointerLockControls) {
        pointerLockControls = new PointerLockControls(camera, renderer.domElement);
        scene.add(pointerLockControls.getObject());
        
        renderer.domElement.addEventListener('click', () => {
            if (currentView === 'first-person') {
                pointerLockControls.lock();
            }
        });
    }
    
    if (model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        pointerLockControls.getObject().position.set(
            center.x + 10,
            playerHeight,
            center.z + 10
        );
    } else {
        pointerLockControls.getObject().position.set(0, playerHeight, 10);
    }
    
    verticalVelocity = 0;
    currentView = 'first-person';
    document.getElementById('current-view').textContent = 'View: First Person (Click to lock mouse)';
}

// Keyboard controls for first person
document.addEventListener('keydown', (event) => {
    if (currentView !== 'first-person') return;
    
    switch (event.code) {
        case 'KeyW':
            moveState.forward = true;
            break;
        case 'KeyS':
            moveState.backward = true;
            break;
        case 'KeyA':
            moveState.left = true;
            break;
        case 'KeyD':
            moveState.right = true;
            break;
        case 'ArrowUp':
            if (!gravityEnabled) moveState.up = true;
            break;
        case 'ArrowDown':
            if (!gravityEnabled) moveState.down = true;
            break;
        case 'ShiftLeft':
            moveState.sprint = true;
            break;
        case 'Space':
            if (gravityEnabled && isOnGround) {
                verticalVelocity = jumpVelocity;
                isOnGround = false;
            } else if (!gravityEnabled) {
                moveState.up = true;
            }
            event.preventDefault();
            break;
        case 'KeyE':
            toggleDoor();
            break;
    }
});

document.addEventListener('keyup', (event) => {
    if (currentView !== 'first-person') return;
    
    switch (event.code) {
        case 'KeyW':
            moveState.forward = false;
            break;
        case 'KeyS':
            moveState.backward = false;
            break;
        case 'KeyA':
            moveState.left = false;
            break;
        case 'KeyD':
            moveState.right = false;
            break;
        case 'ArrowUp':
            moveState.up = false;
            break;
        case 'ArrowDown':
            moveState.down = false;
            break;
        case 'ShiftLeft':
            moveState.sprint = false;
            break;
        case 'Space':
            moveState.up = false;
            break;
    }
});

// Door toggle functionality
function toggleDoor() {
    isDoorOpen = !isDoorOpen;
}

function animateDoor() {
    if (!doorObject) return;
    
    const targetRotation = isDoorOpen ? doorOpenAngle : 0;
    
    if (Math.abs(doorRotation - targetRotation) > 0.01) {
        if (doorRotation < targetRotation) {
            doorRotation += doorSpeed;
            if (doorRotation > targetRotation) doorRotation = targetRotation;
        } else {
            doorRotation -= doorSpeed;
            if (doorRotation < targetRotation) doorRotation = targetRotation;
        }
        
        doorObject.rotation.y = doorRotation;
    }
}

// Collision detection function
function checkCollision(position, direction, distance) {
    if (!collisionsEnabled) return false;
    
    raycaster.set(position, direction);
    raycaster.far = distance;
    
    const intersections = raycaster.intersectObjects(collisionMeshes, true);
    return intersections.length > 0;
}

// Check if player is on ground
function checkGroundCollision(position) {
    const downDirection = new THREE.Vector3(0, -1, 0);
    raycaster.set(position, downDirection);
    raycaster.far = 2.0; // Increased range to detect floors better
    
    const intersections = raycaster.intersectObjects(collisionMeshes, true);
    if (intersections.length > 0) {
        // Return the closest intersection
        return intersections[0];
    }
    return null;
}

// Check collisions in all directions
function checkAllCollisions(newPosition) {
    if (!collisionsEnabled) return true;
    
    const directions = [
        new THREE.Vector3(1, 0, 0),   // right
        new THREE.Vector3(-1, 0, 0),  // left
        new THREE.Vector3(0, 0, 1),   // forward
        new THREE.Vector3(0, 0, -1),  // backward
    ];
    
    for (const dir of directions) {
        if (checkCollision(newPosition, dir, playerRadius)) {
            return false;
        }
    }
    
    return true;
}

// Load model
const loader = new GLTFLoader();
loader.load(
    'arvr5.glb',
    (gltf) => {
        model = gltf.scene;
        
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Add to collision meshes (except for very small decorative objects)
                const box = new THREE.Box3().setFromObject(child);
                const size = box.getSize(new THREE.Vector3());
                const minSize = 0.1; // Minimum size to be considered for collision
                
                if (size.x > minSize || size.y > minSize || size.z > minSize) {
                    collisionMeshes.push(child);
                }
                
                if (child.name.toLowerCase().includes('folding') || 
                    child.name.toLowerCase().includes('door')) {
                    doorObject = child;
                    console.log('Door found:', child.name);
                }
            }
        });
        
        // Add ground to collision meshes
        collisionMeshes.push(ground);
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;
        
        scene.add(model);
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('controls-panel').classList.remove('hidden');
        document.getElementById('info-panel').classList.remove('hidden');
        
        setupThirdPersonView();
        
        console.log('Model loaded successfully');
        console.log('Model size:', size);
        console.log('Collision meshes:', collisionMeshes.length);
        console.log('Door object:', doorObject ? 'Found' : 'Not found');
    },
    (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        console.log('Loading: ' + percentComplete.toFixed(2) + '%');
    },
    (error) => {
        console.error('Error loading model:', error);
        document.getElementById('loading').innerHTML = '<div>Error loading model. Check console for details.</div>';
    }
);

// Button event listeners
document.getElementById('btn-first-person').addEventListener('click', () => {
    setupFirstPersonView();
    document.getElementById('btn-first-person').classList.add('active-view');
    document.getElementById('btn-third-person').classList.remove('active-view');
});

document.getElementById('btn-third-person').addEventListener('click', () => {
    setupThirdPersonView();
    document.getElementById('btn-third-person').classList.add('active-view');
    document.getElementById('btn-first-person').classList.remove('active-view');
});

document.getElementById('btn-toggle-door').addEventListener('click', () => {
    toggleDoor();
});

document.getElementById('btn-toggle-gravity').addEventListener('click', () => {
    gravityEnabled = !gravityEnabled;
    const btn = document.getElementById('btn-toggle-gravity');
    btn.textContent = gravityEnabled ? 'Disable Gravity' : 'Enable Gravity';
    btn.classList.toggle('active-view');
    
    if (!gravityEnabled) {
        verticalVelocity = 0;
    }
});

document.getElementById('btn-toggle-collisions').addEventListener('click', () => {
    collisionsEnabled = !collisionsEnabled;
    const btn = document.getElementById('btn-toggle-collisions');
    btn.textContent = collisionsEnabled ? 'Disable Collisions' : 'Enable Collisions';
    btn.classList.toggle('active-view');
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (currentView === 'third-person') {
        setupThirdPersonView();
    } else {
        setupFirstPersonView();
    }
});

// FPS counter
let lastTime = performance.now();
let frames = 0;
let fps = 60;

function updateFPS() {
    frames++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        document.getElementById('fps-counter').textContent = `FPS: ${fps}`;
        frames = 0;
        lastTime = currentTime;
    }
}

// Update camera position display
function updateCameraPosition() {
    const pos = camera.position;
    document.getElementById('camera-position').textContent = 
        `Position: X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = 0.016; // Approximate 60fps delta time
    
    // First person movement with physics and collision
    if (currentView === 'first-person' && pointerLockControls.isLocked) {
        const playerObject = pointerLockControls.getObject();
        
        // Apply gravity
        if (gravityEnabled) {
            // Apply gravity force
            verticalVelocity += gravity * delta;
            
            // Calculate new Y position
            const newY = playerObject.position.y + verticalVelocity * delta;
            
            // Check ground from current position
            const groundCheck = new THREE.Vector3(
                playerObject.position.x,
                newY,
                playerObject.position.z
            );
            
            const groundIntersection = checkGroundCollision(groundCheck);
            
            if (groundIntersection) {
                const groundY = groundIntersection.point.y;
                const distanceToGround = newY - groundY;
                
                // If we're falling and about to hit or below ground
                if (verticalVelocity <= 0 && distanceToGround <= playerHeight) {
                    // Snap to ground and stop falling
                    playerObject.position.y = groundY + playerHeight;
                    verticalVelocity = 0;
                    isOnGround = true;
                } else {
                    // We're in the air (jumping or above ground)
                    playerObject.position.y = newY;
                    isOnGround = false;
                }
            } else {
                // No ground detected, continue falling
                playerObject.position.y = newY;
                isOnGround = false;
            }
            
            // Absolute minimum height (fallback to world ground)
            if (playerObject.position.y < playerHeight) {
                playerObject.position.y = playerHeight;
                verticalVelocity = 0;
                isOnGround = true;
            }
        } else {
            // Free fly mode when gravity is disabled
            verticalVelocity = 0;
            if (moveState.up) {
                playerObject.position.y += moveSpeed * 2;
            }
            if (moveState.down) {
                playerObject.position.y -= moveSpeed * 2;
            }
        }
        
        // Horizontal movement
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        
        direction.z = Number(moveState.forward) - Number(moveState.backward);
        direction.x = Number(moveState.right) - Number(moveState.left);
        direction.normalize();
        
        const speed = moveState.sprint ? moveSpeed * sprintMultiplier : moveSpeed;
        
        if (moveState.forward || moveState.backward) velocity.z -= direction.z * speed;
        if (moveState.left || moveState.right) velocity.x -= direction.x * speed;
        
        // Store old position
        const oldPosition = playerObject.position.clone();
        
        // Calculate new position
        const moveVector = new THREE.Vector3();
        pointerLockControls.getDirection(moveVector);
        moveVector.y = 0;
        moveVector.normalize();
        
        const strafeVector = new THREE.Vector3();
        strafeVector.crossVectors(moveVector, new THREE.Vector3(0, 1, 0));
        
        const newPosition = oldPosition.clone();
        newPosition.add(moveVector.multiplyScalar(-velocity.z));
        newPosition.add(strafeVector.multiplyScalar(-velocity.x));
        
        // Check collision at new position
        if (checkAllCollisions(newPosition)) {
            playerObject.position.copy(newPosition);
        } else {
            // Try moving only in X direction
            const newPosX = oldPosition.clone();
            newPosX.x = newPosition.x;
            if (checkAllCollisions(newPosX)) {
                playerObject.position.x = newPosition.x;
            }
            
            // Try moving only in Z direction
            const newPosZ = oldPosition.clone();
            newPosZ.z = newPosition.z;
            if (checkAllCollisions(newPosZ)) {
                playerObject.position.z = newPosition.z;
            }
        }
    }
    
    // Update controls
    if (orbitControls && orbitControls.enabled) {
        orbitControls.update();
    }
    
    // Animate door
    animateDoor();
    
    // Update UI
    updateFPS();
    updateCameraPosition();
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();