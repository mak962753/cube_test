import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    PlaneGeometry,
    BoxGeometry,
    MeshBasicMaterial,
    MeshLambertMaterial,
    DoubleSide,
    Vector3,
    PointLight,
    Euler,
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
    private targetBack: Vector3 = new Vector3(0, 2, -4);
    private targetOrigin: Vector3 = new Vector3(0, 2, 0);

    private cameraRotation: Vector3 = new Vector3(0,0,0);

    private transforms: { timestamp: number, source: Vector3, target: Vector3|Euler, duration: number, done: boolean, update?: (v: Vector3) => void  }[] = [];
    private onResize: (() => void) | null = null;

    constructor(private parentNode: HTMLElement) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(90, parentNode.clientWidth / parentNode.clientHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer({antialias: true});

        // Add a horizontal plane
        const planeGeometry = new PlaneGeometry(40, 40);
        const planeMaterial = new MeshBasicMaterial({ color: 0x888888, side: DoubleSide });
        const plane = new Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = Math.PI / 2;
        this.scene.add(plane);

        // Add a cube to the scene
        const cubeGeometry = new BoxGeometry(1, 1, 1);
        const cubeMaterial = new MeshLambertMaterial({ color: 0xff0000 });
        this.cube = new Mesh(cubeGeometry, cubeMaterial);
        this.cube.position.copy(this.targetOrigin);
        this.scene.add(this.cube);

        const lightValues = [
            {colour: 0x14D14A, intensity: 10, dist: 100, x: 0, y: 5, z: 10},
            {colour: 0xBE61CF, intensity: 10, dist: 100, x: 0, y: 5, z: -10},
            {colour: 0x00FFFF, intensity: 10, dist: 100, x: 10, y: 10, z: 0},
            {colour: 0x00FF00, intensity: 10, dist: 100, x: -10, y: 10, z: 0},
        ];

        const lights = lightValues.map(l => {
            const r = new PointLight(l.colour, l.intensity * 1000, l.dist);
            r.position.set(l.x, l.y, l.z);
            return r;
        });

        lights.forEach(l => this.scene.add(l));

        // Set up the camera
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0,0,0);
        this.camera.updateProjectionMatrix();

        this.cameraRotation.copy(this.camera.rotation);

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
        this.transforms = [{
            source: this.cube.position,
            target: this.targetLeft,
            duration: 2000,
            done: false,
            timestamp: 0,
            update: v => this.camera.lookAt(v)
        }];
    }

    public right(): void {
        this.transforms = [{
            source: this.cube.position,
            target: this.targetRight,
            duration: 2000,
            done: false,
            timestamp: 0,
            update: v => this.camera.lookAt(v)
        }];
    }

    public forward(): void {
        this.transforms = [{
            source: this.cube.position,
            target: this.targetForward,
            duration: 2000,
            done: false,
            timestamp: 0,
            update: v => this.camera.lookAt(v)
        }];
    }
    public back(): void {
        this.transforms = [{
            source: this.cube.position,
            target: this.targetBack,
            duration: 2000,
            done: false,
            timestamp: 0,
            update: v => this.camera.lookAt(v)
        }];
    }

    private animate(timestamp: number): void {
        if (this.destroyed) return;

        requestAnimationFrame(t => this.animate(t));

        if (this.transforms.length) {
            for (let t of this.transforms) {
                if (t.done) {
                    continue;
                }
                t.timestamp = t.timestamp  || timestamp;
                const elapsedTime = timestamp - t.timestamp;
                if (elapsedTime < t.duration) {
                    const alpha = easeOutQuad(elapsedTime / t.duration);

                    t.source.lerpVectors(t.source, t.target, alpha);
                    if (t.update)
                        t.update(t.source);
                } else {
                    t.source.copy(t.target);
                    if (t.update)
                        t.update(t.source);
                    t.done = true;
                }
            }

        }

        this.renderer.render(this.scene, this.camera);
    }

    public startAnimation(): void {
        requestAnimationFrame((timestamp) => this.animate(timestamp));
    }
}

export { CubeMoverScene };