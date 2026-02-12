/*
 * @nu-art/conflict-resolution-frontend - Dispatcher for showing conflict resolution UI
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DBEntityDependencies} from '@nu-art/thunderstorm-shared';
import {ThunderDispatcher} from '@nu-art/thunderstorm-frontend/index';

export interface OnShowConflictResolution {
	__onShowConflictResolution: (dependencies?: DBEntityDependencies) => void;
}

export const dispatch_ShowConflictResolution = new ThunderDispatcher<OnShowConflictResolution, '__onShowConflictResolution'>('__onShowConflictResolution');