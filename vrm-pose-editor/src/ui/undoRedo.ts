import {VRMPoseEditor} from '../vrmPoseEditor';

export const undoRedo = (vrmPoseEditor: VRMPoseEditor) => {
  const undoButton = document.getElementById('undo');
  const redoButton = document.getElementById('redo');
  undoButton?.addEventListener('click', () => vrmPoseEditor.undo());
  redoButton?.addEventListener('click', () => vrmPoseEditor.redo());
};
