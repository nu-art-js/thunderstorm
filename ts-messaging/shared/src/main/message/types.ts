/**
 * Types and interfaces for the messaging system: message types, DB schemas, UI representations.
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const Message_DbKey = 'messages';
type DBKey = typeof Message_DbKey;

type VersionTypes_Message = { '1.0.0': DB_Message };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Message>;
type UniqueKeys = '_id';
type GeneratedKeys = '_auditorId';
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_Message, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>;

export const MessageType_Text = 'text' as const;
export const MessageType_Image = 'image' as const;
export const MessageType_Video = 'video' as const;

export type MessageTypes_DataMap = {
	text: { text: string };
	image: { url: string };
	video: Record<string, never>;
};

export type MessageType = keyof MessageTypes_DataMap;

export type BaseMessage = {
	topicId: string;
};

export type DB_Message_Text = BaseMessage & { type: typeof MessageType_Text; text: string };
export type DB_Message_Image = BaseMessage & { type: typeof MessageType_Image; url: string };
export type DB_Message_Video = BaseMessage & { type: typeof MessageType_Video };
export type MessageContent = DB_Message_Text | DB_Message_Image | DB_Message_Video;

export type DB_Message = DB_Object<DBKey> & { _auditorId?: string } & MessageContent;

export type DatabaseDef_Message = DB_Prototype<Proto>;
export type UI_Message = DatabaseDef_Message['uiType'];
