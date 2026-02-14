/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {UrlTarget} from './url-types.js';

/**
 * Opens a URL in the browser (replacement for ModuleFE_Thunderstorm.openUrl in isolated packages).
 */
export function openUrlInWindow(url: string, target?: UrlTarget): void {
	window.open(url, target ?? '_self');
}
