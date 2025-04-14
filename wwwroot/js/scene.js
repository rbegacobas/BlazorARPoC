import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, AmbientLight, Color } from './three.module.min.js';

console.log("scene.js loaded successfully");

let scene, camera, renderer, cube, animateLoop;

export function initScene(canvasId) {
    console.log("initScene called with canvasId:", canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Canvas not found with ID:", canvasId);
        return;
    }

    scene = new Scene();
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new WebGLRenderer({ canvas: canvas, antialias: true });

    // Ajustar el tamaño inicial del renderer
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Ajustar el tamaño del renderer al redimensionar la ventana
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    // Añadir un fondo de color a la escena
    scene.background = new Color(0x87ceeb); // Azul cielo

    // Añadir una luz ambiental para iluminar el cubo
    const ambientLight = new AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Crear un cubo
    const geometry = new BoxGeometry(0.2, 0.2, 0.2);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    cube = new Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 1;

    // Animación para la vista normal
    animateLoop = function animate() {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    };
    animateLoop();
}

// Función para entrar en modo AR
export async function enterAR() {
    if (!navigator.xr) {
        alert('WebXR no está soportado en este dispositivo o navegador.');
        return false;
    }

    try {
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['bounded-floor', 'hand-tracking']
        });

        renderer.xr.enabled = true;
        await renderer.xr.setSession(session);

        renderer.setAnimationLoop((timestamp, frame) => {
            if (frame) {
                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;
                renderer.render(scene, camera);
            }
        });

        cube.position.set(0, 0, -1);

        session.addEventListener('end', () => {
            renderer.xr.enabled = false;
            renderer.setAnimationLoop(null);
            animateLoop();
        });

        // Exponer la función para salir de AR
        window.exitAR = () => {
            session.end();
        };

        return true;
    } catch (error) {
        console.error('Error al iniciar WebXR:', error);
        alert('No se pudo iniciar la sesión AR. Asegúrate de que tu dispositivo soporta AR y estás usando HTTPS o localhost.');
        return false;
    }
}

window.initScene = initScene;
window.enterAR = enterAR;