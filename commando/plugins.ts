// Plugin interface
type IPluginable = {}

interface IPlugin {
	register(): void;
}

// Decorator for registering plugin methods

function registerPluginMethod(target: (param1: string) => void, ...propertyKey: any[]) {
	console.log('Ze ZEVEL');
	console.log('target', target);
	console.log('propertyKey', propertyKey);
}

// Pluginable class
class Pluginable {
	private static pluginMethods: { [methodName: string]: Function } = {};

	static registerPlugin(plugin: IPlugin) {
		plugin.register();
	}

	static registerPluginMethod(methodName: string, method: Function) {
		this.pluginMethods[methodName] = method;
	}

	static getMethod(methodName: string): Function | undefined {
		return this.pluginMethods[methodName];
	}
}

// PluginX
class PluginX
	implements IPlugin {
	register() {
		Pluginable.registerPluginMethod('pluginXMethod', this.pluginXMethod);
	}

	@registerPluginMethod
	pluginXMethod(kaki: string) {
		console.log('Executing pluginX method');
	}
}

// PluginY
class PluginY
	implements IPlugin {
	register() {
		Pluginable.registerPluginMethod('pluginYMethod', this.pluginYMethod);
	}

	@registerPluginMethod
	pluginYMethod() {
		console.log('Executing pluginY method');
	}
}

// Usage
let pluginX = new PluginX();
Pluginable.registerPlugin(pluginX);

let pluginY = new PluginY();
Pluginable.registerPlugin(pluginY);

Pluginable.getMethod('pluginXMethod')?.();
Pluginable.getMethod('pluginYMethod')?.();
