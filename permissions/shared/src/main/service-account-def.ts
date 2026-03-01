/*
 * Permissions management system
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/**
 * Definition for a service account to be created during project setup.
 * The app provides a list via setServiceAccountsProvider; permissions uses it to create permission users and wire tokens.
 */
export type ServiceAccountDef = {
	email: string;
	description: string;
	groupIds?: string[];
	moduleName: string;
	ttl?: number;
};
