import {AuditableV2, DB_Object, DBProto, Proto_DB_Object, UniqueId, VersionsDeclaration} from '@nu-art/ts-common';

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
export const MessageType_Text = 'text' as const;
export const MessageType_Image = 'image' as const;
export const MessageType_Video = 'video' as const;

export type DBProto_Message = DBProto<Proto>;

export type UI_Message = DBProto_Message['uiType'];

export type MessageTypes_DataMap = {
	text: { text: string }
	image: { url: string }
	video: {}
}
export type MessageType = keyof MessageTypes_DataMap
export type BaseMessage = {
	topicId: UniqueId
}
export type DB_Message_Text = BaseMessage & { type: typeof MessageType_Text, text: string };
export type DB_Message_Image = BaseMessage & { type: typeof MessageType_Image, url: string };
export type DB_Message_Video = BaseMessage & { type: typeof MessageType_Video };
export type MessageContent = DB_Message_Text | DB_Message_Image | DB_Message_Video;

export type DB_Message = DB_Object & AuditableV2 & MessageContent