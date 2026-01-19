/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BeLogged} from '../main/index.js';

/**
 * Global cleanup hook that runs after ALL tests complete.
 * 
 * This ensures all log clients are removed and their intervals/timers cleared,
 * preventing the test process from hanging.
 */
after(() => {
	BeLogged.removeAllClients();
});
