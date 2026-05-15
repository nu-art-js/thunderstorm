import {ImplementationMissingException, Module} from '@nu-art/ts-common';
import {Email, EmailAdapter, EmailResult} from '@nu-art/ts-email-shared';

export class ModuleBE_Email_Class
	extends Module {

	private adapter?: EmailAdapter;

	public registerAdapter(adapter: EmailAdapter) {
		this.adapter = adapter;
		this.logInfo('Email adapter registered');
	}

	public async send(email: Email): Promise<EmailResult> {
		if (!this.adapter)
			throw new ImplementationMissingException('No email adapter registered. Register one via ModuleBE_Email.registerAdapter()');

		this.logDebug(`Sending email to ${email.to.map(t => t.email).join(', ')} subject="${email.subject}"`);
		return this.adapter.send(email);
	}
}

export const ModuleBE_Email = new ModuleBE_Email_Class();
