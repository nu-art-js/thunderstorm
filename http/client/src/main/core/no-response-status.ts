/*
 * @nu-art/http-client - Status used when no HTTP response arrives
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

/** No HTTP status arrived. A dropped socket uses this, not 500. Example: HttpStatus_NoResponse === 496 */
export const HttpStatus_NoResponse = 496;

/** A real status stays. A missing status is the dropped-socket code. Example: httpStatusFromTransportError(undefined) === 496 */
export function httpStatusFromTransportError(status: number | undefined): number {
	return status ?? HttpStatus_NoResponse;
}
