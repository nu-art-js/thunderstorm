/**
 * Frontend module for topic management in the messaging system.
 * Provides functionality for handling topic-related operations, state management,
 * and topic filtering based on collection and reference criteria.
 */

import {DispatcherDef, ThunderDispatcherV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend/index';
import {DBDef_Topic, DBProto_Topic, UI_Topic} from '@nu-art/ts-messaging-shared';


/**
 * Dispatcher type definition for topic updates, used to handle topic-related state changes
 */
export type DispatcherType_Topic = DispatcherDef<DBProto_Topic, `__onTopicsUpdated`>;

/**
 * Dispatcher instance for handling topic updates across the application.
 * Used to broadcast and handle topic-related state changes throughout the application.
 * Implements the ThunderDispatcherV3 pattern for consistent state management.
 */
export const dispatch_onTopicsUpdated = new ThunderDispatcherV3<DispatcherType_Topic>('__onTopicsUpdated');

/**
 * Frontend module for managing topics
 * Handles topic-related operations and state management in the frontend
 */
export class ModuleFE_topic_Class
	extends ModuleFE_BaseApi<DBProto_Topic> {


	/**
	 * Initializes a new instance of ModuleFE_topic_Class.
	 * Sets up the base API configuration with DBDef_Topic definition
	 * and configures the dispatcher for topic updates.
	 */
	constructor() {
		super(DBDef_Topic, dispatch_onTopicsUpdated);
	}

	/**
	 * Retrieves topics based on collection name and reference ID
	 * @param collectionName - The name of the collection to filter topics (e.g., 'messages', 'channels')
	 * @param refId - The unique identifier used to reference specific topics within the collection
	 * @returns Array of UI_Topic objects matching the specified collection name and reference ID
	 */
	public getTopics(collectionName: string, refId: string): UI_Topic[] {
		return this.cache.filter(topic => topic.type === collectionName && topic.refId === refId);
	}

}

export const ModuleFE_Topic = new ModuleFE_topic_Class();

