import * as ts from 'typescript';


const resolvers: ((descriptor: any, typeNode: ts.TypeNode, checker: ts.TypeChecker) => any)[] = [
	(descriptor, typeNode, checker) => {
		if (!ts.isTypeLiteralNode(typeNode))
			return;

		descriptor.type = 'object';
		descriptor.members = [];
		typeNode.members.forEach(member => {
			if (ts.isPropertySignature(member) && member.name && member.type) {
				const memberDescriptor = {name: member.name.getText()};
				parseTypeV2(memberDescriptor, member.type, checker);
				descriptor.members.push(memberDescriptor);
			}
		});
	},
	(descriptor, typeNode, checker) => {
		if (!ts.isFunctionTypeNode(typeNode))
			return;

		descriptor.type = 'function';
		descriptor.parameters = [];
		typeNode.parameters.forEach(paramNode => {
			const paramDescriptor = {name: paramNode.name.getText()};
			parseTypeV2(paramDescriptor, paramNode.type !, checker);
			descriptor.parameters.push(paramDescriptor);
		});
		// Resolve the return type of the function
		descriptor.returnType = {};
		parseTypeV2(descriptor.returnType, typeNode.type!, checker);
	},
	(descriptor, typeNode, checker) => {
		const types = checker.getTypeFromTypeNode(typeNode).aliasTypeArguments;
		if (!types)
			return;

		descriptor.genericParams = [];
		types.forEach(genericType => {
			const paramDescriptor: any = {name: genericType.symbol.name};
			paramDescriptor.type = checker.symbolToEntityName(checker.getBaseConstraintOfType(genericType)!.aliasSymbol!, ts.SymbolFlags.Alias, undefined, undefined,)!
				.getText();

			// const constraintOfType = checker.getBaseConstraintOfType(genericType) ?? genericType;
			// parseTypeV2(paramDescriptor, checker.typeToTypeNode(constraintOfType, undefined, undefined)!, checker);

			descriptor.genericParams.push(paramDescriptor);
		});
	},

	(descriptor, typeNode, checker) => {
		if (descriptor.type !== undefined)
			return;

		// typeNode.typeName

		descriptor.type = checker.typeToString(checker.getTypeFromTypeNode(typeNode));
	},
	(descriptor, typeNode, checker) => {
		descriptor.typeLiteral = checker.typeToString(checker.getTypeFromTypeNode(typeNode));
	},
];

function parseTypeV2(descriptor: {}, typeNode: ts.TypeNode, checker: ts.TypeChecker): any {
	return resolvers.reduce((descriptor, resolver) => {
		resolver(descriptor, typeNode, checker);
		return descriptor;
	}, descriptor);
}

function collectTypes(sourceFile: ts.SourceFile): { [key: string]: ts.TypeNode } {
	const types: { [key: string]: ts.TypeNode } = {};

	const visit = (node: ts.Node) => {
		if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
			const typeName = node.name.text;
			let typeNode: ts.TypeNode | undefined;

			if (ts.isTypeAliasDeclaration(node)) {
				typeNode = node.type;
			} else if (ts.isInterfaceDeclaration(node)) {
				const members = node.members;
				typeNode = ts.factory.createTypeLiteralNode(members);
			}

			if (typeNode) {
				types[typeName] = typeNode;
			}
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
	return types;
}

export function parseAllTypesFromFile(filePath: string): { [key: string]: any } {
	const program = ts.createProgram([filePath], {});
	const checker = program.getTypeChecker();
	const sourceFile = program.getSourceFile(filePath);
	if (!sourceFile) {
		throw new Error(`File ${filePath} not found`);
	}

	const types = collectTypes(sourceFile);
	const parsedTypes: { [key: string]: any } = {};

	for (const typeName in types) {
		const typeNode = types[typeName];
		const descriptor = {name: typeName};
		parsedTypes[typeName] = parseTypeV2(descriptor, typeNode, checker);
	}

	return parsedTypes;
}


const parseTypeFromFile1 = parseAllTypesFromFile('./file.ts');

console.log('output:', JSON.stringify(parseTypeFromFile1, null, 2));