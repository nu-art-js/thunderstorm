/*
 * @nu-art/ts-email-resend-backend - Resend adapter for ts-email
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {type ApiDefResolver, type BodyApi, HttpMethod} from '@nu-art/api-types';

/** Resend `POST /emails` body. Third-party contract, owned here. Addresses use `Name <email>` form. */
export type ResendSendEmail_Body = {
	from: string;
	to: string[];
	subject: string;
	html: string;
	text?: string;
};

/** Resend `POST /emails` success response. */
export type ResendSendEmail_Response = {
	id: string;
};

export type API_ResendApi = {
	sendEmail: BodyApi<ResendSendEmail_Response, ResendSendEmail_Body>;
};

export const ResendApi_Origin = 'https://api.resend.com';

export const ApiDef_ResendApi: ApiDefResolver<API_ResendApi> = {
	sendEmail: {method: HttpMethod.POST, path: '/emails', timeout: 15_000},
};
