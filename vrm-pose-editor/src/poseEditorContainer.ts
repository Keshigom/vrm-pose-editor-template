import {VRMPoseEditor} from './vrmPoseEditor';
import {PoseEditor2dUi} from './ui';

export const PoseEditorContainer = (): void => {
  const canvasMounter = document.getElementById('canvas-mounter');

  // canvasのサイズを取得するため後からマウントする
  window.addEventListener('DOMContentLoaded', () => {
    const vrmPoseEditor = new VRMPoseEditor(canvasMounter!);

    PoseEditor2dUi(vrmPoseEditor);

    window.addEventListener('resize', () => {
      vrmPoseEditor.resize();
    });
  });
};
