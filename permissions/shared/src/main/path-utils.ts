/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** Removes a leading '/' from path if present. Used for normalizing API paths. */
export const trimStartingForwardSlash = (path: string): string =>
	path.startsWith('/') ? path.substring(1) : path;
