import {createServer, IncomingMessage, Server, ServerResponse} from 'http';
import {URL} from 'url';
import {ExportIndexCache} from './ExportIndexCache.js';
import {ProjectUnit} from '../units/base/ProjectUnit.js';
import {Unit_TypescriptLib} from '../units/implementations/Unit_TypescriptLib.js';
import {Logger} from '@nu-art/ts-common';

type PackageInfo = {
	name: string;
	root: string;
};

export class IndicesMcpServer extends Logger {
	private server?: Server;
	private port: number;
	private projectRoot: string;
	private packages: ProjectUnit[];

	constructor(port: number, projectRoot: string, packages: ProjectUnit[]) {
		super();
		this.port = port;
		this.projectRoot = projectRoot;
		this.packages = packages;
	}

	async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.server = createServer((req, res) => this.handleRequest(req, res));

			this.server.listen(this.port, () => {
				this.logInfo(`Export Indices MCP Server started on port ${this.port}`);
				this.logInfo(`Available packages: ${this.packages.map(p => p.config.key).join(', ')}`);
				resolve();
			});

			this.server.on('error', (error: NodeJS.ErrnoException) => {
				if (error.code === 'EADDRINUSE') {
					this.logError(`Port ${this.port} is already in use`);
					reject(new Error(`Port ${this.port} is already in use`));
				} else {
					this.logError('Server error:', error);
					reject(error);
				}
			});
		});
	}

	async stop(): Promise<void> {
		return new Promise((resolve) => {
			if (!this.server) {
				resolve();
				return;
			}

			this.server.close(() => {
				this.logInfo('Export Indices MCP Server stopped');
				resolve();
			});
		});
	}

	private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
		try {
			const url = new URL(req.url || '/', `http://${req.headers.host}`);
			const path = url.pathname;
			const method = req.method;

			// Set CORS headers
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
			res.setHeader('Content-Type', 'application/json');

			if (method === 'OPTIONS') {
				res.writeHead(200);
				res.end();
				return;
			}

			if (method !== 'GET') {
				this.sendError(res, 405, 'Method not allowed');
				return;
			}

			// Route handling
			if (path === '/health') {
				this.handleHealth(res);
			} else if (path === '/packages') {
				await this.handlePackages(res);
			} else if (path.startsWith('/packages/')) {
				await this.handlePackageRoutes(path, res);
			} else {
				this.sendError(res, 404, 'Not found');
			}
		} catch (error: any) {
			this.logError('Request handling error:', error);
			this.sendError(res, 500, error.message || 'Internal server error');
		}
	}

	private handleHealth(res: ServerResponse): void {
		this.sendJson(res, {status: 'ok', service: 'Export Indices MCP Server'});
	}

	private async handlePackages(res: ServerResponse): Promise<void> {
		const packages: PackageInfo[] = this.packages
			.filter(unit => unit.isInstanceOf(Unit_TypescriptLib))
			.map(unit => ({
				name: unit.config.key,
				root: unit.config.fullPath
			}));

		this.sendJson(res, {packages});
	}

	private async handlePackageRoutes(path: string, res: ServerResponse): Promise<void> {
		// Extract package name and remaining path
		// Path format: /packages/:packageName/...
		const pathParts = path.split('/').filter(p => p);
		if (pathParts.length < 2 || pathParts[0] !== 'packages') {
			this.sendError(res, 404, 'Invalid path');
			return;
		}

		const packageName = decodeURIComponent(pathParts[1]);
		const packageUnit = this.packages.find(p => p.config.key === packageName);

		if (!packageUnit || !packageUnit.isInstanceOf(Unit_TypescriptLib)) {
			this.sendError(res, 404, `Package '${packageName}' not found`);
			return;
		}

		const packageRoot = packageUnit.config.fullPath;
		const remainingPath = pathParts.slice(2).join('/');

		if (remainingPath === 'exports') {
			await this.handleGetAllExports(packageName, packageRoot, res);
		} else if (remainingPath.startsWith('exports/by-name/')) {
			const symbolName = decodeURIComponent(remainingPath.replace('exports/by-name/', ''));
			await this.handleGetByName(packageName, packageRoot, symbolName, res);
		} else if (remainingPath.startsWith('exports/by-file/')) {
			const filePath = decodeURIComponent(remainingPath.replace('exports/by-file/', ''));
			await this.handleGetByFile(packageName, packageRoot, filePath, res);
		} else if (remainingPath.startsWith('exports/by-type/')) {
			const symbolType = decodeURIComponent(remainingPath.replace('exports/by-type/', ''));
			await this.handleGetByType(packageName, packageRoot, symbolType, res);
		} else if (remainingPath === 'stale') {
			await this.handleStale(packageName, packageRoot, res);
		} else {
			this.sendError(res, 404, 'Not found');
		}
	}

	private async handleGetAllExports(packageName: string, packageRoot: string, res: ServerResponse): Promise<void> {
		try {
			const exports = await ExportIndexCache.getAll(this.projectRoot, packageRoot, packageName);
			this.sendJson(res, {package: packageName, exports});
		} catch (error: any) {
			if (error.message?.includes('Index file not found')) {
				this.sendError(res, 404, `Indices not found for package '${packageName}'. Run 'bai --map-exports' to generate indices.`);
			} else {
				this.sendError(res, 500, error.message || 'Failed to get exports');
			}
		}
	}

	private async handleGetByName(packageName: string, packageRoot: string, symbolName: string, res: ServerResponse): Promise<void> {
		try {
			const symbol = await ExportIndexCache.getByName(this.projectRoot, packageRoot, packageName, symbolName);
			if (!symbol) {
				this.sendError(res, 404, `Symbol '${symbolName}' not found in package '${packageName}'`);
				return;
			}
			this.sendJson(res, {package: packageName, symbol});
		} catch (error: any) {
			if (error.message?.includes('Index file not found')) {
				this.sendError(res, 404, `Indices not found for package '${packageName}'. Run 'bai --map-exports' to generate indices.`);
			} else {
				this.sendError(res, 500, error.message || 'Failed to get symbol');
			}
		}
	}

	private async handleGetByFile(packageName: string, packageRoot: string, filePath: string, res: ServerResponse): Promise<void> {
		try {
			const exports = await ExportIndexCache.getByFile(this.projectRoot, packageRoot, packageName, filePath);
			this.sendJson(res, {package: packageName, filePath, exports});
		} catch (error: any) {
			if (error.message?.includes('Index file not found')) {
				this.sendError(res, 404, `Indices not found for package '${packageName}'. Run 'bai --map-exports' to generate indices.`);
			} else {
				this.sendError(res, 500, error.message || 'Failed to get exports by file');
			}
		}
	}

	private async handleGetByType(packageName: string, packageRoot: string, symbolType: string, res: ServerResponse): Promise<void> {
		try {
			const exports = await ExportIndexCache.getByType(this.projectRoot, packageRoot, packageName, symbolType);
			this.sendJson(res, {package: packageName, symbolType, exports});
		} catch (error: any) {
			if (error.message?.includes('Index file not found')) {
				this.sendError(res, 404, `Indices not found for package '${packageName}'. Run 'bai --map-exports' to generate indices.`);
			} else {
				this.sendError(res, 500, error.message || 'Failed to get exports by type');
			}
		}
	}

	private async handleStale(packageName: string, packageRoot: string, res: ServerResponse): Promise<void> {
		try {
			const stale = await ExportIndexCache.isStale(this.projectRoot, packageRoot, packageName);
			this.sendJson(res, {
				package: packageName,
				stale,
				message: stale
					? "Source files are newer than index files. Run 'bai --map-exports' to regenerate."
					: 'Indices are up to date.'
			});
		} catch (error: any) {
			this.sendError(res, 500, error.message || 'Failed to check stale status');
		}
	}

	private sendJson(res: ServerResponse, data: any): void {
		res.writeHead(200);
		res.end(JSON.stringify(data, null, 2));
	}

	private sendError(res: ServerResponse, statusCode: number, message: string): void {
		res.writeHead(statusCode);
		res.end(JSON.stringify({error: message}, null, 2));
	}
}

