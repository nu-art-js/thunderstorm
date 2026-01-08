import * as functions from 'firebase-functions';

/**
 * Sample HTTP function for testing container deployment
 */
export const manual_hello = functions.https.onRequest((request, response) => {
  response.json({
    message: 'Hello World from Container',
    deploymentId: process.env.DEPLOYMENT_ID || 'manual-test',
    timestamp: new Date().toISOString(),
    functionName: 'manual_hello',
    environment: process.env.NODE_ENV || 'production'
  });
});

/**
 * Second function for testing selective deployment
 */
export const manual_goodbye = functions.https.onRequest((request, response) => {
  response.json({
    message: 'Goodbye from Container',
    deploymentId: process.env.DEPLOYMENT_ID || 'manual-test',
    timestamp: new Date().toISOString(),
    functionName: 'manual_goodbye',
    environment: process.env.NODE_ENV || 'production'
  });
});

