import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';


// Configura la escena, la cámara y el renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Crear el cubo en Three.js
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Crear la esfera central en Three.js
const sphereRadius = 15;  // Radio de la esfera que generará gravedad
const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
const gravitySphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(gravitySphere);

// Posicionar la cámara para ver el cubo
camera.position.z = 5;

// Crear el mundo de física en Cannon.js
const world = new CANNON.World();
world.gravity.set(0, 0, 0);  // Gravedad hacia abajo

// Crear un cuerpo físico para la esfera de gravedad (pero estático)
const sphereBody = new CANNON.Body({
    mass: 0,  // Masa cero para que sea estático
    position: new CANNON.Vec3(0, 0, 0),
    shape: new CANNON.Sphere(sphereRadius)
});
world.addBody(sphereBody);

// Crear un cuerpo físico para el cubo
const cubeBody = new CANNON.Body({
    mass: 1,  // Si es 0, el objeto será estático
    position: new CANNON.Vec3(0, 5, 0),  // Posición inicial
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))  // Dimensiones del cubo
});
world.addBody(cubeBody);

// Variables de rotación
let rotationAngle = 0;  // Ángulo en el eje X
const rotationSpeed = 0.05;  // Velocidad de rotación
const moveSpeed = 0.3; // Velocidad de movimiento del cubo

// Variables de movimiento
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

function onKeyDown(event) {
    switch (event.key) {
        case 'w':
        case 'W':
            moveForward = true;
            break;
        case 's':
        case 'S':
            moveBackward = true;
            break;
        case 'a':
        case 'A':
            moveLeft = true;
            break;
        case 'd':
        case 'D':
            moveRight = true;
            break;
        case "ArrowRight":
            rotationAngle -= rotationSpeed;  // Rotar a la derecha
            break;
        case "ArrowLeft":
            rotationAngle += rotationSpeed;  // Rotar a la izquierda
            break;
    }
}

function onKeyUp(event) {
    switch (event.key) {
        case 'w':
        case 'W':
            moveForward = false;
            break;
        case 's':
        case 'S':
            moveBackward = false;
            break;
        case 'a':
        case 'A':
            moveLeft = false;
            break;
        case 'd':
        case 'D':
            moveRight = false;
            break;
        case 'f':
        case 'F':
            cubeBody.velocity.set(0, 0, 0);      // Detener la velocidad
            cubeBody.angularVelocity.set(0, 0, 0); // Detener la rotación
            break;
    }
}

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);

const gravityStrength = 30;

function applyRadialGravity(body, targetPosition, gravityStrength) {
    const direction = new CANNON.Vec3().copy(targetPosition).vsub(body.position); // Dirección hacia el planeta
    const distance = direction.length(); // Usamos .length() para obtener la distancia actual al centro
    direction.normalize(); // Convertir en un vector unitario
    
    // Aplicar fuerza proporcional a la distancia (inversa al cuadrado)
    const force = direction.scale(gravityStrength / (distance * distance));
    body.applyForce(force);
}

const shotSpeed = 10;
const shots = [];
const shotLifetime = 3000;
const mouse = new THREE.Vector2();          // Almacena la posición del mouse
const raycaster = new THREE.Raycaster();    // Raycaster para calcular la dirección del disparo

// Actualizar la posición del mouse en el vector "mouse"
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove, false);

// Escuchar clic izquierdo para disparar
window.addEventListener('mousedown', (event) => {
    if (event.button === 0) {   // 0 es el botón izquierdo del mouse
        shootCube();
    }
});

function shootCube() {
    // Crear una geometría y material para el cubo
    const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00AAE4 });
    const shotMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);

    // Posicionar el cubo en la posición actual del jugador
    shotMesh.position.copy(cubeBody.position);

    // Agregar el cubo a la escena
    scene.add(shotMesh);

    // Crear un cuerpo físico para el cubo en Cannon.js
    const shotBody = new CANNON.Body({
        mass: 0.1,                
        shape: new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25))
    });

    // Posicionar el cuerpo del cubo en Cannon.js
    shotBody.position.copy(cubeBody.position);

    // Usar el raycaster para calcular la dirección del disparo
    raycaster.setFromCamera(mouse, camera);
    const shotDirection = raycaster.ray.direction.clone();  // Copiar la dirección del raycaster

    // Aplicar la velocidad en la dirección del disparo
    shotBody.velocity = new CANNON.Vec3(shotDirection.x, shotDirection.y, shotDirection.z).scale(shotSpeed);

    // Agregar el cubo al mundo de física
    world.addBody(shotBody);

    // Guardar el cubo y su cuerpo en un array para manejar su vida útil
    shots.push({ mesh: shotMesh, body: shotBody, timestamp: Date.now() });
}




function animate() {
    requestAnimationFrame(animate);

    // Actualiza el mundo de física
    world.step(1 / 60);
    applyRadialGravity(cubeBody, sphereBody.position, gravityStrength);
    // Movimiento en función del ángulo de rotación
    const force = new CANNON.Vec3();

    if (moveForward) {
        force.x -= Math.sin(rotationAngle) * moveSpeed; // Avanza en la dirección de la cámara
        force.z -= Math.cos(rotationAngle) * moveSpeed;
    }
    if (moveBackward) {
        force.x += Math.sin(rotationAngle) * moveSpeed; // Retrocede en la dirección de la cámara
        force.z += Math.cos(rotationAngle) * moveSpeed;
    }
    if (moveLeft) {
        force.x -= Math.cos(rotationAngle) * moveSpeed; // Movimiento lateral izquierdo
        force.z += Math.sin(rotationAngle) * moveSpeed;
    }
    if (moveRight) {
        force.x += Math.cos(rotationAngle) * moveSpeed; // Movimiento lateral derecho
        force.z -= Math.sin(rotationAngle) * moveSpeed;
    }

    // Aplicar la fuerza calculada al cubo
    cubeBody.velocity.x += force.x;
    cubeBody.velocity.z += force.z;

    const maxDistance = 16; // Distancia máxima permitida desde el centro del planeta
    const retentionStrength = 500; // Intensidad de la fuerza de retención

    // Aplicar fuerza de retención si el jugador se acerca al límite
    const distanceToPlanet = cubeBody.position.distanceTo(sphereBody.position);
    if (distanceToPlanet > maxDistance) {
        const directionToPlanet = sphereBody.position.vsub(cubeBody.position).unit();
        const retentionForce = directionToPlanet.scale(retentionStrength * (distanceToPlanet - maxDistance));
        cubeBody.applyForce(retentionForce);
    }
    // Sincronizar el cubo de Three.js con Cannon.js
    cube.position.copy(cubeBody.position);
    cube.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotationAngle);  // Rota el cubo junto con la cámara

        // Actualizar los disparos
    for (let i = shots.length - 1; i >= 0; i--) {
        const shot = shots[i];

        // Sincronizar la posición del cubo de Three.js con el cuerpo de Cannon.js
        shot.mesh.position.copy(shot.body.position);

        // Eliminar el cubo si ha superado su tiempo de vida
        if (Date.now() - shot.timestamp > shotLifetime) {
            scene.remove(shot.mesh);            // Eliminar de Three.js
            world.removeBody(shot.body);        // Eliminar de Cannon.js
            shots.splice(i, 1);                 // Eliminar del array de disparos
        }
    }
    // Colocar la cámara en una posición relativa al cubo y rotarla
    const radius = 5;
    camera.position.x = cube.position.x + radius * Math.sin(rotationAngle);
    camera.position.y = cube.position.y + 2;
    camera.position.z = cube.position.z + radius * Math.cos(rotationAngle);

    // Hacer que la cámara mire hacia el cubo
    camera.lookAt(cube.position);

    // Renderizar la escena
    renderer.render(scene, camera);
}

animate();



