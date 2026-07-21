import {ImplementationMissingException, Module, TS_Object} from '@nu-art/ts-common';
import {TS_AgentTool} from './types.js';

type Config = {};

export class ModuleBE_AgentTools_Class
	extends Module<Config> {

	private tools = {} as Record<string, TS_AgentTool<any, any>>;

	protected init(): void {
	}

	registerTool<T extends TS_Object, V>(tool: TS_AgentTool<T, V>) {
		this.tools[tool.name] = tool as TS_AgentTool<any, any>;
		const originalExecute = tool.execute;
		tool.execute = async (args: T) => {
			this.logDebug(`Calling tool: ${tool.name} with args:`, args);
			return originalExecute(args);
		};
	}

	getTools(tools?: string[]) {
		return tools?.map(toolName => {
			if (!this.tools[toolName])
				throw new ImplementationMissingException(`Tool '${toolName}' not found`);
			return this.tools[toolName];
		});
	}

	getAllTools(): TS_AgentTool<any, any>[] {
		return Object.values(this.tools);
	}

	getTool(toolName: string) {
		const tool = this.tools[toolName];
		if (!tool)
			throw new ImplementationMissingException(`Tool '${toolName}' not found`);

		return tool;
	}

	public clearTools() {
		this.tools = {};
	}
}

export const ModuleBE_AgentTools = new ModuleBE_AgentTools_Class();

