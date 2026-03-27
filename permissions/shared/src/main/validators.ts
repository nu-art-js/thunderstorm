import {tsValidateRegexp} from '@nu-art/ts-common';

export const validateGroupLabel = tsValidateRegexp(/^[A-Za-z-0-9\._\/ ]+$/);
