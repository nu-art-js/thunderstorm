/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BeLogged, LogClient_Terminal} from '@nu-art/ts-common';

declare global {
	var __beLoggedTerminalAdded: boolean | undefined;
}

/** Adds LogClient_Terminal to BeLogged once per process. Safe to call from any test file; only the first call adds the client. */
export function ensureBeLoggedTerminal(): void {
	if (globalThis.__beLoggedTerminalAdded)
		return;
	BeLogged.addClient(LogClient_Terminal);
	globalThis.__beLoggedTerminalAdded = true;
}
