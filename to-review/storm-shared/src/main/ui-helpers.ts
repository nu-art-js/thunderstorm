/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {filterInstances} from '@nu-art/ts-common';

/**
 * Joins class names, filtering out falsy values.
 */
export function _className(...classes: (string | boolean | undefined)[]): string {
	return filterInstances(classes.filter(c => !!c)).join(' ');
}
