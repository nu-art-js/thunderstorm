/**
 * Frontend module for handling messaging functionality in the Thunderstorm framework.
 * Provides message creation and management capabilities.
 */
import { ModuleFE_BaseApi } from "@nu-art/thunder-db-api-frontend/index";
import { DispatcherDef, ThunderDispatcherV3 } from '@nu-art/thunder-db-api-frontend';
import { DBDef_message, DBProto_Message, MessageType_Text } from '@nu-art/ts-messaging-shared';
/**
 * Type definition for the message dispatcher
 * Handles updates to messages in the system
 */
export type DispatcherType_Message = DispatcherDef<DBProto_Message, `__onMessagesUpdated`>;
/**
 * Dispatcher instance for handling message updates
 */
export const dispatch_onMessagesUpdated = new ThunderDispatcherV3<DispatcherType_Message>('__onMessagesUpdated');
/**
 * Frontend module class for handling messages
 * Extends the base API module with message-specific functionality
 */
export class ModuleFE_Message_Class extends ModuleFE_BaseApi<DBProto_Message> {
    /**
     * Initializes the message module with message definition and dispatcher
     */
    constructor() {
        super(DBDef_message, dispatch_onMessagesUpdated);
    }
    /**
     * Creates a new text message in the specified topic
     *
     * @param topicId - The ID of the topic to create the message in
     * @param msg - The text content of the message
     * @returns Promise that resolves when message is created
     */
    async createMessage(topicId: string, msg: string) {
        const newMessage = { type: MessageType_Text, topicId, text: msg };
        await this.v1.upsert(newMessage as DBProto_Message['preDbType']).executeSync();
    }
}
/**
 * Singleton instance of the frontend message module
 */
export const ModuleFE_Message = new ModuleFE_Message_Class();
