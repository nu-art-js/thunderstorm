import {resolve as pathResolve} from 'path';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {FilesCache} from '../core/FilesCache.js';
import {ExportSymbol} from './ExportMapper.js';
import {promises as fs} from 'fs';
import {glob} from 'node:fs/promises';

type CachedExportIndex = {
	exports: ExportSymbol[];
	byName: Map<string, ExportSymbol>;
	byFile: Map<string, ExportSymbol[]>;
	byType: Map<string, ExportSymbol[]>;
	indexMtime: number; // File modification time of _export-for-import.json
	sourceMtime: number; // Max mtime of all source files
	packageRoot: string;
	packageName: string;
	projectRoot: string;
};

const cache = new Map<string, CachedExportIndex>();

export const ExportIndexCache = {
	getIndexPath(projectRoot: string, packageName: string): string {
		return pathResolve(projectRoot, '.trash', 'indices', packageName);
	},

	async load(projectRoot: string, packageRoot: string, packageName: string): Promise<CachedExportIndex> {
		const cacheKey = packageRoot;
		const cached = cache.get(cacheKey);

		// Check if we need to reload based on index file mtime
		const indexPath = ExportIndexCache.getIndexPath(projectRoot, packageName);
		const indexFilePath = pathResolve(indexPath, '_export-for-import.json');

		if (!await FileSystemUtils.file.exists(indexFilePath)) {
			throw new Error(`Index file not found: ${indexFilePath}. Run 'bai --map-exports' to generate indices.`);
		}

		const indexStat = await fs.stat(indexFilePath);
		const currentIndexMtime = indexStat.mtimeMs;

		// If cached and mtime matches, return cached
		if (cached && cached.indexMtime === currentIndexMtime) {
			return cached;
		}

		// Load index files
		const exports = await FilesCache.load.json<ExportSymbol[]>(indexFilePath);
		const byNameData = await FilesCache.load.json<Record<string, ExportSymbol>>(pathResolve(indexPath, '_export-index-by-name.json'));
		const byFileData = await FilesCache.load.json<Record<string, ExportSymbol[]>>(pathResolve(indexPath, '_export-index-by-file.json'));
		const byTypeData = await FilesCache.load.json<Record<string, ExportSymbol[]>>(pathResolve(indexPath, '_export-index-by-type.json'));

		// Convert to Maps for faster lookups
		const byName = new Map<string, ExportSymbol>();
		for (const [name, symbol] of Object.entries(byNameData)) {
			byName.set(name, symbol);
		}

		const byFile = new Map<string, ExportSymbol[]>();
		for (const [filePath, symbols] of Object.entries(byFileData)) {
			byFile.set(filePath, symbols);
		}

		const byType = new Map<string, ExportSymbol[]>();
		for (const [type, symbols] of Object.entries(byTypeData)) {
			byType.set(type, symbols);
		}

		// Calculate max source file mtime
		const sourceMtime = await ExportIndexCache.calculateSourceMtime(packageRoot);

		const cachedIndex: CachedExportIndex = {
			exports,
			byName,
			byFile,
			byType,
			indexMtime: currentIndexMtime,
			sourceMtime,
			packageRoot,
			packageName,
			projectRoot
		};

		cache.set(cacheKey, cachedIndex);
		return cachedIndex;
	},

	async calculateSourceMtime(packageRoot: string): Promise<number> {
		const srcMainTs = `${packageRoot}/src/main/**/*.ts`;
		const srcMainTsx = `${packageRoot}/src/main/**/*.tsx`;

		let maxMtime = 0;

		try {
			for await (const file of glob(srcMainTs, {})) {
				const stat = await fs.stat(file);
				maxMtime = Math.max(maxMtime, stat.mtimeMs);
			}
			for await (const file of glob(srcMainTsx, {})) {
				const stat = await fs.stat(file);
				maxMtime = Math.max(maxMtime, stat.mtimeMs);
			}
		} catch (error) {
			// If source files don't exist, return 0
			return 0;
		}

		return maxMtime;
	},

	async isStale(projectRoot: string, packageRoot: string, packageName: string): Promise<boolean> {
		const indexPath = ExportIndexCache.getIndexPath(projectRoot, packageName);
		const indexFilePath = pathResolve(indexPath, '_export-for-import.json');

		if (!await FileSystemUtils.file.exists(indexFilePath)) {
			return true; // No index file means it's stale
		}

		const indexStat = await fs.stat(indexFilePath);
		const indexMtime = indexStat.mtimeMs;

		const sourceMtime = await ExportIndexCache.calculateSourceMtime(packageRoot);

		// Stale if any source file is newer than index file
		return sourceMtime > indexMtime;
	},

	async getByName(projectRoot: string, packageRoot: string, packageName: string, symbolName: string): Promise<ExportSymbol | null> {
		const cached = await ExportIndexCache.load(projectRoot, packageRoot, packageName);
		return cached.byName.get(symbolName) || null;
	},

	async getByFile(projectRoot: string, packageRoot: string, packageName: string, filePath: string): Promise<ExportSymbol[]> {
		const cached = await ExportIndexCache.load(projectRoot, packageRoot, packageName);
		return cached.byFile.get(filePath) || [];
	},

	async getByType(projectRoot: string, packageRoot: string, packageName: string, symbolType: string): Promise<ExportSymbol[]> {
		const cached = await ExportIndexCache.load(projectRoot, packageRoot, packageName);
		return cached.byType.get(symbolType) || [];
	},

	async getAll(projectRoot: string, packageRoot: string, packageName: string): Promise<ExportSymbol[]> {
		const cached = await ExportIndexCache.load(projectRoot, packageRoot, packageName);
		return cached.exports;
	},

	invalidate(projectRoot: string, packageRoot: string, packageName: string): void {
		const cacheKey = packageRoot;
		cache.delete(cacheKey);
	},

	clear(): void {
		cache.clear();
	}
};

