/*
 * @nu-art/build-and-install - Build, test, and deploy a Thunderstorm monorepo
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ImplementationMissingException} from '@nu-art/ts-common';

/**
 * Scheduled Cloud Run services stay private. HTTP and eventarc services stay
 * publicly invokable; callers such as artifact_etl authenticate themselves.
 */
export function invokerIamDisabled(trigger: string): 'true' | 'false' {
	return trigger === 'schedule' ? 'false' : 'true';
}

/**
 * Cloud Scheduler accepts a 5-field cron. Firebase also accepts "every N hours"
 * and "every N minutes". "every 24 hours" is midnight UTC every day.
 */
export function cloudSchedulerCron(schedule: string): string {
	const trimmed = schedule.trim();
	if (/^(\S+\s+){4}\S+$/.test(trimmed))
		return trimmed;

	const hours = /^every (\d+) hours?$/.exec(trimmed);
	if (hours) {
		const every = Number(hours[1]);
		if (every === 24)
			return '0 0 * * *';
		if (every > 0 && every < 24 && 24 % every === 0)
			return `0 */${every} * * *`;
	}

	const minutes = /^every (\d+) minutes?$/.exec(trimmed);
	if (minutes) {
		const every = Number(minutes[1]);
		if (every > 0 && every < 60)
			return `*/${every} * * * *`;
	}

	throw new ImplementationMissingException(
		`Schedule '${schedule}' is not a 5-field cron and is not a supported 'every N hours' or 'every N minutes' expression`
	);
}
