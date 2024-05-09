import {Logger, ResolvableContent} from '@nu-art/ts-common';


export type ActionProcessor = (logger: Logger, data?: any) => Promise<void>;

export type ActionDeclaration = {
	label?: string;
	visible?: ResolvableContent<boolean>
	key: string;
	processor: ActionProcessor;
	description: string;
	group: string;
}