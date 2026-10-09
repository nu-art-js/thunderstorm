/*
 * @nu-art/email-resend-backend - Transactional email through Resend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** A mailbox. `name` is optional display text. */
export type EmailAddress = {
	email: string;
	name?: string;
};

/** One transactional message. At least one of `html` / `text` is required. */
export type ResendEmail = {
	/** Defaults to the module config `defaultFrom`. */
	from?: EmailAddress;
	to: EmailAddress[];
	cc?: EmailAddress[];
	bcc?: EmailAddress[];
	replyTo?: EmailAddress[];
	subject: string;
	html?: string;
	text?: string;
	headers?: Record<string, string>;
	tags?: { name: string; value: string }[];
	/** Resend de-duplicates sends with the same key for 24h; use one per logical message. */
	idempotencyKey?: string;
};

export type ResendSendResult =
	| { success: true; messageId: string }
	| { success: false; error: string };
