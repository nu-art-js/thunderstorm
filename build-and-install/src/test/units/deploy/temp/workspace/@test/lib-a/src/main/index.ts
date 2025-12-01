import {libBFunction} from '@test/lib-b';

export const libAFunction = () => {
  return `lib-a uses ${libBFunction()}`;
};

