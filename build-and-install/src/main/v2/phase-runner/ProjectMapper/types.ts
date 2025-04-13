import {BaseUnit} from '../../unit/core';

export type ProjectLibRule<T extends BaseUnit> = (path: string) => T | undefined;