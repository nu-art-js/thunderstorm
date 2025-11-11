import {DBEntityDependencies} from '@nu-art/thunderstorm-frontend';
import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend/index';

export interface OnShowConflictResolution {
	__onShowConflictResolution: (dependencies?: DBEntityDependencies) => void;
}

export const dispatch_ShowConflictResolution = new ThunderDispatcher<OnShowConflictResolution, '__onShowConflictResolution'>('__onShowConflictResolution');