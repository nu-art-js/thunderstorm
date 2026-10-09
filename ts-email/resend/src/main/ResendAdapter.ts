/*
 * @nu-art/ts-email-resend-backend - Resend adapter for ts-email
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpException} from '@nu-art/http-client';
import {isErrorOfType, Module} from '@nu-art/ts-common';
import {ModuleBE_Email} from '@nu-art/ts-email-backend';
import type {Email, EmailAdapter, EmailResult} from '@nu-art/ts-email-shared';
import {ModuleBE_ResendApi} from './external/ModuleBE_ResendApi.js';
import {formatResendAddress} from './format.js';

/**
 * ts-email adapter that sends through Resend. Registers itself with ModuleBE_Email on init.
 * A Resend refusal or a transport error becomes `{success: false, error}`; the error text names
 * the HTTP status and Resend's message, never the key or the recipients.
 */
export class ResendAdapter_Class
	extends Module
	implements EmailAdapter {

	protected init(): void {
		super.init();
		ModuleBE_Email.registerAdapter(this);
	}

	async send(email: Email): Promise<EmailResult> {
		try {
			const response = await ModuleBE_ResendApi.sendEmail({
				from: formatResendAddress(email.from),
				to: email.to.map(formatResendAddress),
				subject: email.subject,
				html: email.html,
				...(email.text !== undefined ? {text: email.text} : {}),
			});
			this.logInfo(`Resend accepted message ${response.id} for ${email.to.length} recipient(s)`);
			return {success: true, messageId: response.id};
		} catch (e: unknown) {
			const httpException = isErrorOfType(e, HttpException);
			if (!httpException)
				throw e;

			const error = `Resend refused the message (${httpException.responseCode})${resendMessage(httpException)}`;
			this.logError(error);
			return {success: false, error};
		}
	}
}

/** Resend's error body is `{statusCode, name, message}`; keep only a short message. */
function resendMessage(httpException: HttpException): string {
	const body: unknown = httpException.errorResponse;
	if (typeof body !== 'object' || body === null || !('message' in body) || typeof body.message !== 'string')
		return '';

	return `: ${body.message.slice(0, 200)}`;
}

export const ResendAdapter = new ResendAdapter_Class();
