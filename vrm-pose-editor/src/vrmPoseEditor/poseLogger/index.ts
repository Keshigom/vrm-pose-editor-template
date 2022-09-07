import { VRMPose, VRMHumanoid } from "@pixiv/three-vrm";

/**
 * ポーズの履歴を管理し、undo/redoを行う
 *
 * _stack4redo []   : _stack4undo[N+1] undoをするとスタックに詰まれる
 *
 * _stack4undo [N]  : 現在のポーズ
 * _stack4undo [N-1]: undo先のポーズ
 */
export class PoseLogger {
  private _stack4Undo: VRMPose[] = [];
  private _stack4Redo: VRMPose[] = [];

  constructor(initialPose?: VRMPose, private length = 10) {
    this.handlePoseChange(initialPose || {});
  }

  public handlePoseChange(vrmPose: VRMPose) {
    this._stack4Undo.push(vrmPose);

    this._stack4Redo.length = 0;

    if (this._stack4Undo.length > this.length) {
      this._stack4Undo.shift();
    }
  }

  public undo(humanoid: VRMHumanoid) {
    if (this._stack4Undo.length < 2) {
      return;
    }

    const pose = this._stack4Undo.pop();
    if (pose) {
      humanoid.setNormalizedPose(this._stack4Undo[this._stack4Undo.length - 1]);
      this._stack4Redo.push(pose);
    }

    console.log("undo");
  }

  public redo(humanoid: VRMHumanoid) {
    const pose = this._stack4Redo.pop();
    if (pose) {
      humanoid.setNormalizedPose(pose);
      this._stack4Undo.push(pose);
    }

    console.log("redo");
  }
}
