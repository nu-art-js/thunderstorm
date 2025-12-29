import {TypedMap} from '@nu-art/ts-common';

/**
 * TypeScript compiler options type based on tsconfig.json schema
 */
export type TsConfigCompilerOptions = {
	module?: string;
	moduleResolution?: string;
	target?: string;
	jsx?: string;
	allowJs?: boolean;
	lib?: string[];
	noEmit?: boolean;
	sourceMap?: boolean;
	sourceRoot?: string;
	declaration?: boolean;
	resolveJsonModule?: boolean;
	esModuleInterop?: boolean;
	experimentalDecorators?: boolean;
	allowSyntheticDefaultImports?: boolean;
	noUnusedLocals?: boolean;
	strict?: boolean;
	paths?: TypedMap<string[]>;
	baseUrl?: string;
	rootDir?: string;
	outDir?: string;
	include?: string[];
	exclude?: string[];
	extends?: string;
	compilerOptions?: TsConfigCompilerOptions;
	[key: string]: any; // Allow additional properties
};

/**
 * Full TypeScript configuration type
 */
export type TsConfig = {
	compilerOptions?: TsConfigCompilerOptions;
	include?: string[];
	exclude?: string[];
	extends?: string;
	[key: string]: any; // Allow additional properties
};
