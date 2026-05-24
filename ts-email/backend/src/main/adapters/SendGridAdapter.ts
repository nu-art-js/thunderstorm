import {Module} from '@nu-art/ts-common';
import {SecretKey} from '@nu-art/google-services-backend';
import {Email, EmailAdapter, EmailResult} from '@nu-art/ts-email-shared';
import sgMail from '@sendgrid/mail';
import {ModuleBE_Email} from '../ModuleBE_Email.js';

export const SecretKey_SendGridApiKey = new SecretKey<string>('sendgrid-api-key');

export class SendGridAdapter_Class
	extends Module
	implements EmailAdapter {

	async init() {
		await super.init();
		// const apiKey = await SecretKey_SendGridApiKey.get();
		// if (!apiKey)
		// 	throw new ImplementationMissingException('SendGrid API key not found in secrets');
		sgMail.setApiKey("apiKey");
		ModuleBE_Email.registerAdapter(this);
	}

	async send(email: Email): Promise<EmailResult> {
		try {
			const [response] = await sgMail.send({
				from: email.from,
				to: email.to,
				subject: email.subject,
				html: email.html,
				text: email.text,
			});
			return {
				success: response.statusCode >= 200 && response.statusCode < 300,
				messageId: response.headers['x-message-id'] as string | undefined,
			};
		} catch (e: any) {
			this.logError('SendGrid send failed', e);
			return {success: false, error: e.message};
		}
	}
}

export const SendGridAdapter = new SendGridAdapter_Class();
