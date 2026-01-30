/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * TO-REFACTOR: This dispatcher interface should be standardized and moved to a shared package.
 * Currently a placeholder to decouple from thunderstorm's ThunderDispatcher.
 */
/**
 * No-op dispatcher for cases where no event handling is needed.
 */
export const NoOpDispatcher = {
    dispatchModule: () => { },
    dispatchUI: () => { },
    dispatchAll: () => { },
};
//# sourceMappingURL=dispatcher.js.map