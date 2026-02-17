/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: These constants should be moved to a shared package or standardized.
 */


/**
 * Data synchronization status for frontend modules.
 */
export enum DataStatus {
	NoData = 0,
	ContainsData = 1,
	UpdatingData = 2
}

