import {Logger} from '@nu-art/ts-common';


export type ActionProcessor = (logger: Logger, data?: any) => Promise<void>;

export type ActionDeclaration = {
	key: string;
	processor: ActionProcessor;
	description: string;
	group: string;
}