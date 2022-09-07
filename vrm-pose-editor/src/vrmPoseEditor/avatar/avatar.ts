import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VrmPoseController } from "../vrmPoseController/vrmPoseController";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { Viewer } from "../viewer";
import { PoseLogger } from "../poseLogger";

export type VisibleOptions = {
  poseController?: boolean;
};

/**
 * VRMアバター1体ごとのクラス
 * @param viewer three.jsのシーン構成物を参照する(scene,light,camera...)
 */
export class Avatar {
  private _viewer: Viewer; // TODO : 大きすぎるのでどうにかしたい
  private _vrm?: VRM;
  private _poseController?: VrmPoseController;
  private _poseLogger?: PoseLogger;

  constructor(viewer: Viewer) {
    this._viewer = viewer;
  }

  public async loadVRM(url: string, onload?: () => void) {
    const loader = new GLTFLoader();
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser, {
        autoUpdateHumanBones: true,
      });
    });

    const gltf = await loader.loadAsync(url);
    const vrm = gltf.userData.vrm as VRM;

    if (this._vrm) {
      VRMUtils.deepDispose(this._vrm.scene);
      this._viewer.scene.remove(this._vrm.scene);
    }

    VRMUtils.rotateVRM0(vrm);
    this._viewer.scene.add(vrm.scene);

    this._vrm = vrm;
    this._poseLogger = new PoseLogger(this._vrm.humanoid?.getNormalizedPose());

    this._poseController = new VrmPoseController(
      vrm,
      this._viewer.camera,
      this._viewer.canvas,
      this._viewer.orbitControls,
      (pose) => {
        this._poseLogger?.handlePoseChange(pose);
      }
    );

    if (onload) {
      onload();
    }
  }

  public poseUndo = () => {
    if (this._vrm?.humanoid) this._poseLogger?.undo(this._vrm.humanoid);
  };

  public poseRedo = () => {
    if (this._vrm?.humanoid) this._poseLogger?.redo(this._vrm.humanoid);
  };

  public setVisible = ({ poseController }: VisibleOptions): void => {
    if (poseController !== undefined) {
      this._poseController?.setVisible(poseController);
    }
  };

  public update = (delta: number) => {
    this._poseController?.update();
    this._vrm?.update(delta);
  };
}
