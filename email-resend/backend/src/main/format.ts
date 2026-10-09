/*
 * @nu-art/email-resend-backend - Transactional email through Resend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {EmailAddress} from './types.js';

/**
 * Formats an address as `email` or `"Display Name" <email>`. Line breaks are removed and quotes and
 * backslashes in the display name are escaped, so a name can never inject another address or header.
 */
export function formatResendAddress(address: EmailAddress): string {
	const email = address.email.replace(/[\r\n]/g, '').trim();
	const name = address.name?.replace(/[\r\n]/g, ' ').trim();
	if (!name)
		return email;

	return `"${name.replace(/["\\]/g, '\\$&')}" <${email}>`;
}
