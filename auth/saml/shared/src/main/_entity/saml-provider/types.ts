import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const SamlProvider_DbKey = 'saml--providers';
type DBKey = typeof SamlProvider_DbKey;

type VersionTypes = { '1.0.0': DB_SamlProvider };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = 'domain';
type GeneratedKeys = 'lastMetadataFetchAt' | 'metadataFetchError';
type Dependencies = {};

export type DB_SamlProvider = DB_Object<DBKey> & {
	domain: string;
	label: string;
	enabled: boolean;
	metadataUrl: string;
	idpEntityId: string;
	ssoLoginUrl: string;
	ssoLogoutUrl?: string;
	certificates: string[];
	lastMetadataFetchAt?: number;
	metadataFetchError?: string;
};

export type DatabaseDef_SamlProvider = DB_Prototype<DB_ProtoSeed<DB_SamlProvider, DBKey, GeneratedKeys, Versions, UniqueKeys, Dependencies>>;
export type UI_SamlProvider = DatabaseDef_SamlProvider['uiType'];
