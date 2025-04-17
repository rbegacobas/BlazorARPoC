console.log("scene.js loaded successfully");
console.log("THREE disponible:", typeof THREE !== "undefined");
console.log("GLTFLoader disponible:", typeof THREE !== "undefined" && typeof THREE.GLTFLoader !== "undefined");

let scene, camera, renderer, currentModel, animateLoop;

function initScene(canvasId, productId = null) {
    console.log("initScene called with canvasId:", canvasId, "productId:", productId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Canvas not found with ID:", canvasId);
        return;
    }

    // Limpiar la escena anterior si existe
    if (scene) {
        if (currentModel) {
            scene.remove(currentModel);
            currentModel = null;
        }

        // Detener la animación actual
        if (animateLoop) {
            cancelAnimationFrame(animateLoop);
            animateLoop = null;
        }
    } else {
        // Primera inicialización de la escena
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

        // Ajustar el tamaño inicial del renderer
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);

        // Ajustar el tamaño del renderer al redimensionar la ventana
        window.addEventListener('resize', () => {
            if (canvas) {
                const width = canvas.clientWidth;
                const height = canvas.clientHeight;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                console.log("Canvas resized to:", width, "x", height);
            }
        });
    }

    // Añadir un fondo de color a la escena
    scene.background = new THREE.Color(0xf5f5f5); // Gris claro

    // Añadir luces a la escena
    scene.clear();

    // Luz ambiental
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Luz direccional
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Ajustar la cámara
    camera.position.set(0, 0.5, 2); // Aumentar la distancia para asegurar que el modelo sea visible
    camera.lookAt(0, 0, 0);

    if (productId) {
        // Cargar modelo 3D basado en el productId
        loadModel(productId);
    } else {
        // Mostrar un cubo por defecto si no hay productId
        showDefaultCube();
    }
}

function showDefaultCube() {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Aumentar el tamaño del cubo
    const material = new THREE.MeshStandardMaterial({
        color: 0x00ff00,
        roughness: 0.7,
        metalness: 0.3
    });
    currentModel = new THREE.Mesh(geometry, material);
    currentModel.position.set(0, 0, 0);
    scene.add(currentModel);

    console.log("Default cube added to scene at position:", currentModel.position);

    // Animación para la vista normal
    animateLoop = function animate() {
        if (currentModel) {
            currentModel.rotation.x += 0.01;
            currentModel.rotation.y += 0.01;
        }
        renderer.render(scene, camera);
        animateLoop = requestAnimationFrame(animate);
    };
    animateLoop();
}

function loadModel(productId) {
    console.log("Loading model for product:", productId);

    // Crear un cargador de GLTF
    const modelLoader = new THREE.GLTFLoader();

    // Mostrar un objeto temporal mientras se carga el modelo
    const geometry = new THREE.SphereGeometry(0.1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const loadingIndicator = new THREE.Mesh(geometry, material);
    scene.add(loadingIndicator);

    // Definir ajustes específicos para cada modelo
    const modelSettings = {
        'chair': { scale: 1.0, position: { x: 0, y: 0, z: 0 } }, // Aumentar la escala para prueba
        'vase': { scale: 1.0, position: { x: 0, y: 0, z: 0 } },
        'plant': { scale: 1.0, position: { x: 0, y: 0, z: 0 } },
        'desk': { scale: 1.0, position: { x: 0, y: -0.1, z: 0 } }
    };

    const settings = modelSettings[productId] || { scale: 1.0, position: { x: 0, y: 0, z: 0 } };
    const modelUrl = `models/${productId}.glb`;

    modelLoader.load(
        modelUrl,
        (gltf) => {
            scene.remove(loadingIndicator);

            currentModel = gltf.scene;

            // Aplicar configuraciones específicas para este modelo
            currentModel.scale.set(settings.scale, settings.scale, settings.scale);
            currentModel.position.set(
                settings.position.x,
                settings.position.y,
                settings.position.z
            );

            // Ajustar la cámara según el modelo
            const box = new THREE.Box3().setFromObject(currentModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            console.log("Model bounding box size:", size);
            console.log("Model center:", center);

            // Asegurarse de que la cámara pueda ver el modelo
            camera.position.z = Math.max(size.x, size.y, size.z) * 2; // Ajustar la distancia de la cámara
            camera.lookAt(center);

            // Añadir el modelo a la escena
            scene.add(currentModel);

            console.log("Model added to scene at position:", currentModel.position);

            // Iniciar animación
            animateLoop = function animate() {
                if (currentModel) {
                    currentModel.rotation.y += 0.01;
                }
                renderer.render(scene, camera);
                animateLoop = requestAnimationFrame(animate);
            };
            animateLoop();

            console.log("Model loaded successfully:", productId);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading model:', error);
            scene.remove(loadingIndicator);
            showDefaultCube(); // Mostrar un cubo por defecto si hay un error
        }
    );
}

// Función para entrar en modo AR
async function enterAR() {
    console.log("enterAR called");
    if (!navigator.xr) {
        console.log('WebXR no está soportado en este dispositivo o navegador.');
        alert('WebXR no está soportado en este dispositivo o navegador.');
        return false;
    }

    try {
        console.log('Requesting WebXR session...');
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['bounded-floor', 'hand-tracking']
        });

        renderer.xr.enabled = true;
        await renderer.xr.setSession(session);

        // Ajustar la posición del modelo en AR
        if (currentModel) {
            currentModel.position.set(0, 0, -1);
            console.log("Model repositioned for AR at:", currentModel.position);
        }

        renderer.setAnimationLoop((timestamp, frame) => {
            if (frame && currentModel) {
                currentModel.rotation.y += 0.01;
                renderer.render(scene, camera);
            }
        });

        session.addEventListener('end', () => {
            renderer.xr.enabled = false;
            renderer.setAnimationLoop(null);

            // Restaurar la animación normal
            if (animateLoop) {
                animateLoop();
            }
            console.log("AR session ended");
        });

        // Exponer la función para salir de AR
        window.exitAR = () => {
            session.end();
        };

        console.log("AR session started successfully");
        return true;
    } catch (error) {
        console.error('Error al iniciar WebXR:', error);
        alert('No se pudo iniciar la sesión AR. Asegúrate de que tu dispositivo soporta AR y estás usando HTTPS o localhost.');
        return false;
    }
}

// Exponer funciones a la ventana global para que Blazor pueda acceder a ellas
window.initScene = initScene;
window.enterAR = enterAR;
window.exitAR = function() {
    if (renderer && renderer.xr && renderer.xr.getSession()) {
        renderer.xr.getSession().end();
    }
};
