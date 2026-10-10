import {createHmac, timingSafeEqual} from 'node:crypto';

const b64urlJson = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

const safeEqual = (a: string, b: string) => {
	const left = Buffer.from(a, 'utf8');
	const right = Buffer.from(b, 'utf8');
	if (left.length !== right.length) {
		timingSafeEqual(left, left);
		return false;
	}

	return timingSafeEqual(left, right);
};

export const signHs256 = (payload: Record<string, unknown>, key: string): string => {
	const data = `${b64urlJson({alg: 'HS256', typ: 'JWT'})}.${b64urlJson(payload)}`;
	return `${data}.${createHmac('sha256', key).update(data).digest('base64url')}`;
};

/** The payload of a well-formed, correctly signed HS256 token; throws otherwise. Claims are not checked here. */
export const verifyHs256 = (token: string, key: string): Record<string, unknown> => {
	const parts = token.split('.');
	if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2])
		throw new Error('Malformed token');

	const [header, body, signature] = parts;
	if (!safeEqual(signature, createHmac('sha256', key).update(`${header}.${body}`).digest('base64url')))
		throw new Error('Bad signature');

	const headerJson = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as Record<string, unknown>;
	if (headerJson.alg !== 'HS256')
		throw new Error('Unsupported algorithm');

	const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
	if (!payload || typeof payload !== 'object' || Array.isArray(payload))
		throw new Error('Malformed payload');

	return payload as Record<string, unknown>;
};
