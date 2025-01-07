import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    PlaneGeometry,
    BoxGeometry,
    MeshBasicMaterial,
    DoubleSide,
    Vector3,

} from "three";

// Easing function for smooth movement
function easeOutQuad(t: number): number {
    return t * (2 - t);
}

class CubeMoverScene {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private cube: Mesh;
    private destroyed: boolean = false;

    // Target positions for each method
    private targetLeft: Vector3 = new Vector3(-4, 2, 0);
    private targetRight: Vector3 = new Vector3(4, 2, 0);
    private targetForward: Vector3 = new Vector3(0, 2, 4);
    private targetOrigin: Vector3 = new Vector3(0, 2, 0);

    private target: { position: Vector3, duration: number } | null = null;
    private onResize: (() => void) | null = null;
    private timestamp: number = 0;

    constructor(private parentNode: HTMLElement) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(90, parentNode.clientWidth / parentNode.clientHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer();

        // Add a horizontal plane
        const planeGeometry = new PlaneGeometry(40, 40);
        const planeMaterial = new MeshBasicMaterial({ color: 0x888888, side: DoubleSide });
        const plane = new Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = Math.PI / 2;
        this.scene.add(plane);

        // Add a cube to the scene
        const cubeGeometry = new BoxGeometry(1, 1, 1);
        const cubeMaterial = new MeshBasicMaterial({ color: 0xff0000 });
        this.cube = new Mesh(cubeGeometry, cubeMaterial);
        this.cube.position.copy(this.targetOrigin);
        this.scene.add(this.cube);

        // Set up the camera
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(this.targetOrigin);
        this.camera.updateProjectionMatrix();

        // Set up the renderer
        this.renderer.setSize(parentNode.clientWidth, parentNode.clientHeight);
        parentNode.appendChild(this.renderer.domElement);

        // Set up listeners for resizing the window
        this.onResize = () => {
            this.camera.aspect = parentNode.clientWidth / parentNode.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(parentNode.clientWidth, parentNode.clientHeight);
        };

        window.addEventListener('resize', this.onResize);
        this.destroyed = false;
    }

    public destroy(): void {
        if (this.destroyed) return;

        // Remove event listeners
        this.onResize && window.removeEventListener('resize', this.onResize);

        // Clear the parent element
        while (this.parentNode.firstChild) {
            this.parentNode.removeChild(this.parentNode.firstChild);
        }

        // Dispose of resources
        this.renderer.dispose();
    }

    public left(): void {
        this.timestamp = 0;
        this.target = { position: this.targetLeft, duration: 2000 };
    }

    public right(): void {
        this.timestamp = 0;
        this.target = { position: this.targetRight, duration: 1000 };
    }

    public forward(): void {
        this.timestamp = 0;
        this.target = { position: this.targetForward, duration: 1000 };
    }

    private animate(timestamp: number): void {
        if (this.destroyed) return;

        requestAnimationFrame(t => this.animate(t));

        if (this.target) {
            this.timestamp = this.timestamp || timestamp;
            const elapsedTime = timestamp - this.timestamp;
            if (elapsedTime < this.target.duration) {
                const alpha = easeOutQuad(elapsedTime / this.target.duration);
                this.cube.position.lerpVectors(this.cube.position, this.target.position, alpha);
            } else {
                this.cube.position.copy(this.target.position);
                this.target = null;
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    public startAnimation(): void {
        requestAnimationFrame((timestamp) => this.animate(timestamp));
    }
}

export { CubeMoverScene };