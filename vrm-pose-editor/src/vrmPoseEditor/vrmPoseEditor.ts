import {Avatar, VisibleOptions as AvatarVisibleOptions} from './avatar';
import {Viewer, VisibleOptions as ViewerVisibleOptions} from './viewer';

type VisibleOptions = AvatarVisibleOptions & ViewerVisibleOptions;
/**
 * VRMを操作できるcanvasを提供するclass
 *
 * UIへ接続するメソッドを提供する。
 *
 * @param mounterElement canvasのマウント先を指定する
 */
export class VRMPoseEditor {
  private _viewer: Viewer;
  private _avatar: Avatar;
  constructor(mounterElement: HTMLElement) {
    this._viewer = new Viewer(mounterElement);
    this._avatar = new Avatar(this._viewer);

    // start render loop
    this.update();
  }

  public async loadVRM(url: string, onload?: () => void) {
    await this._avatar.loadVRM(url, onload);
  }

  public resize() {
    this._viewer.handleCanvasResize();
  }

  public undo() {
    this._avatar.poseUndo();
  }

  public redo() {
    this._avatar.poseRedo();
  }

  /**
   * 3Dシーン上のUIの表示・非表示を切り替える
   * @param options
   */
  public setVisibleUi(options: VisibleOptions) {
    this._avatar.setVisible(options);
  }

  private update = () => {
    requestAnimationFrame(this.update);
    const delta = this._viewer.clock.getDelta();
    this._viewer.update();
    this._avatar.update(delta);
  };
}
