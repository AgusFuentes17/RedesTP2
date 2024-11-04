import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';



// Variables para el control manual de la cámara
let rotationSpeed = 0.002; // Sensibilidad de la cámara
let yaw = 0; // Rotación horizontal de la cámara
let pitch = 0; // Rotación vertical de la cámara

// Inicializar escena, cámara y renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Posición inicial de la cámara
camera.position.z = 20;

// Configuración de Cannon.js para la física
const world = new CANNON.World();
world.gravity.set(0, 0, 0); // Sin gravedad, ya que queremos que el cubo siga al planeta

// Crear el planeta en Three.js
const planetGeometry = new THREE.SphereGeometry(10, 32, 32);
const planetMaterial = new THREE.MeshStandardMaterial({ color: 0x0077ff, wireframe: false });
const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
scene.add(planetMesh);

// Crear el planeta en Cannon.js
const planetShape = new CANNON.Sphere(10); // Radio de 10 igual que en Three.js
const planetBody = new CANNON.Body({ mass: 0 }); // Sin masa, así que no se mueve
planetBody.addShape(planetShape);
world.addBody(planetBody);

// Crear el cubo en Three.js
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cubeMesh);

// Crear el cubo en Cannon.js
const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)); // Tamaño acorde con Three.js
const cubeBody = new CANNON.Body({ mass: 1 });
cubeBody.addShape(cubeShape);
cubeBody.position.set(0, 11, 0); // Posición inicial fuera del planeta
world.addBody(cubeBody);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

const moveAngle = 0.1; // Ajusta la velocidad de rotación

window.addEventListener('keydown', (event) => {
    // Vector desde el centro del planeta hacia el cubo
    const planetCenter = new CANNON.Vec3(0, 0, 0);
    const direction = cubeBody.position.vsub(planetCenter).unit();

    // Convertir a THREE.Vector3 para aplicar rotación
    const directionThree = new THREE.Vector3(direction.x, direction.y, direction.z);

    // Calcular desplazamiento de acuerdo con la tecla presionada
    let axis;
    switch (event.key) {
        case 'ArrowUp':
            axis = new THREE.Vector3(1, 0, 0); // Eje para rotación sobre X
            break;
        case 'ArrowDown':
            axis = new THREE.Vector3(-1, 0, 0); // Eje opuesto en X
            break;
        case 'ArrowLeft':
            axis = new THREE.Vector3(0, 0, 1); // Eje para rotación sobre Z
            break;
        case 'ArrowRight':
            axis = new THREE.Vector3(0, 0, -1); // Eje opuesto en Z
            break;
        default:
            return;
    }

    // Crear una rotación en torno al eje indicado
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis, moveAngle); // Rotar en función del ángulo
    directionThree.applyQuaternion(quaternion); // Aplicar rotación al vector dirección

    // Convertir el vector de regreso a CANNON.Vec3
    const newDirection = new CANNON.Vec3(directionThree.x, directionThree.y, directionThree.z);

    // Actualizar la posición del cubo en la superficie del planeta
    const targetPosition = newDirection.scale(10 + 0.5); // Radio del planeta + mitad del cubo
    cubeBody.position.copy(targetPosition);
});

camera.position.set(0, 20, 30);
camera.lookAt(0, 0, 0); // Apuntar al centro de la escena

// Posición inicial del cubo sobre el planeta
cubeBody.position.set(0, 10.5, 0); // Radio del planeta (10) + mitad del tamaño del cubo (0.5)
cubeMesh.position.copy(cubeBody.position); // Sincronizar visualmente

// Reforzar la actualización de la posición del cubo para mantenerlo en la superficie
function keepCubeOnPlanetSurface() {
    const planetCenter = new CANNON.Vec3(0, 0, 0);
    const direction = cubeBody.position.vsub(planetCenter).unit();
    const targetPosition = direction.scale(10 + 0.5); // Radio del planeta + mitad del cubo
    cubeBody.position.copy(targetPosition);
    cubeMesh.position.copy(cubeBody.position); // Actualizar la posición en Three.js
}

const canvas = renderer.domElement;

// Detectar el clic en el canvas para iniciar el bloqueo de cursor
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
});


// Manejar el movimiento del mouse cuando el puntero está bloqueado
document.addEventListener('mousemove', (event) => {
    // Solo si el puntero está bloqueado
    if (document.pointerLockElement === canvas) {
        yaw -= event.movementX * rotationSpeed;
        pitch -= event.movementY * rotationSpeed;

        // Limitar el ángulo de pitch para que la cámara no gire completamente en vertical
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

        // Aplicar las rotaciones a la cámara
        camera.rotation.set(pitch, yaw, 0);
    }
});


// Configurar la posición y orientación de la cámara en tercera persona
function updateCameraPosition() {
    const offsetDistance = 5; // Distancia de la cámara al cubo
    const cameraHeight = 3;   // Altura de la cámara sobre el cubo

    // Posición del cubo
    const cubePosition = new THREE.Vector3(cubeBody.position.x, cubeBody.position.y, cubeBody.position.z);

    // Offset de la cámara respecto al cubo
    const cameraOffset = new THREE.Vector3(0, cameraHeight, -offsetDistance);
    cameraOffset.applyQuaternion(cubeMesh.quaternion); // Orientar en la dirección del cubo
    camera.position.copy(cubePosition).add(cameraOffset); // Ubicar la cámara detrás y encima del cubo

    // Mantener la vista enfocada en el cubo
    camera.lookAt(cubeMesh.position);
}

// En tu bucle de animación, llama a esta función
function animate() {
    requestAnimationFrame(animate);

    // Actualiza la simulación de física de Cannon.js
    world.step(1 / 60);

    // Mantener el cubo en la superficie del planeta
    keepCubeOnPlanetSurface();

    // Sincronizar la posición y rotación del cubo
    cubeMesh.position.copy(cubeBody.position);
    cubeMesh.quaternion.copy(cubeBody.quaternion);

    // Actualizar la posición de la cámara en tercera persona
    updateCameraPosition();

    // Renderizar la escena
    renderer.render(scene, camera);
}
animate();

