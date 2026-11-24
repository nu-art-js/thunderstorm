// Node test loader. The pure test loads TransferBubble without the widget barrel or a CSS runtime.
const componentSync = new URL('../../../../widgets/dist/_core/ComponentSync.js', import.meta.url);

export async function resolve(specifier, context, nextResolve) {
	if (specifier === '@nu-art/thunder-widgets')
		return {url: componentSync.href, shortCircuit: true};

	return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
	if (url.endsWith('.scss'))
		return {format: 'module', source: 'export {};\n', shortCircuit: true};

	return nextLoad(url, context);
}
