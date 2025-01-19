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
    GridHelper
} from "three";

// Easing function for smooth movement
function easeOutQuad(t: number): number {
    return t * (2 - t);
}

interface Transform {
    timestampStarted: number;
    source: Vector3;
    target: Vector3;
    onUpdate?: |((transform: Transform) => void) | null,
    duration: number;
    done: boolean;
    update?: (v: Vector3) => void;
}

const CUBE_SIZE = 2;
const MOVE_OFFSET = 8;
const MOVE_SPEED = 2; // 2 units a sec

class CubeMoverScene {
    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private cube: Mesh;
    private destroyed: boolean = false;
    private cubeSize: number = CUBE_SIZE;

    // Target positions for each method
    private targetLeft: Vector3 = new Vector3(-MOVE_OFFSET, 2 * CUBE_SIZE, 0);
    private targetRight: Vector3 = new Vector3(MOVE_OFFSET, 2 * CUBE_SIZE, 0);
    private targetForward: Vector3 = new Vector3(0, 2 * CUBE_SIZE, MOVE_OFFSET);
    private targetBack: Vector3 = new Vector3(0, 2 * CUBE_SIZE, -MOVE_OFFSET);

    private targetOrigin: Vector3 = new Vector3(0, CUBE_SIZE * 2, 0);

    private cameraRotation: Vector3 = new Vector3(0, 0, 0);
    private transforms: Transform[] = [];
    private onResize: (() => void) | null = null;

    constructor(private parentNode: HTMLElement, private options?: {
        parallelTransforms?: boolean,
    }) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(90, parentNode.clientWidth / parentNode.clientHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer({ antialias: true });

        // Add a horizontal plane
        const planeGeometry = new PlaneGeometry(1000, 1000);
        const planeMaterial = new MeshBasicMaterial({ color: 0x888888, side: DoubleSide });
        const plane = new Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = Math.PI / 2;
        this.scene.add(plane);
        const grid = new GridHelper(1000, 100, 0x666666, 0x666666);
        grid.position.y = 0.1
        this.scene.add(grid);

        // Add a cube to the scene
        const cubeGeometry = new BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        const cubeMaterial = new MeshLambertMaterial({ color: 0xff0000 });
        this.cube = new Mesh(cubeGeometry, cubeMaterial);
        this.cube.position.copy(this.targetOrigin);
        this.scene.add(this.cube);

        const lightValues = [
            { colour: 0x14D14A, intensity: 10, dist: 100, x: 0, y: 5, z: 10 },
            { colour: 0xBE61CF, intensity: 10, dist: 100, x: 0, y: 5, z: -10 },
            { colour: 0x00FFFF, intensity: 10, dist: 100, x: 10, y: 10, z: 0 },
            { colour: 0x00FF00, intensity: 10, dist: 100, x: -10, y: 10, z: 0 },
        ];

        const lights = lightValues.map(l => {
            const r = new PointLight(l.colour, l.intensity * 1000, l.dist);
            r.position.set(l.x, l.y, l.z);
            return r;
        });

        lights.forEach(l => this.scene.add(l));

        // Set up the camera
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);
        this.camera.updateProjectionMatrix();

        this.cameraRotation.copy(this.camera.rotation);

        // Set up the renderer
        this.renderer.setSize(parentNode.clientWidth, parentNode.clientHeight);
        parentNode.appendChild(this.renderer.domElement);

        // Set up listeners for resizing the window
        this.onResize = () => {
            this.resizeCamera();
            this.resizeRenderer();
        };

        window.addEventListener('resize', this.onResize);
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
    private temp: number = 0;
    private calcTargetAndDuration(t: Transform, factor: number) {
        this.temp = new Date().getTime();
        t.target.lerpVectors(this.cube.position, t.target, factor);
        t.duration =  1000 * t.target.distanceTo(this.cube.position) / 2;
        t.onUpdate = null;
    }

    public left(factor: number = 1): void {
        this.queueTransform({
            source: this.cube.position,
            target: this.targetLeft.clone(),
            onUpdate: t => this.calcTargetAndDuration(t, factor),  duration: 2000
        });
    }

    public right(factor: number = 1): void {
        const target = this.targetRight.clone();
        this.queueTransform({
            source: this.cube.position,
            target,
            duration: 2000,
            onUpdate: t => this.calcTargetAndDuration(t, factor)
        });
    }

    public forward(factor: number): void {
        const target = this.targetForward.clone();
        this.queueTransform({ source: this.cube.position, target, duration: 2000,  onUpdate: t => this.calcTargetAndDuration(t, factor) });
    }

    public back(factor: number): void {
        const target = this.targetBack.clone();
        this.queueTransform({ source: this.cube.position, target, duration: 2000,  onUpdate: t => this.calcTargetAndDuration(t, factor) });
    }

    private queueTransform(transform: Omit<Transform, "timestampStarted"|"done">): void {
        this.transforms.push({
            ...transform,
            done: false,
            timestampStarted: 0,
        });
    }

    private resizeCamera(): void {
        this.camera.aspect = this.parentNode.clientWidth / this.parentNode.clientHeight;
        this.camera.updateProjectionMatrix();
    }

    private resizeRenderer(): void {
        this.renderer.setSize(this.parentNode.clientWidth, this.parentNode.clientHeight);
    }

    private animate(timestamp: number): void {
        if (this.destroyed) return;

        requestAnimationFrame(t => this.animate(t));

        for (let i = 0; i < this.transforms.length; i++) {
            const transform = this.transforms[i];
            if (transform.done) {
                this.transforms.splice(i, 1);
                i--;
                continue;
            }
            this.progressTransform(transform, timestamp)

            if (transform.done) {
                this.transforms.splice(i, 1);
                i--;
            }

            if (!this.options?.parallelTransforms) {
                break;
            }

        }

        this.renderer.render(this.scene, this.camera);
    }

    private progressTransform(transform: Transform, timestamp: number) {
        transform.timestampStarted = transform.timestampStarted || timestamp;

        const elapsedTime = timestamp - transform.timestampStarted;

        if (transform.onUpdate) {
            transform.onUpdate(transform)
        }
        const d = transform.source.distanceToSquared(transform.target);
        if (elapsedTime < transform.duration &&  d > 0.0001 ) {
            const alpha = easeOutQuad(elapsedTime / transform.duration);
            transform.source.lerpVectors(transform.source, transform.target, alpha);
            if (transform.update)
                transform.update(transform.source);
        } else {
            transform.source.copy(transform.target);
            if (transform.update)
                transform.update(transform.source);
            transform.done = true;
        }
    }

    public startAnimation(): void {
        requestAnimationFrame((timestamp) => this.animate(timestamp));
    }
}

export { CubeMoverScene };