/*
 * @nu-art/ws-api-shared - Shared WebSocket envelope types and helpers
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** Typed WS message envelope. Apps extend via `type` + `payload`. */
export type WsEnvelope<TType extends string = string, TPayload = unknown> = {
	type: TType;
	/** Optional correlation id for request/response (ack / error). */
	id?: string;
	payload?: TPayload;
};

export const WsBuiltinType = {
	ping: 'ping',
	pong: 'pong',
	echo: 'echo',
	ack: 'ack',
	error: 'error',
} as const;

export type WsBuiltinType = (typeof WsBuiltinType)[keyof typeof WsBuiltinType];

export type WsPing = WsEnvelope<typeof WsBuiltinType.ping, { t?: number }>;
export type WsPong = WsEnvelope<typeof WsBuiltinType.pong, { t?: number }>;
export type WsEcho = WsEnvelope<typeof WsBuiltinType.echo, unknown>;
export type WsAck = WsEnvelope<typeof WsBuiltinType.ack, { ok: true; forType?: string; forId?: string }>;
export type WsErrorMsg = WsEnvelope<typeof WsBuiltinType.error, { message: string; forType?: string; forId?: string }>;

export function isWsEnvelope(value: unknown): value is WsEnvelope {
	return !!value && typeof value === 'object' && typeof (value as WsEnvelope).type === 'string';
}

/** Parse a text WS frame into an envelope; returns undefined if invalid JSON / shape. */
export function parseWsEnvelope(raw: string): WsEnvelope | undefined {
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!isWsEnvelope(parsed))
			return undefined;
		return parsed;
	} catch {
		return undefined;
	}
}

export function encodeWsEnvelope(msg: WsEnvelope): string {
	return JSON.stringify(msg);
}

export function wsAck(forMsg: Pick<WsEnvelope, 'type' | 'id'>): WsAck {
	return {
		type: WsBuiltinType.ack,
		id: forMsg.id,
		payload: {ok: true, forType: forMsg.type, forId: forMsg.id},
	};
}

export function wsError(message: string, forMsg?: Pick<WsEnvelope, 'type' | 'id'>): WsErrorMsg {
	return {
		type: WsBuiltinType.error,
		id: forMsg?.id,
		payload: {message, forType: forMsg?.type, forId: forMsg?.id},
	};
}
