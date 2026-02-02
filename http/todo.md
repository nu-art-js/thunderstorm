# Http Client <> Server 

## Error handling
### Goal
* Clear, predictable and consistent error behavior between http client and http server  
* Sharing and using the same type of errors on both the client and the server
* Support good error handling transport for client error handling

### Definition
* an http client calls an http server backend
* the backend server perform some business logic, it may fail and throw an error
* There are many types of errors
* any Error that is not an ApiException we will refer to as Other Error
* Exceptions should have: 
  * ui message (which is an applicative error message)
  * debug message (which explain the technical error cause)
  * stacktrace (which will show where the error originates)

### Expectations
* basically what is expected is a sort of serialization of the exceptions, where whatever exception throws on the server would reflect on the client
* we need a way to allow to register error types in the client for applicative custom errors
* if an exception has a cause, the expectation is that these will be recursively serialized and inferred
* if an Exception type is unknown, it will be inferred as Error, same goes for its cause
* if the server is in debug mode, we will send the ui exception types + message + stacktrace + debug message back to be reconstructed in the client
* if the server is in prod mode, we will send the ui exception types + message back to be reconstructed in the client

### Examples
* server fails and throws an ApiException with 4XX + error message "Unsupported type"
  * expected result, the caller of the **http client** will capture an ApiException with 4XX + error message "Unsupported type"
  
* server fails and throws a MustNeverHappenException + message: "Why is this value X"
  * expected result, server throws an ApiException with 500 and the MustNeverHappenException as the cause
  * client translate this into an ApiException with 500 and the MustNeverHappenException as the cause