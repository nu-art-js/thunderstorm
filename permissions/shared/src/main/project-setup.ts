/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export interface PerformProjectSetup {
	__performProjectSetup(): {
		priority: number;
		processor: () => Promise<void>;
	};
}
