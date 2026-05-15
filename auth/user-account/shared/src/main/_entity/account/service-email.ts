const ZERO_WIDTH_SPACE = '\u200B';

export function mangleServiceEmail(email: string): string {
	const atIndex = email.indexOf('@');
	if (atIndex <= 0)
		return `${ZERO_WIDTH_SPACE}${email}`;

	const local = email.substring(0, atIndex);
	const domain = email.substring(atIndex);
	return `${local.charAt(0)}${ZERO_WIDTH_SPACE}${local.substring(1)}${domain}`;
}

export function isServiceEmail(email: string): boolean {
	return email.includes(ZERO_WIDTH_SPACE);
}

export function displayServiceEmail(email: string): string {
	return email.replace(/\u200B/g, '');
}
