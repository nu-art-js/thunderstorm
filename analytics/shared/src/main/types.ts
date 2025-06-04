import {UniqueId} from '@nu-art/ts-common';

/**
 * Contextual metadata describing the environment in which the event occurred.
 * This includes device, OS, IP, app version, etc.
 */
export type TSAnalyticsEventMetadata = {
	/** Device model or type (e.g., 'iPhone 14', 'Desktop') */
	device?: string;
	/** Operating system or platform (e.g., 'iOS', 'Android', 'Windows') */
	os?: string;
	/** IP of the device */
	ip?: string;
	/** Application version (e.g., '1.2.3') */
	appVersion?: string;
	/** Any additional context metadata */
	[key: string]: any;
};

export type TSAnalyticsEvent = {
	/**
	 * The name of the event, used to identify the type of action.
	 */
	key: string;
	/**
	 * The timestamp of when the event occurred, in Unix milliseconds.
	 */
	timestamp: number;
	context?: TSAnalyticsEventMetadata;
	/**
	 * A dictionary of custom event-specific properties.
	 * These describe metadata unique to this event type.
	 */
	properties?: Record<string, any>;
	/**
	 * The internal user ID associated with this event.
	 * Optional for anonymous or pre-authentication events.
	 */
	userId?: UniqueId;
	/**
	 * The group or organization ID associated with the event, if applicable.
	 */
	groupId?: string;
	/**
	 * The session ID this event is part of.
	 * Useful for session-level tracking, funnels, and behavior analysis.
	 */
	sessionId?: UniqueId;
};