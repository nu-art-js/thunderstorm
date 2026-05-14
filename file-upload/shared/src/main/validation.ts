import {StorageFileMetadata} from './storage-adapter.js';
import {DB_Asset} from './types.js';


export type FileValidator = (metadata: StorageFileMetadata, asset: DB_Asset, fileBuffer: Buffer) => Promise<FileValidationResult | undefined>;

export type FileValidationResult = {
	ext: string;
	mime: string;
};

export type FileValidationConfig = {
	allowedMimeTypes?: string[];
	minSize?: number;
	maxSize?: number;
	validator?: FileValidator;
};
