import {tsValidateString} from '@nu-art/ts-common';

/**
 * Simplified audit information (v2).
 *
 * Only stores the auditor ID, not full audit details.
 */
export type AuditableV2 = {
	/** ID of the user/system that made the change */
	_auditorId: string;
}


export const tsValidator_AuditableV2 = {_auditorId: tsValidateString()};
