export const loadDefaultAvatar = (onClick: () => void) => {
  const loadButton = document.getElementById('load-default-model')!;
  loadButton.addEventListener('click', onClick);
};
