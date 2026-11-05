/*
 * @nu-art/firebase-backend - Firebase wrappers and Cloud Function modules
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Express} from 'express';

export function listenOnPort(app: Express, port: number | undefined): Promise<void> {
	return new Promise((resolve, reject) => {
		const server = app.listen(port, () => resolve());
		server.on('error', reject);
	});
}
