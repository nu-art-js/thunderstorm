/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Interface for modules that participate in project setup (e.g. create default projects, domains, keys).
 * The app wires implementations to its action-processor or calls __performProjectSetup() when needed.
 */
export interface PerformProjectSetup {
	__performProjectSetup(): {
		priority: number;
		processor: () => Promise<void>;
	};
}
