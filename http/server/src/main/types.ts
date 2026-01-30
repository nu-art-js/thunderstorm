/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type * as express from 'express';

export type Express = express.Express;
export type ExpressRouter = express.Router;
export type ExpressRequest = express.Request<any>;
export type ExpressResponse = express.Response;
export type ExpressRequestHandler = express.RequestHandler;

export type ServerApi_Middleware = () => Promise<any>;
