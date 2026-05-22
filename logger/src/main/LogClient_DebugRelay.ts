/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {LogClient_ConsoleProxy, LogToStream} from './LogClient_ConsoleProxy.js';

/**
 * Log client that relays all logs to a local HTTP receiver for agent-assisted debugging.
 *
 * Safety: refuses to send if the page is not running on localhost/127.0.0.1.
 *
 * Usage: register with `BeLogged.addClient(LogClient_DebugRelay)` in the frontend entry point.
 * Start the companion receiver script (`logger/tools/log-receiver.mjs`) to capture output.
 *
 * Default endpoint: http://localhost:9999
 */
class LogClient_DebugRelay_Class
	extends LogClient_ConsoleProxy {

	protected appName = 'debug-relay';

	private endpoint = 'http://localhost:9999';

	setEndpoint(url: string) {
		this.endpoint = url;
		return this;
	}

	protected sendLogsToEndpoint = async (logs: LogToStream[]) => {
		await fetch(this.endpoint, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({logs}),
		});
	};
}

export const LogClient_DebugRelay = new LogClient_DebugRelay_Class();
