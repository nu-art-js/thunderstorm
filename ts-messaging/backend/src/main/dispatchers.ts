/*
 * @nu-art/ts-messaging-backend — OnMessageMentioned dispatcher
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Dispatcher} from '@nu-art/ts-common';
import type {DB_Account} from '@nu-art/user-account-shared';
import type {DatabaseDef_Message, DatabaseDef_Topic} from '@nu-art/ts-messaging-shared';

export type MessageMentionedPayload = {
	topic: DatabaseDef_Topic['dbType'];
	message: DatabaseDef_Message['dbType'];
	mentionedAccountIds: DB_Account['_id'][];
};

export interface OnMessageMentioned {
	__onMessageMentioned(payload: MessageMentionedPayload): void | Promise<void>;
}

export const dispatch_OnMessageMentioned = new Dispatcher<OnMessageMentioned, '__onMessageMentioned'>('__onMessageMentioned');
