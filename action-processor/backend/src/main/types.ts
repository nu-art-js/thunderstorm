/*
 * @nu-art/action-processor-backend - Action processor backend types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Logger, ResolvableContent} from '@nu-art/ts-common';

export type ActionProcessor = (logger: Logger, data?: any) => Promise<void>;

export type ActionDeclaration = {
	label?: string;
	visible?: ResolvableContent<boolean>;
	key: string;
	processor: ActionProcessor;
	description: string;
	group: string;
};
