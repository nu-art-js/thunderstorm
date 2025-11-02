/**
 * @fileoverview Defines the types and interfaces for the messaging system.
 * This includes message types, database schemas, and UI representations.
 */

import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, UniqueId, VersionsDeclaration} from '@nu-art/ts-common';

/**
 * Version declaration for message types
 * Currently supports version 1.0.0
 */
type VersionTypes_Message = {
	'1.0.0': DB_Message
}
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Message>;
type Dependencies = {
//
}

type UniqueKeys = '_id';
type GeneratedProps = '_auditorId';
type Proto = Proto_DB_Object<DB_Message, 'messages', GeneratedProps, Versions, UniqueKeys, Dependencies>;
/** Constant representing a text message type */
export const MessageType_Text = 'text' as const;
/** Constant representing an image message type */
export const MessageType_Image = 'image' as const;
/** Constant representing a video message type */
export const MessageType_Video = 'video' as const;

export type DBProto_Message = DBProto<Proto>;

export type UI_Message = DBProto_Message['uiType'];

/**
 * Mapping of message types to their respective data structures
 */
export type MessageTypes_DataMap = {
	text: { text: string }
	image: { url: string }
	video: {}
}

/** Union type of all possible message types */
export type MessageType = keyof MessageTypes_DataMap

/**
 * Base interface for all message types
 * @property topicId - Unique identifier for the topic this message belongs to
 */
export type BaseMessage = {
	topicId: UniqueId
}
/** Database representation of a text message */
export type DB_Message_Text = BaseMessage & { type: typeof MessageType_Text, text: string };
/** Database representation of an image message */
export type DB_Message_Image = BaseMessage & { type: typeof MessageType_Image, url: string };
/** Database representation of a video message */
export type DB_Message_Video = BaseMessage & { type: typeof MessageType_Video };
/** Union type of all possible message content types */
export type MessageContent = DB_Message_Text | DB_Message_Image | DB_Message_Video;

/** Complete database message type including base DB object properties and audit information */
export type DB_Message = DB_Object & AuditableV2 & MessageContent