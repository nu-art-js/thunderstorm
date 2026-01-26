/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: This dispatcher interface should be standardized and moved to a shared package.
 * Currently a placeholder to decouple from thunderstorm's ThunderDispatcher.
 */


/**
 * Simple event dispatcher interface.
 *
 * Provides a minimal contract for dispatching events to modules and UI.
 * Implementations can use different underlying mechanisms (Redux, EventEmitter, etc.)
 */
export interface EventDispatcher<EventType extends string = string, ItemType = any> {
	/**
	 * Dispatch an event to module listeners.
	 */
	dispatchModule(event: EventType, item: ItemType): void;

	/**
	 * Dispatch an event to UI listeners.
	 */
	dispatchUI(event: EventType, item: ItemType): void;

	/**
	 * Dispatch to all listeners (both module and UI).
	 */
	dispatchAll(event: EventType, item: ItemType): void;
}

/**
 * No-op dispatcher for cases where no event handling is needed.
 */
export const NoOpDispatcher: EventDispatcher = {
	dispatchModule: () => {},
	dispatchUI: () => {},
	dispatchAll: () => {},
};
