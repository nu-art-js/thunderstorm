# @nu-art/http-client

Type-safe HTTP client library for Thunderstorm with fluent API, comprehensive logging, and full request/response type safety.

## 1. Package Purpose

This package provides a powerful, type-safe HTTP client built on Axios with:

- **Type-safe requests**: Full TypeScript support for request bodies, query parameters, and responses
- **Fluent builder API**: Chainable methods for easy request configuration
- **Built-in logging**: Comprehensive request lifecycle logging (verbose, debug, info, warning, error)
- **Error handling**: Structured error responses with full request context
- **Request cancellation**: Built-in AbortController support
- **Default configuration**: Centralized client configuration for headers, timeouts, and callbacks

## 2. Installation and usage

In the monorepo, add the package as a dependency in `__package.json` of the consuming package:

```json
"dependencies": {
  "@nu-art/http-client": "?"
}
```

Import and use the client in your code. When using the default client, call `setDefaultConfig` and `init()` before creating requests.

## Quick Start

### Basic Usage

```typescript
import {HttpClient, HttpRequest, HttpMethod} from '@nu-art/http-client';

// Create a client with default configuration
const client = new HttpClient();
client.setDefaultConfig({
  origin: 'https://api.example.com',
  timeout: 30000
});
client.init();

// Define a typed API
type UserApi = {
  Method: 'get',
  Response: {id: string, name: string},
  Body: never,
  Params: {userId: string},
  Error: {type: 'user-not-found', data: {message: string}}
};

// Create and execute a request
const request = client.createRequest({
  method: HttpMethod.GET,
  path: '/users/:userId'
} as ApiDef<UserApi>);

const user = await request
  .setUrlParam('userId', '123')
  .execute();
```

### Using the Default Client

```typescript
import {httpClient} from '@nu-art/http-client';

// Configure the default client
httpClient.setDefaultConfig({
  origin: 'https://api.example.com'
});
httpClient.init();

// Use it directly
const request = httpClient.createRequest({...});
```

## 3. Key Features

### Type-Safe API Definitions

Define your APIs with full type safety:

```typescript
import {BodyApi, QueryApi, TypedApi} from '@nu-art/http-client';

// POST request with body
type CreateUserApi = BodyApi<
  {id: string},           // Response
  {name: string, email: string},  // Body
  {name: string, email: string}   // Input body (same as body)
>;

// GET request with query params
type GetUsersApi = QueryApi<
  {users: Array<{id: string, name: string}>},  // Response
  {page: number, limit: number}                 // Query params
>;
```

### Fluent Builder API

Chain methods to configure requests:

```typescript
const response = await client.createRequest({...})
  .setMethod(HttpMethod.POST)
  .setBodyAsJson({name: 'John', email: 'john@example.com'})
  .addHeader('Authorization', 'Bearer token123')
  .setTimeout(5000)
  .execute();
```

### Error Handling

Errors include full request context:

```typescript
try {
  await request.execute();
} catch (error) {
  if (error instanceof HttpException) {
    console.log('Status:', error.responseCode);
    console.log('URL:', error.request.getUrl());
    console.log('Method:', error.request.method);
    console.log('Error:', error.errorResponse);
  }
}
```

### Default Callbacks

Set default error and completion handlers on the client:

```typescript
client.setDefaultOnError(async (error) => {
  // Handle all errors from this client
  console.error('Request failed:', error.responseCode);
});

client.setDefaultOnComplete(async (response, input, request) => {
  // Handle all successful requests
  console.log('Request completed:', request.getUrl());
});
```

### Request-Specific Callbacks

Set callbacks on individual requests:

```typescript
await request
  .setOnError(async (error) => {
    // Handle this specific request's errors
  })
  .setOnCompleted(async (response, input, request) => {
    // Handle this specific request's completion
  })
  .execute();
```

### Request Cancellation

Cancel requests using AbortController:

```typescript
const request = client.createRequest({...});

// Cancel the request
request.abort();

// Or cancel after starting
const promise = request.execute();
request.abort(); // Will throw HttpException with status 0
```

### Comprehensive Logging

The HttpRequest class extends Logger, providing automatic logging:

```typescript
// Enable verbose logging for a specific request
request.setMinLevel(LogLevel.Verbose);

// Logs include:
// - Request creation
// - URL composition
// - Header preparation
// - Request execution
// - Response status
// - JSON parsing
// - Completion/errors
```

## 4. API Overview

### HttpClient

Main client class for creating and configuring requests.

**Methods:**
- `createRequest<API>(apiDef, data?)`: Creates a typed HttpRequest
- `setDefaultConfig(config)`: Sets default client configuration
- `addDefaultHeader(key, header)`: Adds a default header (supports functions for dynamic values)
- `setDefaultOnError(callback)`: Sets default error handler
- `setDefaultOnComplete(callback)`: Sets default completion handler

### HttpRequest

Type-safe request builder with fluent API.

**Key Methods:**
- `setMethod(method)`: Set HTTP method
- `setUrl(url)` / `setRelativeUrl(path)`: Set request URL
- `setUrlParam(key, value)`: Set query parameter
- `setBody(body, compress?)`: Set request body
- `setBodyAsJson(body, compress?)`: Set JSON body with content-type header
- `addHeader(key, value)`: Add header (appends to existing)
- `setHeader(key, value)`: Set header (replaces existing)
- `setTimeout(timeout)`: Set request timeout
- `setOnError(callback)`: Set error handler (chains with existing)
- `setOnCompleted(callback)`: Set completion handler (chains with existing)
- `execute(print?)`: Execute the request and return typed response
- `abort()`: Cancel the request

### HttpException

Exception thrown on request failures, containing:
- `responseCode`: HTTP status code
- `errorResponse`: Structured error response from server
- `request`: Full HttpRequest instance for context

### Types

- `TypedApi<M, R, B, P, IB, IP, E>`: Full API type definition
- `BodyApi<R, B, IB, E, M, P>`: Convenience type for body-based APIs
- `QueryApi<R, P, E, IP, M, B>`: Convenience type for query-based APIs
- `EmptyApi<R, M, E, P, B>`: Convenience type for empty APIs (OPTIONS, HEAD)
- `ApiDef<API>`: API definition for request creation
- `ResponseError<K, Data>`: Error response type
- `HttpMethod`: HTTP method enumeration

## 5. Examples

See **Quick Start** and the code blocks in **Key Features** for typical usage.

## Package Structure

```
src/main/
├── core/
│   ├── HttpClient.ts      # Main client class
│   └── HttpRequest.ts     # Request builder class
├── types/
│   ├── api-types.ts       # API type definitions
│   ├── error-types.ts     # Error type definitions
│   └── types.ts           # Parameter types
├── exceptions/
│   └── HttpException.ts   # HTTP exception class
├── utils/
│   ├── utils.ts           # URL/query utilities
│   └── http-codes.ts      # HTTP status code constants
└── index.ts               # Package exports
```

## Exports

All public APIs are exported from the main entry point:

```typescript
import {
  // Core classes
  HttpClient,
  HttpRequest,
  httpClient,
  
  // Types
  TypedApi,
  BodyApi,
  QueryApi,
  EmptyApi,
  ApiDef,
  HttpMethod,
  ResponseError,
  ApiErrorResponse,
  
  // Exceptions
  HttpException,
  ApiException,
  
  // Utils
  composeUrl,
  composeQueryParams,
  encodeUrlParams,
  HttpCodes
} from '@nu-art/http-client';
```

## License

Apache-2.0
