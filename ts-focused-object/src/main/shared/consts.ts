import {Hour, Minute} from '@nu-art/ts-common';

export const DefaultTTL_Unfocus = 10 * Minute;
export const DefaultTTL_Focus = 2 * Hour;

export const getRelationalPath = () => `/state/ModuleBE_FocusedObject/focusedData/`;