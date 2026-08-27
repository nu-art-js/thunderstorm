import {JSON_Schema, TS_Object} from '@nu-art/ts-common';

export type {JSON_Schema} from '@nu-art/ts-common';

export type TS_AgentTool<Input extends TS_Object, Output> = {
	name: string;
	inputSchema: JSON_Schema<Input>;
	execute: (args: Input) => Promise<Output>;
};
