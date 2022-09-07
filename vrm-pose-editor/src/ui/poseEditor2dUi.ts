import {VRMPoseEditor} from '../vrmPoseEditor';
import {loadDefaultAvatar} from './loadDefaultAvatar';
import {loadLocalAvatar} from './loadLocalAvatar';
import {undoRedo} from './undoRedo';
import {setUiVisible} from './setUiVisible';

/* eslint-disable-next-line */
import threeVrmGirl from '/three-vrm-girl.vrm?url';

export const PoseEditor2dUi = (vrmPoseEditor: VRMPoseEditor): HTMLElement => {
  const uiContainer = document.createElement('div');
  uiContainer.innerHTML = 'ui';
  uiContainer.id = 'ui';

  loadDefaultAvatar(() => {
    vrmPoseEditor.loadVRM(threeVrmGirl);
  });

  loadLocalAvatar(e => {
    const target = e.target as HTMLInputElement;

    const files = target.files;
    if (!files) return;

    const file = files[0];
    if (!file) return;

    const blob = new Blob([file], {type: 'application/octet-stream'});
    const url = window.URL.createObjectURL(blob);
    vrmPoseEditor.loadVRM(url, () => {
      console.log('loaded');
      window.URL.revokeObjectURL(url);
    });
  });

  undoRedo(vrmPoseEditor);

  setUiVisible((e: Event, visible: boolean) => {
    vrmPoseEditor.setVisibleUi({
      poseController: visible,
    });
  });
  return uiContainer;
};
