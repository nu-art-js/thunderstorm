/*
 * @nu-art/conflict-resolution-frontend - Dispatcher for showing conflict resolution UI
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DBEntityDependencies} from '@nu-art/conflict-resolution-shared';
import {ThunderDispatcher} from '@nu-art/thunder-core';

export interface OnShowConflictResolution {
	__onShowConflictResolution: (dependencies?: DBEntityDependencies) => void;
}

export const dispatch_ShowConflictResolution = new ThunderDispatcher<OnShowConflictResolution, '__onShowConflictResolution'>('__onShowConflictResolution');