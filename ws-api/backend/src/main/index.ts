/*
 * @nu-art/ws-api-backend - WebSocket server module for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type {
	WsApiConfig,
	WsAuthenticateContext,
	WsAuthenticator,
	WsConnectionAuth,
	WsHandlerContext,
	WsHeartbeatConfig,
	WsHttpAttachTarget,
	WsIdleResyncHandler,
	WsMessageHandler,
} from './types.js';
export {WsCloseCode_HeartbeatTimeout} from './types.js';
export {WsServer} from './WsServer.js';
export {ModuleBE_WsApi, ModuleBE_WsApi_Class} from './ModuleBE_WsApi.js';
