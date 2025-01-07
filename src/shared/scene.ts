import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,

    Mesh,

    PlaneGeometry,
    BoxGeometry,

    MeshBasicMaterial,

    DoubleSide,
    Vector3
} from "three";

class CubeMoverScene {

    private scene: Scene;
    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private cube: Mesh;
    private cleanups: (() => void)[] = [];
    private destroyed: boolean = false;

    // Target positions for each method
    private targetLeft: Vector3 = new Vector3(-2, 2, 0);
    private targetRight: Vector3 = new Vector3(2, 2, 0);
    private targetForward: Vector3 = new Vector3(0, 2, 2);
    private targetOrigin: Vector3 = new Vector3(0, 2, 0);

    private target: {pos: Vector3, speed: number}|null = null;



    constructor(private parentNode: HTMLElement) {
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(90, parentNode.clientWidth / parentNode.clientHeight, 0.1, 1000);
        this.renderer = new WebGLRenderer();

        // Add a horizontal plane
        const planeGeometry = new PlaneGeometry(40, 40);
        const planeMaterial = new MeshBasicMaterial({color: 0x888888, side: DoubleSide});
        const plane = new Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = Math.PI / 2;
        plane.position.x = 0;
        plane.position.y = 0;
        plane.position.z = 0;
        this.scene.add(plane);

        // Add a cube to the scene
        const cubeGeometry = new BoxGeometry(1, 1, 1);
        const cubeMaterial = new  MeshBasicMaterial({color: 0xff0000});
        this.cube = new Mesh(cubeGeometry, cubeMaterial);
        this.cube.position.x = this.targetOrigin.x;
        this.cube.position.y = this.targetOrigin.y;
        this.cube.position.z = this.targetOrigin.z;
        this.scene.add(this.cube);

        // Set up the camera

        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(this.targetOrigin);
        this.camera.updateProjectionMatrix();

        // Set up the renderer
        this.renderer.setSize(parentNode.clientWidth, parentNode.clientHeight);
        this.parentNode.appendChild(this.renderer.domElement);

        // Set up listeners for resizing the window
        const onResize = () => {
            this.camera.aspect = parentNode.clientWidth / parentNode.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(parentNode.clientWidth, parentNode.clientHeight);
        };

        window.addEventListener('resize', onResize);

        this.cleanups.push(() => window.removeEventListener('resize', onResize));
    }

    public destroy(): void {
        this.cleanups.forEach(fn => fn());
        this.destroyed = true;
        while (this.parentNode.firstChild) {
            this.parentNode.removeChild(this.parentNode.firstChild);
        }
        this.renderer.dispose();
    }

    public left(): void {
        this.target = {pos: this.targetLeft, speed: 2};
        // this.targets.push({pos: this.targetLeft, step: 0.0000005});
        // this.moveToTarget({pos: this.targetLeft, step: 0.1});
    }


    public right(): void {
        this.target = {pos: this.targetRight, speed: 2};
    }


    public forward(): void {
        this.target = {pos: this.targetForward, speed: 2};
    }


    private moveToTarget(target: {pos: Vector3, step: number}): void {
        const direction = new Vector3().subVectors(target.pos, this.cube.position).normalize();
        this.cube.position.addScaledVector(direction, target.step);
    }

    public animate(): void {
        if (this.destroyed)
            return;


        // do  {
        //     const target = this.targets[0];
        //     if (!target)
        //         break;

        //     const d = this.cube.position.distanceTo(target.pos);

        //     if (Math.abs(d) < target.step) {
        //         this.targets.shift();
        //         continue;
        //     }
        //     this.moveToTarget(target);
        // } while(true);


        requestAnimationFrame(timestamp => {
            this.updateCubePosition(timestamp);
            this.animate();
            this.renderer.render(this.scene, this.camera);
        });

    }

    private updateCubePositionTimestamp: number = 0;
    private updateCubePosition(timestamp: number): void {
        if (!this.target){
            this.updateCubePositionTimestamp = timestamp;
            return;
        }
        console.log(`timestamp: ${timestamp}`);

        const dt = (timestamp - this.updateCubePositionTimestamp);
        if (dt < 1000 / 60) {
            return;
        }
        this.updateCubePositionTimestamp = timestamp;

        const d = this.cube.position.distanceTo(this.target.pos)
        if (d < 0.001) {
            this.target = null;
            return;
        }
        const t = 1000 * d / this.target.speed;
        const alpha = Math.min(1,  t === 0 ? 1 : dt / t);
        console.log(`dt: ${dt}, d:${d}, t:${t}, alpha:${alpha}`);
        this.cube.position.lerp(this.target.pos, alpha);

        // dtSec * this.target.speed;

    }
}

export {
    CubeMoverScene
}