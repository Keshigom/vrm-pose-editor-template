import * as THREE from "three";
import { VRM, VRMPose } from "@pixiv/three-vrm";
import { TransformControls } from "../../../lib/TransformControls";
import { VrmIK } from "../vrmIk";
import { createSkeltonHelper } from "./vrmSkeltonHelper";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { InteractableObject } from "./interactableObject";
import { createVrmIkHelper } from "./vrmIkHelper/vrmIkHelper";
import { Vector3 } from "three";
import { v1IKConfig } from "../vrmIk/v1IkConfig";

const createTransformController = (
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  scene: THREE.Scene | THREE.Group
): TransformControls => {
  const controller = new TransformControls(camera, canvas);
  controller.setMode("rotate");
  controller.setSpace("local");
  controller.setSize(0.7);

  scene.attach(controller);
  return controller;
};

/**
 * アバターのポーズを編集するためのコントローラ
 */
export class VrmPoseController {
  private _vrmIk: VrmIK;
  private _camera: THREE.Camera;
  private _transformController: TransformControls;
  private _focusedObject: InteractableObject | null = null;
  private _selectedObject: InteractableObject | null = null;
  private _interactableObjects: InteractableObject[];
  private _needIkSolve = false;

  constructor(
    vrm: VRM,
    camera: THREE.Camera,
    canvas: HTMLCanvasElement,
    orbitControls: OrbitControls,
    onPoseChange?: (vrmPose: VRMPose) => void
  ) {
    if (vrm.meta?.metaVersion === "0") {
      this._vrmIk = new VrmIK(vrm);
    } else {
      this._vrmIk = new VrmIK(vrm, v1IKConfig);
    }
    this._camera = camera;

    const skeltonHelper = createSkeltonHelper(vrm);
    const ikHelper = createVrmIkHelper(this._vrmIk);

    this._interactableObjects = [...skeltonHelper, ...ikHelper];

    this._interactableObjects.map((obj) => {
      obj.addEventListener("click", this._handleUiClick);
      obj.addEventListener("focus", this._handleUiFocus);
    });

    this._transformController = createTransformController(
      camera,
      canvas,
      vrm.scene
    );

    this._transformController.addEventListener("dragging-changed", (event) => {
      orbitControls.enabled = !event.value;
      if (event.target.getMode() === "translate") {
        this._needIkSolve = !!event.value;
      } else {
        this._needIkSolve = false;
      }

      const pose = vrm.humanoid?.getNormalizedPose();
      if (pose && onPoseChange && !event.target.dragging) {
        onPoseChange(pose);
      }
    });

    canvas.addEventListener("mousedown", this._handleMouseDown);
    canvas.addEventListener("mousemove", this._handleMouseMove);
  }

  public update = () => {
    if (this._needIkSolve) {
      this._vrmIk.solve(); // IKを解決
    } else {
      // IK操作時以外は手先に追従させる
      this._vrmIk.ikChains.map((chain) => {
        const worldPos = chain.effector.getWorldPosition(new Vector3());
        chain.goal.position.copy(chain.goal.parent!.worldToLocal(worldPos));
      });
    }
  };

  public setVisible = (visible: boolean): void => {
    this._interactableObjects.forEach((obj) => (obj.visible = visible));

    // コントローラーが無効な状態の時に表示してしまうのを回避する
    const isControllerEnabled = visible && !!this._transformController.object;
    this._transformController.enabled = isControllerEnabled;
    this._transformController.visible = isControllerEnabled;
  };

  // TODO: 負荷対策を考える
  // flag&update or throttle
  private _handleMouseMove = (event: MouseEvent) => {
    const canvas = event.currentTarget;

    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    // 左クリックでコントローラ選択 UI表示
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const mouse = new THREE.Vector2();
    mouse.x = (x / w) * 2 - 1;
    mouse.y = -(y / h) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this._camera);

    const intersects = raycaster.intersectObjects(this._interactableObjects);
    if (intersects.length <= 0) {
      this._dispatchBlur();
      return;
    }

    const interact = intersects[0].object.parent;
    if (interact instanceof InteractableObject) {
      this._dispatchFocus(interact);
    }
  };

  private _handleMouseDown = (event: MouseEvent) => {
    // 右クリックで解除
    if (event.button === 2) {
      this._handleRightClick();
    }

    // 左クリックで３DUIを選択
    this._handleLeftClick(event);
  };

  private _handleRightClick = () => {
    this._dispatchUnselect();
  };

  private _handleLeftClick = (event: MouseEvent) => {
    const canvas = event.currentTarget;

    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    // 左クリックでコントローラ選択 UI表示
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const mouse = new THREE.Vector2();
    mouse.x = (x / w) * 2 - 1;
    mouse.y = -(y / h) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this._camera);

    // 非表示のオブジェクトは判定から除外する
    const visibleObjects = this._interactableObjects.filter(
      (obj) => obj.visible === true
    );

    const intersects = raycaster.intersectObjects(visibleObjects);
    if (intersects.length > 0) {
      const interact = intersects[0].object.parent;
      if (interact instanceof InteractableObject) {
        interact.dispatchEvent({
          type: "click",
        });
      }
    }
  };

  private _handleUiClick = (event: THREE.Event): void => {
    const interactObj = event.target;
    if (interactObj instanceof InteractableObject) {
      this._dispatchSelect(interactObj);
    }
  };

  private _handleUiFocus = (event: THREE.Event): void => {
    const interactObj = event.target;

    if (interactObj instanceof InteractableObject) {
      this._dispatchBlur();
      this._focusedObject = interactObj;
    }
  };

  // TODO: rename
  private _dispatchSelect = (interactObj: InteractableObject) => {
    if (this._selectedObject === interactObj) {
      return;
    }

    this._dispatchUnselect();
    this._selectedObject = interactObj;

    if (interactObj.tag === "rotate" || interactObj.tag === "translate") {
      this._transformController.attach(interactObj.controlTarget);
      this._transformController.setMode(interactObj.tag);
    }

    interactObj.dispatchEvent({ type: "select" });
  };

  private _dispatchUnselect = () => {
    this._transformController.detach();
    this._selectedObject?.dispatchEvent({ type: "unselect" });
    this._selectedObject = null;
  };

  private _dispatchFocus = (interactObj: InteractableObject) => {
    if (
      this._focusedObject === interactObj ||
      this._selectedObject === interactObj
    ) {
      return;
    }
    interactObj.dispatchEvent({ type: "focus" });
  };

  private _dispatchBlur = () => {
    if (this._focusedObject === this._selectedObject) {
      return;
    }
    this._focusedObject?.dispatchEvent({ type: "blur" });
    this._focusedObject = null;
  };
}
