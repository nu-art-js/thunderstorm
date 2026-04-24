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
import {BadImplementationException} from '../core/exceptions/exceptions.js';


/** Time constants in milliseconds */
export const Second = 1000;
export const Minute = Second * 60;
export const Hour = Minute * 60;
export const Day = Hour * 24;
export const Week = Day * 7;
export const Year = Day * 365;
export const Month = Year / 12;

const durationUnits: Record<string, number> = {
	s: Second,
	m: Minute,
	h: Hour,
	d: Day,
	w: Week,
};

const durationPattern = /^(?:\d+[smhdw])+$/;
const durationSegment = /(\d+)([smhdw])/g;

const durationUnitOrder: {unit: string; ms: number}[] = [
	{unit: 'd', ms: Day},
	{unit: 'h', ms: Hour},
	{unit: 'm', ms: Minute},
	{unit: 's', ms: Second},
];

/**
 * Parse and format durations using compact notation (s/m/h/d/w).
 *
 * - `parse("3h1m30s")` → `10890000` (ms)
 * - `format(10890000)` → `"3h1m30s"`
 */
export const StringFormat_Duration = {
	format(ms: number): string {
		if (ms <= 0)
			return '0s';

		let remaining = ms;
		let result = '';
		for (const {unit, ms: unitMs} of durationUnitOrder) {
			const count = Math.floor(remaining / unitMs);
			if (count > 0) {
				result += `${count}${unit}`;
				remaining -= count * unitMs;
			}
		}

		return result || '0s';
	},

	parse(duration: string): number {
		if (!durationPattern.test(duration))
			throw new BadImplementationException(`Invalid duration format: "${duration}" — expected segments like 5s, 1m, 3h1m30s`);

		let total = 0;
		let match: RegExpExecArray | null;
		durationSegment.lastIndex = 0;
		while ((match = durationSegment.exec(duration)) !== null) {
			total += parseInt(match[1]) * durationUnits[match[2]];
		}

		return total;
	},
};

/** @see StringFormat_Duration.format */
export const formatDuration = StringFormat_Duration.format;

/** @see StringFormat_Duration.parse */
export const parseDuration = StringFormat_Duration.parse;

/** Predefined timestamp format strings */
export const Format_HHmmss_DDMMYYYY = 'HH:mm:ss_DD-MM-YYYY';
export const Format_YYYYMMDD_HHmmss = 'YYYY-MM-DD_HH:mm:ss';
export type Weekday = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export const Weekdays: Weekday[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export type TimerHandler<Args extends any[] = any[]> = (...args: Args) => void;
export type TimeRange = [number, number] | [undefined, number] | [number, undefined];
export type TimeCounter = { dt: () => number; format: (format: string) => string };

/**
 * Creates a Promise that resolves after the specified delay.
 *
 * @param sleepMs - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export async function timeout(sleepMs: number) {
	return new Promise(resolve => setTimeout(resolve, sleepMs, undefined));
}

/** Alias for timeout() */
export const sleep = timeout;

/**
 * Wrapper for setTimeout that returns a number instead of NodeJS.Timeout.
 *
 * Used for cross-platform compatibility (browser setTimeout returns number,
 * Node.js returns Timeout object).
 *
 * @param handler - Function to execute after delay
 * @param sleepMs - Delay in milliseconds (default: 0)
 * @param args - Arguments to pass to the handler
 * @returns Timeout ID as a number
 */
export function _setTimeout<Args extends any[]>(handler: TimerHandler<Args>, sleepMs = 0, ...args: Args): number {
	return setTimeout(handler, sleepMs, ...args) as unknown as number;
}

/**
 * Wrapper for clearTimeout that accepts a number.
 *
 * @param handlerId - Timeout ID to clear
 */
export function _clearTimeout(handlerId?: number) {
	if (!handlerId)
		return;
	return clearTimeout(handlerId as unknown as ReturnType<typeof setTimeout>);
}

/**
 * Wrapper for setInterval that returns a number instead of NodeJS.Timeout.
 *
 * @param handler - Function to execute repeatedly
 * @param sleepMs - Interval in milliseconds (default: 0)
 * @param args - Arguments to pass to the handler
 * @returns Interval ID as a number
 */
export function _setInterval<Args extends any[]>(handler: TimerHandler<Args>, sleepMs = 0, ...args: Args) {
	return setInterval(handler, sleepMs, ...args) as unknown as number;
}

/**
 * Wrapper for clearInterval that accepts a number.
 *
 * @param handlerId - Interval ID to clear
 */
export function _clearInterval(handlerId?: number) {
	if (!handlerId)
		return;
	return clearInterval(handlerId as unknown as ReturnType<typeof setInterval>);
}

/**
 * Creates a timeout handler object that manages a single `setTimeout` instance.
 *
 * Provides a controlled interface for managing timeouts with lifecycle methods.
 * The handler tracks expiration time and supports time adjustment (useful for
 * time synchronization scenarios).
 *
 * **Features**:
 * - `set()` - Starts the timeout (idempotent - does nothing if already active)
 * - `clear()` - Cancels the timeout
 * - `reset()` - Cancels and restarts the timeout
 * - `isActive()` - Checks if timeout is currently active
 * - `_.onTimeAdjusted` - Internal method to adjust timeout when system time changes
 *
 * @param handler - Function to be called after the timeout
 * @param sleepMs - Timeout duration in milliseconds (default: 0)
 * @param args - Arguments to pass to the handler function
 * @returns Object with timeout control methods
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

	/**
	 * Adjusts the timeout when system time changes.
	 *
	 * Recalculates remaining time and reschedules the timeout accordingly.
	 * If the expiration time has already passed, executes immediately.
	 */
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
 * Creates an interval handler object that manages a repeating timer.
 *
 * Uses `setTimeout` recursively instead of `setInterval` for better control and
 * time adjustment support. Provides the same interface as `timeoutHandler`.
 *
 * **Note**: The interval is recalculated after each tick, so drift is minimized
 * and time adjustments are properly handled.
 *
 * @param handler - Function to be called repeatedly
 * @param sleepMs - Interval duration in milliseconds (default: 0)
 * @param args - Arguments to pass to the handler function
 * @returns Object with interval control methods
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

	/**
	 * Executes the handler and schedules the next tick.
	 */
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

	/**
	 * Adjusts the interval when system time changes.
	 *
	 * Recalculates the next tick time based on remaining time.
	 */
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
		_: {onTimeAdjusted: adjustTime},
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

/**
 * Gets the current time in milliseconds using TimeProxy.
 *
 * TimeProxy allows for time manipulation in tests (e.g., fast-forwarding time).
 * In production, this returns the actual current time.
 *
 * @returns Current timestamp in milliseconds
 */
export function currentTimeMillis() {
	return TimeProxy.currentTimeMillis();
}

/**
 * Gets the timestamp for a specific time today in local timezone.
 *
 * @param hours - Hour (0-23)
 * @param minutes - Minute (0-59)
 * @returns Timestamp in milliseconds for the specified time today
 */
export function specificTimeTodayMillis(hours: number, minutes: number) {
	const date = new Date();
	date.setHours(hours);
	date.setMinutes(minutes);
	return date.getTime();
}

/**
 * Gets the current local time in milliseconds.
 *
 * @returns Current local timestamp in milliseconds
 */
export function currentLocalTimeMillis() {
	const date = new Date();
	return date.getTime();
}

/**
 * Gets the current time in milliseconds adjusted for timezone offset.
 *
 * **Note**: This adds the timezone offset, which may not be the intended behavior
 * for most use cases. Consider using `currentTimeMillis()` or `currentLocalTimeMillis()` instead.
 *
 * @returns Current timestamp adjusted by timezone offset
 */
export function currentTimeMillisWithTimeZone() {
	const date = new Date();
	return date.getTime() + date.getTimezoneOffset();
}

/**
 * Creates a Timestamp object with both numeric timestamp and formatted string.
 *
 * @param pattern - Moment.js format pattern (default: Format_HHmmss_DDMMYYYY)
 * @param timestamp - Timestamp in milliseconds (default: current time)
 * @param timezone - Optional timezone string
 * @returns Timestamp object with timestamp, pretty, and optional timezone
 */
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
 * Formats a timestamp using a Moment.js pattern.
 *
 * **Note**: Adjusts for timezone offset using `-new Date().getTimezoneOffset()`.
 * For detailed format patterns, see https://momentjs.com/docs/#/displaying/format/
 *
 * @param pattern - Moment.js format pattern (default: Format_HHmmss_DDMMYYYY)
 * @param timestamp - Timestamp in milliseconds (default: current time)
 * @param timezone - Timezone string (default: system timezone)
 * @returns Formatted timestamp string
 */
export function formatTimestamp(pattern: string = Format_HHmmss_DDMMYYYY, timestamp: number = currentTimeMillis(), timezone: string = Intl.DateTimeFormat()
	.resolvedOptions().timeZone) {
	const m = utc(timestamp);
	m.utcOffset(-new Date().getTimezoneOffset());
	return m.format(pattern);
}

/**
 * Parses a timestamp string into milliseconds using a format pattern.
 *
 * @param timestamp - Timestamp string to parse
 * @param pattern - Moment.js format pattern (default: Format_HHmmss_DDMMYYYY)
 * @returns Timestamp in milliseconds
 */
export function parseTimeString(timestamp: string, pattern: string = Format_HHmmss_DDMMYYYY): number {
	return utc(timestamp, pattern).valueOf();
}

/**
 * Normalizes a timestamp by formatting and re-parsing it.
 *
 * Useful for removing sub-second precision or normalizing to a specific format.
 *
 * @param timestamp - Timestamp in milliseconds
 * @param pattern - Format pattern to normalize to
 * @returns Normalized timestamp in milliseconds
 */
export function normalizeTimestamp(timestamp: number, pattern: string): number {
	return parseTimeString(formatTimestamp(pattern, timestamp), pattern);
}

/**
 * Creates a date/time formatter object with parse and format methods.
 *
 * Provides a convenient API for working with a specific date format pattern.
 *
 * @param format - Moment.js format pattern
 * @returns Object with `parse()` and `format()` methods
 */
export const DateTimeFormat = (format: string) => {
	return {
		parse: (timestampAsString: string) => parseTimeString(timestampAsString, format),
		format: (timestamp = currentTimeMillis()) => formatTimestamp(format, timestamp)
	};
};

/** Pre-configured formatter for ISO 8601 date-time format */
export const DateTimeFormat_yyyyMMDDTHHmmss = DateTimeFormat('YYYY-MM-DDTHH:mm:ss');
/** Pre-configured formatter for date-only format (YYYY-MM-DD) */
export const DateTimeFormat_yyyyMMDD = DateTimeFormat('YYYY-MM-DD');
/** Pre-configured formatter for European date format (DD/MM/YYYY) */
export const DateTimeFormat_DDMMYYYY = DateTimeFormat('DD/MM/YYYY');

export function isSameDay(date1: Date, date2: Date): boolean {
	return utc(date1).isSame(date2, 'day');
}

/**
 * Calculates the number of days between two dates.
 *
 * Returns the number of calendar days difference, not just 24-hour periods.
 * The calculation accounts for day boundaries - if the dates are on different
 * calendar days, it calculates the difference and adds 1 if needed to reach
 * the same calendar day.
 *
 * **Examples**:
 * - Same day: returns 0
 * - Jan 1 to Jan 2: returns 1
 * - Jan 1 23:59 to Jan 2 00:01: returns 1 (different calendar days)
 *
 * @param d1 - First date (Date object or timestamp)
 * @param d2 - Second date (Date object or timestamp)
 * @returns Number of calendar days difference (positive if d1 > d2, negative if d1 < d2)
 */
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

/**
 * Creates a time counter that tracks elapsed time since creation.
 *
 * Returns an object with methods to get elapsed time:
 * - `dt()` - Returns elapsed milliseconds
 * - `format(format)` - Returns formatted elapsed time string
 *
 * Format string supports:
 * - `hh` - Hours (00-99)
 * - `mm` - Minutes (00-59)
 * - `ss` - Seconds (00-59)
 * - `zzz` - Milliseconds (000-999)
 *
 * @returns TimeCounter object with dt() and format() methods
 *
 * @example
 * ```typescript
 * const counter = timeCounter();
 * // ... do work ...
 * console.log(counter.format('hh:mm:ss.zzz')); // "00:01:23.456"
 * ```
 */
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
