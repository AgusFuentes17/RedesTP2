import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { World, Body, Box, Plane, Vec3, Sphere } from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

// Inicializa la escena de Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const planetTexture = textureLoader.load('planeta.jpg'); // Cambia esto a la ruta de tu textura


// Crear la esfera (planeta)
const planetGeometry = new THREE.SphereGeometry(5, 32, 32);
const planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
scene.add(planet);

// Crear el cubo (jugador)
const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// Posicionar la cámara
camera.position.set(5, 20, 7);
camera.lookAt(player.position);

// Configurar Cannon.js
const world = new World();
world.gravity.set(0, -9.82, 0); // Gravedad

// Crear el cuerpo del planeta
const planetShape = new Sphere(5);
const planetBody = new Body({ mass: 0 }); // Masa 0 para que sea estático
planetBody.addShape(planetShape);
world.addBody(planetBody);

// Crear el cuerpo del jugador
const playerShape = new Box(new Vec3(0.25, 0.25, 0.25));
const playerBody = new Body({ mass: 1 });
playerBody.position.set(0, 5, 0); // Posición inicial
playerBody.addShape(playerShape);
world.addBody(playerBody);

// Controlar la cámara para que siga al cubo
function updateCameraPosition() {
	let mouseX = 0;
	let mouseY = 0;
	const sensitivity = 0.1; // Ajusta la sensibilidad del movimiento
	
	// Controlar el movimiento del mouse
	document.addEventListener('mousemove', (event) => {
		// Calcula el desplazamiento del mouse
		mouseX = (event.clientX / window.innerWidth) * 2 - 1;
		mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
	
		// Ajusta la posición de la cámara según el movimiento del mouse
		camera.position.x = player.position.x + Math.sin(mouseX * Math.PI) * 10; // Distancia ajustada
		camera.position.y = player.position.y + 5 + mouseY * 5; // Altura ajustada
		camera.position.z = player.position.z + Math.cos(mouseX * Math.PI) * 10; // Distancia ajustada
	
		camera.lookAt(player.position); // Asegura que la cámara mire al jugador
	});
}

 // Controlar el movimiento del cubo con WASD
 const moveSpeed = 5; // Velocidad de movimiento

 document.addEventListener('keydown', (event) => {
	 switch (event.key) {
		 case 'w':
			playerBody.velocity.z = -moveSpeed;
			 break;
		 case 's':
			playerBody.velocity.z = moveSpeed;
			 break;
		 case 'a':
			playerBody.velocity.x = -moveSpeed;
			 break;
		 case 'd':
			playerBody.velocity.x = moveSpeed;
			 break;
	 }
 });


 function updatePlayerPosition() {
    const radius = 5; // Radio del planeta
    const positionVec = playerBody.position; // Posición actual

    // Calcular la distancia desde el origen
    const distance = Math.sqrt(positionVec.x ** 2 + positionVec.y ** 2 + positionVec.z ** 2);

    // Asegúrate de que el cubo esté en la superficie del planeta
    if (distance > radius) {
        // Si está fuera del planeta, normaliza y ajusta la posición
        const direction = new Vec3(positionVec.x, positionVec.y, positionVec.z);
        const factor = radius / distance; // Calcular el factor para ajustar la posición

        // Ajustar la posición del jugador
        playerBody.position.x *= factor;
        playerBody.position.y *= factor;
        playerBody.position.z *= factor;
    } else {
        // Mantener la posición del jugador en la superficie
        playerBody.position.x = (positionVec.x / distance) * radius;
        playerBody.position.y = (positionVec.y / distance) * radius;
        playerBody.position.z = (positionVec.z / distance) * radius;
    }

    // Asegúrate de que el cubo pueda salir de situaciones atrapadas
    if (distance < radius - 0.5) {
        // Si el cubo está muy cerca del centro, empújalo hacia afuera
        const direction = new Vec3(positionVec.x, positionVec.y, positionVec.z).normalize();
        playerBody.position.x = direction.x * radius;
        playerBody.position.y = direction.y * radius;
        playerBody.position.z = direction.z * radius;
    }
}



// Animación y actualización de la física
function animate() {
    requestAnimationFrame(animate);
    world.step(1/60);
    
	updateCameraPosition()
	updatePlayerPosition()
    // Actualiza la posición del cubo
    player.position.copy(playerBody.position);
    
    renderer.render(scene, camera);
}

animate();