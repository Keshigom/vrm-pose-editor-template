export const loadLocalAvatar = (onChange: (e: Event) => void) => {
  const inputFile = document.getElementById(
    'load-local-model'
  ) as HTMLInputElement;
  inputFile.type = 'file';

  inputFile.addEventListener('change', onChange);
};
