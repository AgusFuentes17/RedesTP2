import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';


// Variables para la cámara y el jugador
// Variables de la cámara
let cameraDistance = 10;         // Distancia de la cámara desde el jugador
let cameraHeight = 5;            // Altura inicial de la cámara sobre el jugador
let angleAroundPlayer = 0;       // Ángulo de la cámara alrededor del jugador (horizontal)
let angleVertical = 0.3;         // Ángulo de la cámara en el eje Y (inclinación vertical)
const rotationSpeed = 0.03;      // Velocidad de rotación de la cámara en horizontal
const verticalRotationSpeed = 0.02; // Velocidad de rotación en el eje Y (vertical)
const maxVerticalAngle = Math.PI / 3; // Ángulo máximo en el eje Y (para evitar rotaciones extremas)
const playerSpeed = 0.1;         // Velocidad de movimiento del jugador



// Configuración de Three.js
const scene = new THREE.Scene();

// Configurar el renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Crear la cámara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 20); // Posicionar la cámara en un lugar conveniente para ver el planeta y la esfera
scene.add(camera);

camera.fov = 75; // Cambia 45 por el valor de FOV deseado
camera.updateProjectionMatrix(); // Asegúrate de actualizar la matriz de proyección


// Agregar luces a la escena
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040); // Luz ambiental suave
scene.add(ambientLight);

const textureLoader = new THREE.TextureLoader();
const planetTexture = textureLoader.load('planeta.jpg')

// Crear la esfera del planeta en Three.js
const planetGeometry = new THREE.SphereGeometry(20, 32, 32); // esfera de radio 5
const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });

const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
scene.add(planetMesh);

// Configurar Cannon.js
const world = new CANNON.World();
world.gravity.set(0, 0, 0); // Sin gravedad global, ya que usaremos gravedad radial

// Crear cuerpo de Cannon.js para el planeta (solo como referencia, no necesita gravedad)
const planetBody = new CANNON.Body({
    mass: 0, // El planeta es estático, así que su masa es 0
    shape: new CANNON.Sphere(20) // Esfera de radio 5, como el planeta de Three.js
});
planetBody.position.set(0, 0, 0); // Ubicar en el centro de la escena
world.addBody(planetBody);

// Crear la esfera del jugador en Three.js
const playerGeometry = new THREE.SphereGeometry(0.5, 32, 32); // esfera de radio 0.5
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500 });
const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(playerMesh);

// Crear el cuerpo de Cannon.js para la esfera del jugador
const playerBody = new CANNON.Body({
    mass: 1, // Masa para la física
    shape: new CANNON.Sphere(0.5) // Radio de 0.5 como en Three.js
});
playerBody.position.set(0, 21, 0); // Colocar cerca del "planeta"
world.addBody(playerBody);

// Función para calcular la gravedad radial y aplicarla al cuerpo del jugador
function applyRadialGravity(body, targetPosition, gravityStrength) {
    const direction = new CANNON.Vec3().copy(targetPosition).vsub(body.position); // Dirección hacia el planeta
    const distance = direction.length(); // Usamos .length() para obtener la distancia actual al centro
    direction.normalize(); // Convertir en un vector unitario
    
    // Aplicar fuerza proporcional a la distancia (inversa al cuadrado)
    const force = direction.scale(gravityStrength / (distance * distance));
    body.applyForce(force);
}


// Variables para el control de movimiento
const playerVelocity = new CANNON.Vec3();
const speed = 0.1; // Velocidad de movimiento
const gravityStrength = 1000; // Intensidad de la gravedad radial

// Escuchar eventos de teclado
const keys = { w: false, a: false, s: false, d: false };
document.addEventListener("keydown", (event) => {
    keys[event.key] = true;
});
document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

// Aplicar controles WASD y gravedad en cada actualización
const maxDistance = 8; // Distancia máxima permitida desde el centro del planeta
const retentionStrength = 100; // Intensidad de la fuerza de retención

function update() {
    // Gravedad radial
    applyRadialGravity(playerBody, planetBody.position, gravityStrength);


    // Movimiento del jugador hacia adelante/atrás en la dirección de la cámara
    let moveZ = 0;
    if (keys.ArrowUp) moveZ = -playerSpeed;
    if (keys.ArrowDown) moveZ = playerSpeed;

    // Rotar el jugador y la cámara con las teclas izquierda/derecha
    if (keys.ArrowLeft) angleAroundPlayer += rotationSpeed;
    if (keys.ArrowRight) angleAroundPlayer -= rotationSpeed;

    // Calcular la dirección de movimiento en función del ángulo de rotación
    const direction = new THREE.Vector3(
        Math.sin(angleAroundPlayer),
        0,
        Math.cos(angleAroundPlayer)
    );

    // Mover el jugador en la dirección calculada
    playerMesh.position.add(direction.clone().multiplyScalar(moveZ));
    playerMesh.rotation.y = angleAroundPlayer; // Rotar el jugador en la misma dirección

    // Calcular la posición de la cámara detrás del jugador en función del ángulo
    const offsetX = Math.sin(angleAroundPlayer) * cameraDistance;
    const offsetZ = Math.cos(angleAroundPlayer) * cameraDistance;

    camera.position.set(
        playerMesh.position.x - offsetX,
        playerMesh.position.y + cameraHeight,
        playerMesh.position.z - offsetZ
    );

    // Asegurar que la cámara mire al jugador
    camera.lookAt(playerMesh.position);
    // Asegurar que la cámara siempre mire hacia el jugador
    camera.lookAt(playerMesh.position);

    // Lógica de movimiento con WASD (movimiento secundario del jugador)
    if (keys.w || keys.W) playerVelocity.z = -speed;
    if (keys.s || keys.S) playerVelocity.z = speed;
    if (keys.a || keys.A) playerVelocity.x = -speed;
    if (keys.d || keys.D) playerVelocity.x = speed;
    if (keys.f || keys.F) {
        playerBody.velocity.set(0, 0, 0);
        playerVelocity.set(0, 0, 0);
    }

    // Aplicar la velocidad de movimiento en Cannon.js
    playerBody.velocity.x += playerVelocity.x;
    playerBody.velocity.z += playerVelocity.z;
    playerVelocity.set(0, 0, 0); // Resetear la velocidad tras aplicarla

    // Aplicar fuerza de retención si el jugador se acerca al límite
    const distanceToPlanet = playerBody.position.distanceTo(planetBody.position);
    if (distanceToPlanet > maxDistance) {
        const directionToPlanet = planetBody.position.vsub(playerBody.position).unit();
        const retentionForce = directionToPlanet.scale(retentionStrength * (distanceToPlanet - maxDistance));
        playerBody.applyForce(retentionForce);
    }

    // Sincronizar la posición y rotación de Three.js con Cannon.js
    playerMesh.position.copy(playerBody.position);
    playerMesh.quaternion.copy(playerBody.quaternion);
}



// Animar la escena
function animate() {
    requestAnimationFrame(animate);
    world.step(1 / 60); // Simulación de física
    update(); // Actualizar controles y gravedad

    // Renderizar escena
    renderer.render(scene, camera);
}

animate();


