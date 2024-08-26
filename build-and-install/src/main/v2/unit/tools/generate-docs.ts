import ts from 'typescript';
import {TS_Object, TypedMap} from '@nu-art/ts-common';


export type OpenAPIPaths = {
	[path: string]: {
		[method: string]: {
			tags?: string[]
			summary: string;
			requestBody?: TS_Object;
			responses: TS_Object;
		};
	};
}

const possibleRoots = ['_v1', 'vv1', '__v1', '__vv1'];

function extractComponent(key: string, propType: ts.Type, components: TypedMap<any>, checker: ts.TypeChecker): any {
	// Handle literal types (string, number, boolean)
	if (propType.isStringLiteral() || propType.isNumberLiteral()) {
		const type = checker.typeToString(propType);
		return {
			type,
			description: `${key} is a literal of type ${type}`,
		};
	}

	// Handle boolean type
	if (propType.flags & ts.TypeFlags.Boolean) {
		return {
			type: 'boolean',
			description: `${key} is of boolean type`,
		};
	}

	if (propType.getFlags() & ts.TypeFlags.Object && (propType as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
		const referenceType = propType as ts.TypeReference;
		if (referenceType.target.getSymbol()?.getName() === 'Array') {
			const elementType = referenceType.typeArguments?.[0];
			if (elementType) {
				return {
					type: 'array',
					items: extractComponent(`${key}Item`, elementType, components, checker),
					description: `${key} is an array of ${checker.typeToString(elementType)}`,
				};
			}
			return {
				type: 'array',
				items: {type: 'object'}, // Fallback if elementType is not defined
				description: `${key} is an array`,
			};
		}
	}

	// Handle object types with properties, but limit to a single level of recursion
	if (propType.getFlags() & ts.TypeFlags.Object) {
		const objectProperties = checker.getPropertiesOfType(propType);
		const properties: any = {};

		objectProperties.forEach((prop) => {
			const propKey = prop.name;
			const propSymbol = checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);

			// For objects, we only include the first level of properties without further recursion
			if (propSymbol.getFlags() & ts.TypeFlags.Object) {
				properties[propKey] = {
					type: checker.typeToString(propSymbol),
					description: `${propKey} is an object of type ${checker.typeToString(propSymbol)}`,
				};
			} else {
				properties[propKey] = extractComponent(propKey, propSymbol, components, checker);
			}
		});

		return {
			type: 'object',
			properties,
			description: `${key} is an object with limited property depth`,
		};
	}

	// Default case for other types
	return {
		type: checker.typeToString(propType),
		description: `${key} is of type ${checker.typeToString(propType)}`,
	};
}

function extractTypeStructure(type: ts.Type, checker: ts.TypeChecker, components: TypedMap<any>): TS_Object {
	const structure: any = {};

	checker.getPropertiesOfType(type).forEach(prop => {
		const key = prop.name;
		const propType = checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);
		components.schemas[key] = extractComponent(key, propType, components, checker);
		structure[key] = {$ref: `#/components/schemas/${key}`};
	});

	return structure;
}

function parseApiStructType(apiStructType: ts.Type, checker: ts.TypeChecker, initializer: ts.ObjectLiteralExpression, components: TypedMap<any>): OpenAPIPaths {
	const paths: OpenAPIPaths = {};

	const properties = checker.getPropertiesOfType(apiStructType);
	properties.forEach(prop => {
		if (possibleRoots.includes(prop.name)) {
			const propType = checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);

			// Handle the nested API definitions inside 'vv1'
			const nestedProperties = checker.getPropertiesOfType(propType);
			nestedProperties.forEach(nestedProp => {
				const nestedPropType = checker.getTypeOfSymbolAtLocation(nestedProp, nestedProp.valueDeclaration!);
				const typeArguments = nestedPropType.aliasTypeArguments;

				if (typeArguments && typeArguments.length >= 2) {
					const responseType = typeArguments[0];
					const requestType = typeArguments[1];

					const method = nestedPropType.aliasSymbol?.name.startsWith('QueryApi') ? 'get' : 'post';

					// Extract the path from the initializer
					const path = getPathFromInitializer(initializer, nestedProp.name);

					if (path) {
						paths[path] = {
							[method]: {
								summary: nestedProp.name,
								requestBody: {
									content: {
										'application/json': {
											schema: {
												type: 'object',
												properties: extractTypeStructure(requestType, checker, components),
											},
										},
									},
								},
								responses: {
									'200': {
										description: 'Successful response',
										content: {
											'application/json': {
												schema: {
													type: 'object',
													properties: extractTypeStructure(responseType, checker, components),
												},
											},
										},
									},
								},
							},
						};
					}
				}
			});
		}
	});

	return paths;
}

function analyzeInitializerWithApiStruct(initializer: ts.ObjectLiteralExpression, paths: OpenAPIPaths): void {
	initializer.properties.forEach(prop => {
		if (ts.isPropertyAssignment(prop)) {
			const key = prop.name.getText();

			if (possibleRoots.includes(key) && ts.isObjectLiteralExpression(prop.initializer)) {
				const vv1Object = prop.initializer;

				vv1Object.properties.forEach(nestedProp => {
					if (ts.isPropertyAssignment(nestedProp)) {
						const nestedKey = nestedProp.name.getText();
						const value = nestedProp.initializer;

						if (ts.isObjectLiteralExpression(value)) {
							const path = getPathFromInitializer(value, value.getText());
							if (path && paths[path]) {
								paths[path].get ? paths[path].get.summary = nestedKey : paths[path].post.summary = nestedKey;
							}
						}
					}
				});
			}
		}
	});
}

function getPathFromInitializer(initializer: ts.ObjectLiteralExpression, apiName: string): string | undefined {
	let foundPath: string | undefined = undefined;

	initializer.properties.forEach(prop => {
		if (ts.isPropertyAssignment(prop) && possibleRoots.includes(prop.name.getText()) && ts.isObjectLiteralExpression(prop.initializer)) {
			prop.initializer.properties.forEach(nestedProp => {
				if (ts.isPropertyAssignment(nestedProp) && nestedProp.name.getText() === apiName) {
					if (ts.isObjectLiteralExpression(nestedProp.initializer)) {
						const pathProperty = nestedProp.initializer.properties.find(p =>
							ts.isPropertyAssignment(p) && p.name.getText() === 'path'
						);
						// @ts-ignore
						if (pathProperty && ts.isStringLiteral(pathProperty.initializer)) {
							// @ts-ignore
							foundPath = pathProperty.initializer.text;
						}
					}
				}
			});
		}
	});

	return foundPath;
}

function resolveUnderlyingType(type: ts.Type): ts.Type {
	//TODO: think again about this one
	// eslint-disable-next-line no-constant-condition
	while (true) {
		if (type.aliasSymbol?.escapedName === 'ApiDefResolver' || type.aliasSymbol?.escapedName === 'ApiDefRouter') {
			const typeArguments = type.aliasTypeArguments || [];
			if (typeArguments.length > 0) {
				type = typeArguments[0];
			} else {
				break;
			}
		} else if (type.symbol && type.symbol.getName() === 'ApiStruct') {
			break;
		} else if ((type as ts.TypeReference).target) {
			type = (type as ts.TypeReference).target;
		} else {
			break;
		}
	}
	return type;
}

export function extractApiPaths(fileName: string): { paths: OpenAPIPaths, components: TypedMap<any> } {
	const program = ts.createProgram([fileName], {});
	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(fileName);

	if (!sourceFile) {
		console.error('Source file not found:', fileName);
		return {paths: {}, components: {}};
	}

	const openApiSpec: OpenAPIPaths = {};
	const components: TypedMap<any> = {schemas: {}};

	const visit = (node: ts.Node) => {
		if (ts.isVariableDeclaration(node)) {
			const variableType = checker.getTypeAtLocation(node);
			const resolvedType = resolveUnderlyingType(variableType);

			if (resolvedType.aliasSymbol) {
				// Parse the ApiStruct type to generate OpenAPI paths
				const initializer = node.initializer;
				const apiStructPaths = parseApiStructType(resolvedType, checker, initializer as ts.ObjectLiteralExpression, components);

				if (initializer && ts.isObjectLiteralExpression(initializer)) {
					// Map initializer keys to OpenAPI paths
					analyzeInitializerWithApiStruct(initializer, apiStructPaths);
				}

				Object.assign(openApiSpec, apiStructPaths);
			}
		}
		ts.forEachChild(node, visit);
	};

	ts.forEachChild(sourceFile, visit);

	return {paths: openApiSpec, components};
}