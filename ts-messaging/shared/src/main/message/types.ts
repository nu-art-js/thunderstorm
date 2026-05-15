import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';
import {UniqueId} from '@nu-art/ts-common';

export const Message_DbKey = 'messages';
type DBKey = typeof Message_DbKey;

type VersionTypes_Message = { '1.0.0': DB_Message };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_Message>;
type UniqueKeys = '_id';
type GeneratedKeys = '_auditorId';
type Dependencies = {};
type Proto = DB_ProtoSeed<DB_Message, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>;

export type AssetRef = {
	assetId: string;
};

export type DB_Message = DB_Object<DBKey> & {
	topicId: UniqueId;
	parentMessageId?: UniqueId;
	text?: string;
	attachments?: AssetRef[];
	_auditorId: string;
};

export type DatabaseDef_Message = DB_Prototype<Proto>;
export type UI_Message = DatabaseDef_Message['uiType'];
