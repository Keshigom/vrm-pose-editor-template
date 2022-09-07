export const setUiVisible = (
  onChange: (e: Event, visible: boolean) => void
) => {
  const setVisibleTrue = document.getElementById(
    'ui-visible-true'
  ) as HTMLInputElement;
  const setVisibleFalse = document.getElementById(
    'ui-visible-false'
  ) as HTMLInputElement;

  setVisibleTrue.addEventListener('change', e => {
    onChange(e, true);
  });
  setVisibleFalse.addEventListener('change', e => {
    onChange(e, false);
  });
};
