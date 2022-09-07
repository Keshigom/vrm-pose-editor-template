import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export type VisibleOptions = {};
/**
 * エディタ内の3DCG環境を提供するclass
 *
 * sceneやcameraを保持する
 */
export class Viewer {
  public readonly canvas: HTMLCanvasElement;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly orbitControls: OrbitControls;
  public readonly clock: THREE.Clock;

  constructor(parentElement: HTMLElement) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    );
    this.renderer.setClearColor(0x323232, 1.0);
    parentElement.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;

    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.3, 3);
    this.camera.rotation.set(0, Math.PI, 0);

    // Camera controller
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.target.y = 1.0;
    this.orbitControls.update();

    // light
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(-1, -1, -1).normalize();
    this.scene.add(light);

    // grid - axis
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);

    this.clock = new THREE.Clock();
    this.clock.start();
  }

  public update() {
    this.renderer.render(this.scene, this.camera);
  }

  public handleCanvasResize() {
    const parentElement = this.canvas.parentElement;
    if (!parentElement) return;

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    );

    this.camera.aspect = parentElement.clientWidth / parentElement.clientHeight;
    this.camera.updateProjectionMatrix();
  }
}
