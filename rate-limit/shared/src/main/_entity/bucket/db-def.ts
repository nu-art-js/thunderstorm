/*
 * @nu-art/rate-limit-shared - Sliding-window rate-limit policies, decision logic and bucket entity contract
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateArray, tsValidateNumber, tsValidateString, type ValidatorTypeResolver} from '@nu-art/ts-common';
import type {Database} from '@nu-art/db-api-shared';
import {type DatabaseDef_RateLimitBucket, RateLimitBucket_DbKey} from './types.js';

/** Accepts a Date (written) or a Firestore Timestamp (as read back); both expose toMillis/getTime. */
const tsValidateTtlDate: ValidatorTypeResolver<Date> = (input?: Date) => {
	if (input instanceof Date && Number.isFinite(input.getTime()))
		return;

	if (typeof (input as unknown as { toMillis?: unknown })?.toMillis === 'function')
		return;

	return 'expiresAtTtl must be a Date';
};

const modifiablePropsValidator: DatabaseDef_RateLimitBucket['modifiablePropsValidator'] = {
	policyKey: tsValidateString(),
	hits: tsValidateArray(tsValidateNumber()),
	expiresAt: tsValidateNumber(),
	expiresAtTtl: tsValidateTtlDate,
};

const generatedPropsValidator: DatabaseDef_RateLimitBucket['generatedPropsValidator'] = {};

export const DBDef_RateLimitBucket: Database<DatabaseDef_RateLimitBucket> = {
	dbKey: RateLimitBucket_DbKey,
	entityName: 'RateLimitBucket',
	modifiablePropsValidator,
	generatedPropsValidator,
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
	frontend: {group: 'rate-limit', name: 'bucket'},
	backend: {name: RateLimitBucket_DbKey},
};
