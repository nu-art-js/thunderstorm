export type EmailAddress = {
	email: string;
	name?: string;
};

export type Email = {
	from: EmailAddress;
	to: EmailAddress[];
	subject: string;
	html: string;
	text?: string;
};

export type EmailResult = {
	success: boolean;
	messageId?: string;
	error?: string;
};

export type EmailAdapter = {
	send(email: Email): Promise<EmailResult>;
};
