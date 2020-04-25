import * as functions from 'firebase-functions';

import config from './config';

/**
 * Wrapper around functions to handle authentication
 * @param handler
 * @param runtimeOpt
 */
export function https(
  handler: (uid: string, data: any, context: functions.https.CallableContext) => any | Promise<any>,
  runtimeOpt: functions.RuntimeOptions = { memory: '256MB', timeoutSeconds: 60 }
): functions.HttpsFunction {
  return functions
    .runWith(runtimeOpt)
    .region(...config.regions)
    .https.onCall(async (data, context) => {
      const uid = await config.authenticator.authenticate(data, context);

      return handler(uid, data, context).catch((e: Error) => {
        // rethrow valid HTTP errors
        if (e instanceof functions.https.HttpsError) throw e;

        // otherwise provide a nice log
        console.error('Error occured', JSON.stringify(e));
        throw new functions.https.HttpsError('internal', 'Server error occured.');
      });
    });
}

export function https_public(
  handler: (uid: string, data: any, context: functions.https.CallableContext) => any | Promise<any>,
  runtimeOpt: functions.RuntimeOptions = { memory: '256MB', timeoutSeconds: 60 }
): functions.HttpsFunction {
  return functions
    .runWith(runtimeOpt)
    .region(...config.regions)
    .https.onCall(async (data, context) => {
      //const uid = await config.authenticator.authenticate(data, context);

      return handler("", data, context).catch((e: Error) => {
        // rethrow valid HTTP errors
        if (e instanceof functions.https.HttpsError) throw e;

        // otherwise provide a nice log
        console.error('Error occured', e);
        throw new functions.https.HttpsError('internal', 'Server error occured.');
      });
    });
}
export function storage(
  bucket: string,
  handler: (object: functions.storage.ObjectMetadata) => any | Promise<any>,
  runtimeOpt: functions.RuntimeOptions = { memory: '256MB', timeoutSeconds: 60 }
): functions.CloudFunction<functions.storage.ObjectMetadata> {
  return functions
    .runWith(runtimeOpt)
    .region(...config.regions)
    .storage.bucket(bucket)
    .object()
    .onFinalize(async (object) =>
      handler(object).catch((e: Error) => {
        console.error('Error occured', e);
        throw e;
      })
    );
}
