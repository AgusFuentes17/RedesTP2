import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
let scene, camera, renderer;
let planetMesh, planetBody;
let world;
let boxMesh, boxBody;
const keys = {}; // Guardar el estado de las teclas presionadas
let cameraDistance = 5; // Distancia inicial de la cámara desde el cubo
let cameraAngleY = 0; // Ángulo de rotación horizontal
let cameraAngleX = 0; // Ángulo de rotación vertical
const cameraSpeed = 0.1; // Velocidad de rotación de la cámara

// Iniciar la escena
init();
animate();

function init() {
    // Escena y cámara
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, cameraDistance);

    // Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Cargar la textura del fondo
    const textureLoader = new THREE.TextureLoader();
    const backgroundTexture = textureLoader.load('descargar.png'); // Cambia esta ruta por la de tu textura
    scene.background = backgroundTexture;

    // Crear el planeta en Three.js
    const planetGeometry = new THREE.SphereGeometry(20, 32, 32);
    
    // Cargar la textura del planeta
    const planetTexture = textureLoader.load('planeta.jpg'); // Cambia esta ruta por la de tu textura
    const planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture });
    
    planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planetMesh);

    // Mundo de física en Cannon.js
    world = new CANNON.World();
    world.gravity.set(0, 0, 0); // No usamos gravedad global.
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Crear el cuerpo físico del planeta
    const planetShape = new CANNON.Sphere(20);
    planetBody = new CANNON.Body({ mass: 0, shape: planetShape });
    planetBody.position.set(0, 0, 0);
    world.addBody(planetBody);

    // Crear el cubo que será controlado por WASD
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    // Cargar la textura para el cubo
    const boxTexture = textureLoader.load('cohete.png'); // Cambia esta ruta por la de tu textura
    const boxMaterial = new THREE.MeshBasicMaterial({ map: boxTexture }); // Aplica la textura al material del cubo
    
    boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    scene.add(boxMesh);

    const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    boxBody = new CANNON.Body({ mass: 1, shape: boxShape });
    boxBody.position.set(30, 0, 0); // Iniciar en una posición
    world.addBody(boxBody);

    // Vincular el mesh de Three.js con el cuerpo de Cannon.js
    boxMesh.userData.physicsBody = boxBody;
    // Eventos de teclado
    window.addEventListener('keydown', (event) => (keys[event.key] = true));
    window.addEventListener('keyup', (event) => (keys[event.key] = false));

    // Evento para redimensionar
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener('wheel', (event) => {
        cameraDistance -= event.deltaY * 0.1; // Cambiar la distancia de la cámara
        cameraDistance = Math.max(2, Math.min(20, cameraDistance)); // Limitar distancia entre 2 y 20
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Actualizar físicas
    world.step(1 / 60);

    // Aplicar gravedad hacia el centro del planeta
    world.bodies.forEach((body) => {
        if (body.mass > 0) {
            const toCenter = new CANNON.Vec3().copy(planetBody.position).vsub(body.position);
            const distance = toCenter.length();
            const gravityForce = toCenter.scale(100 / (distance * distance));
            body.applyForce(gravityForce, body.position);
        }
    });

    // Controlar el cubo con WASD
    controlCube();

    // Sincronizar los meshes con los cuerpos físicos
    scene.traverse((object) => {
        if (object.userData.physicsBody) {
            const body = object.userData.physicsBody;
            object.position.copy(body.position);
            object.quaternion.copy(body.quaternion);
        }
    });


    // Cambiar la perspectiva de la cámara usando las teclas de flecha
    if (keys['ArrowUp']) {
        cameraAngleX -= cameraSpeed; // Rotar hacia arriba
    }
    if (keys['ArrowDown']) {
        cameraAngleX += cameraSpeed; // Rotar hacia abajo
    }
    if (keys['ArrowLeft']) {
        cameraAngleY -= cameraSpeed; // Rotar hacia la izquierda
    }
    if (keys['ArrowRight']) {
        cameraAngleY += cameraSpeed; // Rotar hacia la derecha
    }

    // Actualizar la posición de la cámara
    updateCameraPosition();
    // Renderizar la escena
    renderer.render(scene, camera);
}
function updateCameraPosition() {
    // Calcular la nueva posición de la cámara basada en los ángulos
    const offset = new THREE.Vector3();
    offset.x = cameraDistance * Math.sin(cameraAngleY) * Math.cos(cameraAngleX);
    offset.y = cameraDistance * Math.sin(cameraAngleX);
    offset.z = cameraDistance * Math.cos(cameraAngleY) * Math.cos(cameraAngleX);

    camera.position.copy(boxMesh.position).add(offset); // Mantener la cámara sobre el cubo
    camera.lookAt(boxMesh.position); // La cámara mira hacia el cubo
}

function controlCube() {
    const force = 20; // Magnitud de la fuerza aplicada
    const velocity = new CANNON.Vec3(0, 0, 0); // Vector de velocidad

    if (keys['w'] || keys['W']) {
        velocity.z -= force; // Mover hacia adelante
    }
    if (keys['s'] || keys['S']) {
        velocity.z += force; // Mover hacia atrás
    }
    if (keys['a'] || keys['A']) {
        velocity.x -= force; // Mover hacia la izquierda
    }
    if (keys['d'] || keys['D']) {
        velocity.x += force; // Mover hacia la derecha
    }
    if(keys['z'] || keys['Z']){
        velocity.y += force;
    }
    if(keys['x'] || keys['X']){
        velocity.y -= force;
    }

    // Establecer la velocidad del cubo
    boxBody.velocity.x = velocity.x;
    boxBody.velocity.z = velocity.z;
    boxBody.velocity.y = velocity.y;
}