import * as ts from 'typescript';
import {resolve as pathResolve} from 'path';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {__stringify} from '@nu-art/ts-common';
import {CONST_TS_CONFIG} from '../config/consts.js';
import {existsSync, readFileSync} from 'fs';

export type ExportSymbol = {
	name: string;
	filePath: string;
	line: number;
	symbolType: 'function' | 'class' | 'interface' | 'type' | 'enum' | 'variable' | 'constant' | 'default' | 're-export';
	signature: string | null;
	typeInfo: string | null;
	genericSignature: string | null;
	parentClass: string | null;
	interfaces: string[];
};

export type ExportError = {
	level: 'package' | 'folder' | 'file' | 'symbol';
	path: string;
	error: string;
	stack?: string;
	timestamp: string;
	retryable: boolean;
	context?: Record<string, any>;
};

type ErrorFile = {
	package: string;
	timestamp: string;
	errors: ExportError[];
};

export class ExportMapper {
	static getIndexPath(projectRoot: string, packageName: string): string {
		return pathResolve(projectRoot, '.trash', 'indices', packageName);
	}

	static async generateIndexFiles(projectRoot: string, packageName: string, exports: ExportSymbol[]): Promise<void> {
		const indexPath = ExportMapper.getIndexPath(projectRoot, packageName);
		
		// Ensure directory exists
		await FileSystemUtils.folder.create(indexPath);

		// Generate by-name index
		const byName: Record<string, ExportSymbol> = {};
		for (const exp of exports) {
			byName[exp.name] = exp;
		}
		const byNamePath = pathResolve(indexPath, '_export-index-by-name.json');
		await FileSystemUtils.file.write(byNamePath, __stringify(byName, true));

		// Generate by-file index
		const byFile: Record<string, ExportSymbol[]> = {};
		for (const exp of exports) {
			if (!byFile[exp.filePath]) {
				byFile[exp.filePath] = [];
			}
			byFile[exp.filePath].push(exp);
		}
		const byFilePath = pathResolve(indexPath, '_export-index-by-file.json');
		await FileSystemUtils.file.write(byFilePath, __stringify(byFile, true));

		// Generate by-type index
		const byType: Record<string, ExportSymbol[]> = {};
		for (const exp of exports) {
			if (!byType[exp.symbolType]) {
				byType[exp.symbolType] = [];
			}
			byType[exp.symbolType].push(exp);
		}
		const byTypePath = pathResolve(indexPath, '_export-index-by-type.json');
		await FileSystemUtils.file.write(byTypePath, __stringify(byType, true));
	}

	static async mapExports(projectRoot: string, packageRoot: string, packageName: string, sourceFiles: string[], retryErrors?: ExportError[]): Promise<{ exports: ExportSymbol[], errors: ExportError[] }> {
		const errors: ExportError[] = [];
		const exports: ExportSymbol[] = [];

		// Create error map for quick lookup
		const errorMap = new Map<string, ExportError>();
		if (retryErrors) {
			for (const error of retryErrors) {
				errorMap.set(error.path, error);
			}
		}

		// Package level: Create TypeScript program
		let program: ts.Program;
		try {
			program = ExportMapper.createProgram(sourceFiles, packageRoot);
		} catch (error: any) {
			errors.push({
				level: 'package',
				path: packageRoot,
				error: error.message || String(error),
				stack: error.stack,
				timestamp: new Date().toISOString(),
				retryable: true,
				context: { operation: 'createProgram' }
			});
			return { exports, errors };
		}

		const checker = program.getTypeChecker();

		// File level: Process each source file
		for (const sourceFile of program.getSourceFiles()) {
			// Skip node_modules and declaration files
			if (sourceFile.fileName.includes('node_modules') || sourceFile.fileName.endsWith('.d.ts')) {
				continue;
			}

			// Only process files in src/main
			if (!sourceFile.fileName.includes('/src/main/')) {
				continue;
			}

			const filePath = ExportMapper.getRelativePath(sourceFile.fileName, packageRoot);
			const fileErrorKey = filePath;

			// Check if this file had a previous non-retryable error - skip those
			// If retryable error exists, we'll process it (retry)
			// If no previous error, process normally
			if (errorMap.has(fileErrorKey)) {
				const prevError = errorMap.get(fileErrorKey)!;
				if (!prevError.retryable) {
					// Skip non-retryable errors
					continue;
				}
				// If retryable, continue to process (retry it)
			}

			try {
				const fileExports = ExportMapper.extractExportsFromFile(sourceFile, checker, packageRoot, errors, errorMap);
				exports.push(...fileExports);

				// Remove from error map if successfully processed
				if (errorMap.has(fileErrorKey)) {
					errorMap.delete(fileErrorKey);
				}
			} catch (error: any) {
				errors.push({
					level: 'file',
					path: filePath,
					error: error.message || String(error),
					stack: error.stack,
					timestamp: new Date().toISOString(),
					retryable: true,
					context: { fileName: sourceFile.fileName }
				});
			}
		}

		// Add any remaining errors from retry that weren't resolved
		for (const error of errorMap.values()) {
			errors.push(error);
		}

		return { exports, errors };
	}

	static createProgram(sourceFiles: string[], packageRoot: string): ts.Program {
		const tsConfigPath = pathResolve(packageRoot, 'src/main', CONST_TS_CONFIG);
		let compilerOptions: ts.CompilerOptions = {};

		// Try to load tsconfig.json synchronously
		if (existsSync(tsConfigPath)) {
			try {
				const configFileText = readFileSync(tsConfigPath, 'utf8');
				const configFile = ts.parseConfigFileTextToJson(tsConfigPath, configFileText);
				if (configFile.config) {
					const parsedConfig = ts.parseJsonConfigFileContent(
						configFile.config,
						ts.sys,
						pathResolve(packageRoot, 'src/main')
					);
					compilerOptions = parsedConfig.options;
				}
			} catch (error) {
				// Use default options if config loading fails
			}
		}

		// Default compiler options
		compilerOptions = {
			...compilerOptions,
			allowJs: true,
			skipLibCheck: true,
			noEmit: true,
		};

		return ts.createProgram(sourceFiles, compilerOptions);
	}

	static extractExportsFromFile(sourceFile: ts.SourceFile, checker: ts.TypeChecker, packageRoot: string, errors: ExportError[], errorMap?: Map<string, ExportError>): ExportSymbol[] {
		const exports: ExportSymbol[] = [];
		const filePath = ExportMapper.getRelativePath(sourceFile.fileName, packageRoot);

		const visit = (node: ts.Node) => {
			// Check for export declarations
			if (ts.isVariableStatement(node) && ExportMapper.hasExportModifier(node)) {
				// Export variable statements
				for (const declaration of node.declarationList.declarations) {
					if (ts.isIdentifier(declaration.name)) {
						const symbol = ExportMapper.extractSymbolMetadata(
							node,
							sourceFile,
							checker,
							packageRoot,
							errors,
							declaration.name.text,
							'variable',
							errorMap
						);
						if (symbol) exports.push(symbol);
					}
				}
			} else if (ts.isFunctionDeclaration(node) && ExportMapper.hasExportModifier(node) && node.name) {
				// Export function
				const symbol = ExportMapper.extractSymbolMetadata(
					node,
					sourceFile,
					checker,
					packageRoot,
					errors,
					node.name.text,
					'function',
					errorMap
				);
				if (symbol) exports.push(symbol);
			} else if (ts.isClassDeclaration(node) && ExportMapper.hasExportModifier(node) && node.name) {
				// Export class
				const symbol = ExportMapper.extractSymbolMetadata(
					node,
					sourceFile,
					checker,
					packageRoot,
					errors,
					node.name.text,
					'class',
					errorMap
				);
				if (symbol) exports.push(symbol);
			} else if (ts.isInterfaceDeclaration(node) && ExportMapper.hasExportModifier(node)) {
				// Export interface
				const symbol = ExportMapper.extractSymbolMetadata(
					node,
					sourceFile,
					checker,
					packageRoot,
					errors,
					node.name.text,
					'interface',
					errorMap
				);
				if (symbol) exports.push(symbol);
			} else if (ts.isTypeAliasDeclaration(node) && ExportMapper.hasExportModifier(node)) {
				// Export type
				const symbol = ExportMapper.extractSymbolMetadata(
					node,
					sourceFile,
					checker,
					packageRoot,
					errors,
					node.name.text,
					'type',
					errorMap
				);
				if (symbol) exports.push(symbol);
			} else if (ts.isEnumDeclaration(node) && ExportMapper.hasExportModifier(node)) {
				// Export enum
				const symbol = ExportMapper.extractSymbolMetadata(
					node,
					sourceFile,
					checker,
					packageRoot,
					errors,
					node.name.text,
					'enum',
					errorMap
				);
				if (symbol) exports.push(symbol);
			} else if (ts.isExportAssignment(node)) {
				// Default export
				const symbol = ExportMapper.extractSymbolMetadata(
					node,
					sourceFile,
					checker,
					packageRoot,
					errors,
					'default',
					'default',
					errorMap
				);
				if (symbol) exports.push(symbol);
			} else if (ts.isExportDeclaration(node)) {
				// Re-export
				if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
					const symbol: ExportSymbol = {
						name: node.moduleSpecifier.text,
						filePath,
						line: ExportMapper.getLineNumber(sourceFile, node),
						symbolType: 're-export',
						signature: null,
						typeInfo: node.moduleSpecifier.text,
						genericSignature: null,
						parentClass: null,
						interfaces: []
					};
					exports.push(symbol);
				}
			}

			ts.forEachChild(node, visit);
		};

		visit(sourceFile);
		return exports;
	}

	static extractSymbolMetadata(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		checker: ts.TypeChecker,
		packageRoot: string,
		errors: ExportError[],
		name: string,
		symbolType: ExportSymbol['symbolType'],
		errorMap?: Map<string, ExportError>
	): ExportSymbol | null {
		const filePath = ExportMapper.getRelativePath(sourceFile.fileName, packageRoot);
		const symbolErrorKey = `${filePath}::${name}`;

		// Check if this symbol had a previous non-retryable error
		if (errorMap?.has(symbolErrorKey)) {
			const prevError = errorMap.get(symbolErrorKey)!;
			if (!prevError.retryable) {
				// Skip non-retryable symbol errors
				return null;
			}
		}

		try {
			const line = ExportMapper.getLineNumber(sourceFile, node);
			let signature: string | null = null;
			let typeInfo: string | null = null;
			let genericSignature: string | null = null;
			let parentClass: string | null = null;
			let interfaces: string[] = [];

			// Extract generic signature
			try {
				genericSignature = ExportMapper.extractGenericSignatures(node, checker);
			} catch (error: any) {
				errors.push({
					level: 'symbol',
					path: symbolErrorKey,
					error: `Failed to extract generic signature: ${error.message || String(error)}`,
					stack: error.stack,
					timestamp: new Date().toISOString(),
					retryable: true,
					context: { symbolName: name, symbolType, operation: 'extractGenericSignatures' }
				});
			}

			// Extract signature and type info based on symbol type
			if (symbolType === 'function' && ts.isFunctionDeclaration(node)) {
				try {
					const symbol = checker.getSymbolAtLocation(node);
					if (symbol) {
						const type = checker.getTypeOfSymbolAtLocation(symbol, node);
						const signatures = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
						if (signatures.length > 0) {
							signature = checker.signatureToString(signatures[0], node);
						}
					}
				} catch (error: any) {
					errors.push({
						level: 'symbol',
						path: symbolErrorKey,
						error: `Failed to extract function signature: ${error.message || String(error)}`,
						stack: error.stack,
						timestamp: new Date().toISOString(),
						retryable: true,
						context: { symbolName: name, symbolType, operation: 'extractFunctionSignature' }
					});
				}
			} else if (symbolType === 'class' && ts.isClassDeclaration(node)) {
				try {
					// Extract class inheritance
					const inheritance = ExportMapper.extractClassInheritance(node, checker);
					parentClass = inheritance.parentClass;
					interfaces = inheritance.interfaces;

					// Build class signature
					const parts: string[] = [];
					parts.push('class', name);
					if (genericSignature) {
						parts[1] = `${name}${genericSignature}`;
					}
					if (parentClass) {
						parts.push('extends', parentClass);
					}
					if (interfaces.length > 0) {
						parts.push('implements', interfaces.join(', '));
					}
					signature = parts.join(' ');
				} catch (error: any) {
					errors.push({
						level: 'symbol',
						path: symbolErrorKey,
						error: `Failed to extract class metadata: ${error.message || String(error)}`,
						stack: error.stack,
						timestamp: new Date().toISOString(),
						retryable: true,
						context: { symbolName: name, symbolType, operation: 'extractClassMetadata' }
					});
				}
			} else if (symbolType === 'interface' && ts.isInterfaceDeclaration(node)) {
				try {
					const symbol = checker.getSymbolAtLocation(node);
					if (symbol) {
						const type = checker.getTypeOfSymbolAtLocation(symbol, node);
						typeInfo = checker.typeToString(type, node);
					}
				} catch (error: any) {
					errors.push({
						level: 'symbol',
						path: symbolErrorKey,
						error: `Failed to extract interface type info: ${error.message || String(error)}`,
						stack: error.stack,
						timestamp: new Date().toISOString(),
						retryable: true,
						context: { symbolName: name, symbolType, operation: 'extractInterfaceTypeInfo' }
					});
				}
			} else if (symbolType === 'type' && ts.isTypeAliasDeclaration(node)) {
				try {
					const symbol = checker.getSymbolAtLocation(node);
					if (symbol) {
						const type = checker.getTypeOfSymbolAtLocation(symbol, node);
						typeInfo = checker.typeToString(type, node);
					}
				} catch (error: any) {
					errors.push({
						level: 'symbol',
						path: symbolErrorKey,
						error: `Failed to extract type info: ${error.message || String(error)}`,
						stack: error.stack,
						timestamp: new Date().toISOString(),
						retryable: true,
						context: { symbolName: name, symbolType, operation: 'extractTypeInfo' }
					});
				}
			} else if (symbolType === 'variable' || symbolType === 'constant') {
				try {
					const symbol = checker.getSymbolAtLocation(node);
					if (symbol) {
						const type = checker.getTypeOfSymbolAtLocation(symbol, node);
						typeInfo = checker.typeToString(type, node);
					}
				} catch (error: any) {
					errors.push({
						level: 'symbol',
						path: symbolErrorKey,
						error: `Failed to extract variable type info: ${error.message || String(error)}`,
						stack: error.stack,
						timestamp: new Date().toISOString(),
						retryable: true,
						context: { symbolName: name, symbolType, operation: 'extractVariableTypeInfo' }
					});
				}
			}

			const symbol: ExportSymbol = {
				name,
				filePath,
				line,
				symbolType,
				signature,
				typeInfo,
				genericSignature,
				parentClass,
				interfaces
			};

			// Remove from error map if successfully processed (retry succeeded)
			if (errorMap?.has(symbolErrorKey)) {
				errorMap.delete(symbolErrorKey);
			}

			return symbol;
		} catch (error: any) {
			errors.push({
				level: 'symbol',
				path: symbolErrorKey,
				error: error.message || String(error),
				stack: error.stack,
				timestamp: new Date().toISOString(),
				retryable: true,
				context: { symbolName: name, symbolType }
			});
			return null;
		}
	}

	static extractGenericSignatures(node: ts.Node, checker: ts.TypeChecker): string | null {
		let typeParameters: ts.NodeArray<ts.TypeParameterDeclaration> | undefined;

		if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
			typeParameters = node.typeParameters;
		} else if (ts.isClassDeclaration(node)) {
			typeParameters = node.typeParameters;
		} else if (ts.isInterfaceDeclaration(node)) {
			typeParameters = node.typeParameters;
		} else if (ts.isTypeAliasDeclaration(node)) {
			typeParameters = node.typeParameters;
		}

		if (!typeParameters || typeParameters.length === 0) {
			return null;
		}

		const params: string[] = [];
		for (const param of typeParameters) {
			let paramStr = param.name.text;
			if (param.constraint) {
				paramStr += ` extends ${param.constraint.getText()}`;
			}
			if (param.default) {
				paramStr += ` = ${param.default.getText()}`;
			}
			params.push(paramStr);
		}

		return `<${params.join(', ')}>`;
	}

	static extractClassInheritance(node: ts.ClassDeclaration, checker: ts.TypeChecker): { parentClass: string | null, interfaces: string[] } {
		let parentClass: string | null = null;
		const interfaces: string[] = [];

		if (!node.heritageClauses) {
			return { parentClass, interfaces };
		}

		for (const clause of node.heritageClauses) {
			if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
				// Extends clause
				for (const type of clause.types) {
					try {
						const typeNode = checker.getTypeAtLocation(type);
						parentClass = checker.typeToString(typeNode, type);
					} catch (error) {
						// If type checking fails, use the text
						parentClass = type.getText();
					}
				}
			} else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
				// Implements clause
				for (const type of clause.types) {
					try {
						const typeNode = checker.getTypeAtLocation(type);
						interfaces.push(checker.typeToString(typeNode, type));
					} catch (error) {
						// If type checking fails, use the text
						interfaces.push(type.getText());
					}
				}
			}
		}

		return { parentClass, interfaces };
	}

	static hasExportModifier(node: ts.Node): boolean {
		return (ts.canHaveModifiers(node) && (ts.getModifiers(node)?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword) ?? false));
	}

	static getLineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
		const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		return line + 1; // Convert to 1-based line number
	}

	static getRelativePath(absolutePath: string, packageRoot: string): string {
		const relative = absolutePath.replace(packageRoot, '').replace(/^\//, '');
		return relative || absolutePath;
	}

	static async loadPreviousErrors(projectRoot: string, packageName: string): Promise<ExportError[] | null> {
		const indexPath = ExportMapper.getIndexPath(projectRoot, packageName);
		const errorFilePath = pathResolve(indexPath, '_export-errors.json');
		if (!await FileSystemUtils.file.exists(errorFilePath)) {
			return null;
		}

		try {
			const errorFile = await FileSystemUtils.file.read.json<ErrorFile>(errorFilePath);
			return errorFile.errors || [];
		} catch (error) {
			return null;
		}
	}

	static async writeErrors(projectRoot: string, packageName: string, errors: ExportError[]): Promise<void> {
		const indexPath = ExportMapper.getIndexPath(projectRoot, packageName);
		await FileSystemUtils.folder.create(indexPath);

		if (errors.length === 0) {
			// Remove error file if no errors
			const errorFilePath = pathResolve(indexPath, '_export-errors.json');
			if (await FileSystemUtils.file.exists(errorFilePath)) {
				await FileSystemUtils.file.delete(errorFilePath);
			}
			return;
		}

		const errorFile: ErrorFile = {
			package: packageName,
			timestamp: new Date().toISOString(),
			errors
		};

		const errorFilePath = pathResolve(indexPath, '_export-errors.json');
		await FileSystemUtils.file.write(errorFilePath, __stringify(errorFile, true));
	}

	static shouldRetryError(error: ExportError, retryErrors?: ExportError[]): boolean {
		if (!error.retryable) {
			return false;
		}
		if (!retryErrors || retryErrors.length === 0) {
			// If no retryErrors provided, don't retry (means we're not in retry mode)
			return false;
		}
		// Check if this error exists in retryErrors (meaning it should be retried)
		return retryErrors.some(e => e.path === error.path && e.level === error.level);
	}
}

