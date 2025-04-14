import { Scene, PerspectiveCamera, WebGLRenderer, BoxGeometry, MeshBasicMaterial, Mesh, AmbientLight, Color } from './three.module.min.js';

console.log("scene.js loaded successfully");

export function initScene(canvasId) {
    console.log("initScene called with canvasId:", canvasId);
    const canvas = document.getElementById(canvasId);
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new WebGLRenderer({ canvas: canvas, antialias: true });

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
    const ambientLight = new AmbientLight(0xffffff, 0.8); // Luz blanca, intensidad 0.8
    scene.add(ambientLight);

    // Crear un cubo
    const geometry = new BoxGeometry(0.2, 0.2, 0.2);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 1;

    // Animación para la vista normal
    function animate() {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();

    // Estilo común para los botones
    const buttonStyle = {
        position: 'absolute',
        padding: '10px 20px',
        fontSize: '16px',
        color: 'white',
        backgroundColor: '#007bff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        zIndex: '1000'
    };

    // Crear el botón "Enter AR"
    const arButton = document.createElement('button');
    arButton.textContent = 'Enter AR';
    Object.assign(arButton.style, buttonStyle);
    arButton.style.top = '20px';
    arButton.style.left = '20px';
    document.body.appendChild(arButton);

    // Crear el botón "Exit AR" (oculto por defecto)
    const exitButton = document.createElement('button');
    exitButton.textContent = 'Exit AR';
    Object.assign(exitButton.style, buttonStyle);
    exitButton.style.top = '20px';
    exitButton.style.right = '20px';
    exitButton.style.backgroundColor = '#dc3545';
    exitButton.style.display = 'none';
    document.body.appendChild(exitButton);

    // Configurar WebXR
    arButton.addEventListener('click', async () => {
        if (!navigator.xr) {
            alert('WebXR no está soportado en este dispositivo o navegador.');
            return;
        }

        try {
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['bounded-floor', 'hand-tracking']
            });

            exitButton.style.display = 'block';
            arButton.style.display = 'none';

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
                exitButton.style.display = 'none';
                arButton.style.display = 'block';
                animate();
            });

            exitButton.addEventListener('click', () => {
                session.end();
            });

        } catch (error) {
            console.error('Error al iniciar WebXR:', error);
            alert('No se pudo iniciar la sesión AR. Asegúrate de que tu dispositivo soporta AR y estás usando HTTPS o localhost.');
        }
    });
}

window.initScene = initScene;