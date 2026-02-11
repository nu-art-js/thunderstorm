/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BeLogged, LogClient_Terminal} from '@nu-art/ts-common';

declare global {
	var __beLoggedTerminalAdded: boolean | undefined;
}

export function ensureBeLoggedTerminal(): void {
	if (globalThis.__beLoggedTerminalAdded)
		return;
	BeLogged.addClient(LogClient_Terminal);
	globalThis.__beLoggedTerminalAdded = true;
}
