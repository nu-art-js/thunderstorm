import * as functions from 'firebase-functions';
import {libAFunction} from '@test/lib-a';

export const hello = functions.https.onRequest((request, response) => {
  response.json({
    message: 'Hello World',
    libAMessage: libAFunction(),
    deploymentId: '18cee8bec7334eef'
  });
});

