/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import utc from 'moment';
import {AuditBy, Timestamp} from './types.js';
import {exists} from './tools.js';
import {TimeProxy} from './time-proxy.js';


export const Second = 1000;
export const Minute = Second * 60;
export const Hour = Minute * 60;
export const Day = Hour * 24;
export const Week = Day * 7;
export const Year = Day * 365;
export const Month = Year / 12;

export const Format_HHmmss_DDMMYYYY = 'HH:mm:ss_DD-MM-YYYY';
export const Format_YYYYMMDD_HHmmss = 'YYYY-MM-DD_HH:mm:ss';
export type Weekday = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export const Weekdays: Weekday[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export type TimerHandler<Args extends any[] = any[]> = (...args: Args) => void;
export type TimeRange = [number, number] | [undefined, number] | [number, undefined];
export type TimeCounter = { dt: () => number; format: (format: string) => string };

export async function timeout(sleepMs: number) {
	return new Promise(resolve => setTimeout(resolve, sleepMs, undefined));
}

export const sleep = timeout;

export function _setTimeout<Args extends any[]>(handler: TimerHandler<Args>, sleepMs = 0, ...args: Args): number {
	return setTimeout(handler, sleepMs, ...args) as unknown as number;
}

export function _clearTimeout(handlerId?: number) {
	if (!handlerId)
		return;
	return clearTimeout(handlerId as unknown as ReturnType<typeof setTimeout>);
}

export function _setInterval<Args extends any[]>(handler: TimerHandler<Args>, sleepMs = 0, ...args: Args) {
	return setInterval(handler, sleepMs, ...args) as unknown as number;
}

export function _clearInterval(handlerId?: number) {
	if (!handlerId)
		return;
	return clearInterval(handlerId as unknown as ReturnType<typeof setInterval>);
}

/**
 * Creates a timeout handler object that manages a single `setTimeout` instance.
 * Includes lifecycle controls: set, clear, reset, isActive.
 *
 * @param handler The function to be called after the timeout.
 * @param sleepMs Timeout duration in milliseconds. Defaults to 0.
 * @param args Arguments passed to the handler function.
 * @returns An object with `set`, `clear`, `reset`, and `isActive` methods.
 */
export const timeoutHandler = <Args extends any[]>(handler: TimerHandler<Args>, sleepMs = 0, ...args: Args) => {
	let handlerId: ReturnType<typeof setTimeout> | undefined;
	let expiration: number | undefined;

	const clear = () => {
		if (!exists(handlerId))
			return;

		clearTimeout(handlerId);
		handlerId = undefined;
		expiration = undefined;
	};

	const set = () => {
		if (exists(handlerId))
			return;

		expiration = currentTimeMillis() + sleepMs;
		handlerId = setTimeout(handler, sleepMs, ...args);
	};

	const adjustTime = () => {
		if (!exists(handlerId) || !exists(expiration))
			return;

		const now = currentTimeMillis();
		const remaining = expiration - now;
		if (remaining <= 0) {
			clear();
			setTimeout(handler, 0, ...args);
			return;
		}
		clear();
		expiration = now + remaining;
		handlerId = setTimeout(handler, remaining, ...args);
	};

	return {
		set,
		clear,
		reset: () => {
			clear();
			set();
		},
		isActive: () => exists(handlerId),
		_: {onTimeAdjusted: adjustTime},
	};
};

/**
 * Creates an interval handler object that manages a single `setInterval` instance.
 * Includes lifecycle controls: set, clear, reset, isActive.
 *
 * @param handler The function to be called repeatedly.
 * @param sleepMs Interval duration in milliseconds. Defaults to 0.
 * @param args Arguments passed to the handler function.
 * @returns An object with `set`, `clear`, `reset`, and `isActive` methods.
 */
export const intervalHandler = <Args extends any[]>(handler: TimerHandler<Args>, sleepMs = 0, ...args: Args) => {
	let handlerId: ReturnType<typeof setTimeout> | undefined;
	let nextTick: number | undefined;

	const clear = () => {
		if (!exists(handlerId))
			return;

		clearTimeout(handlerId);
		handlerId = undefined;
		nextTick = undefined;
	};

	const tick = () => {
		handler(...args);
		nextTick = currentTimeMillis() + sleepMs;
		handlerId = setTimeout(tick, sleepMs);
	};

	const set = () => {
		if (exists(handlerId))
			return;

		nextTick = currentTimeMillis() + sleepMs;
		handlerId = setTimeout(tick, sleepMs);
	};

	const adjustTime = () => {
		if (!exists(handlerId) || !exists(nextTick))
			return;

		const now = currentTimeMillis();
		const remaining = nextTick - now;
		clear();

		if (remaining <= 0)
			return setTimeout(tick, 0);

		nextTick = now + remaining;
		handlerId = setTimeout(tick, remaining);
	};

	return {
		set,
		clear,
		reset: () => {
			clear();
			set();
		},
		isActive: () => exists(handlerId),
		_: { onTimeAdjusted: adjustTime },
	};
};


/**
 * @param comment @deprecated
 */
export function auditBy(user: string, comment?: string, timestamp = currentTimeMillis()): AuditBy {
	const _auditBy: AuditBy = {
		auditBy: user,
		auditAt: createReadableTimestampObject(Format_HHmmss_DDMMYYYY, timestamp)
	};

	if (comment)
		_auditBy.comment = comment;
	return _auditBy;
}

export function currentTimeMillis() {
	return TimeProxy.currentTimeMillis();
}

export function specificTimeTodayMillis(hours: number, minutes: number) {
	const date = new Date();
	date.setHours(hours);
	date.setMinutes(minutes);
	return date.getTime();
}

export function currentLocalTimeMillis() {
	const date = new Date();
	return date.getTime();
}

export function currentTimeMillisWithTimeZone() {
	const date = new Date();
	return date.getTime() + date.getTimezoneOffset();
}

export function createReadableTimestampObject(pattern: string = Format_HHmmss_DDMMYYYY, timestamp: number = currentTimeMillis(), timezone?: string) {

	const timeObj: Timestamp = {
		timestamp: timestamp,
		pretty: formatTimestamp(pattern, timestamp)
	};

	if (timezone)
		timeObj.timezone = timezone;

	return timeObj;
}

/**
 * For detailed list of formats visit https://momentjs.com/docs/#/displaying/format/
 */
export function formatTimestamp(pattern: string = Format_HHmmss_DDMMYYYY, timestamp: number = currentTimeMillis(), timezone: string = Intl.DateTimeFormat()
	.resolvedOptions().timeZone) {
	const m = utc(timestamp);
	m.utcOffset(-new Date().getTimezoneOffset());
	return m.format(pattern);
}

export function parseTimeString(timestamp: string, pattern: string = Format_HHmmss_DDMMYYYY): number {
	return utc(timestamp, pattern).valueOf();
}

export function normalizeTimestamp(timestamp: number, pattern: string): number {
	return parseTimeString(formatTimestamp(pattern, timestamp), pattern);
}

export const DateTimeFormat = (format: string) => {
	return {
		parse: (timestampAsString: string) => parseTimeString(timestampAsString, format),
		format: (timestamp = currentTimeMillis()) => formatTimestamp(format, timestamp)
	};
};
export const DateTimeFormat_yyyyMMDDTHHmmss = DateTimeFormat('YYYY-MM-DDTHH:mm:ss');
export const DateTimeFormat_yyyyMMDD = DateTimeFormat('YYYY-MM-DD');
export const DateTimeFormat_DDMMYYYY = DateTimeFormat('DD/MM/YYYY');

export function isSameDay(date1: Date, date2: Date): boolean {
	return utc(date1).isSame(date2, 'day');
}

export function deltaDays(d1: Date | number, d2: Date | number): number {
	const date1 = typeof d1 === 'number' ? new Date(d1) : d1;
	const date2 = typeof d2 === 'number' ? new Date(d2) : d2;

	//If both dates are the same day, return 0
	if (isSameDay(date1, date2))
		return 0;

	const millis1 = typeof d1 === 'number' ? d1 : d1.getTime();
	const millis2 = typeof d2 === 'number' ? d2 : d2.getTime();
	const days = Math.floor((millis1 - millis2) / Day);

	//If date2 + the amount of days calculated actually lands on the same day as date1, return days
	//Else, an extra day needs to be given
	const date2Offset = new Date(date2.getTime() + (days * Day));
	return isSameDay(date1, date2Offset) ? days : days + 1;
}

export function timeCounter() {
	const started = currentTimeMillis();
	return {
		dt: () => currentTimeMillis() - started,
		format: (format: string) => {
			let dt = currentTimeMillis() - started;
			const hours = Math.floor(dt / Hour);
			dt -= hours * Hour;

			const minutes = Math.floor(dt / Minute);
			dt -= minutes * Minute;

			const seconds = Math.floor(dt / Second);
			dt -= seconds * Second;

			const millis = dt;
			return format
				.replace('hh', String(hours).padStart(2, '0'))
				.replace('mm', String(minutes).padStart(2, '0'))
				.replace('ss', String(seconds).padStart(2, '0'))
				.replace('zzz', String(millis).padStart(3, '0'));
		}
	};
}
