/**
 * Test constants for deployment unit tests.
 */

/** Test fixture: Firebase hosting hello unit key (firebase-hosting-hello) */
export const CONST_TestFixture_HostingHello = 'firebase-hosting-hello';
/** Test fixture: Firebase function hello unit key (firebase-function-hello) */
export const CONST_TestFixture_FunctionHello = 'firebase-function-hello';


/**
 * Live deploy tests talk to real GCP / Firebase projects (deploy functions and hosting,
 * push and deploy container images, delete functions). They are opt-in: set
 * BAI_LIVE_DEPLOY_TESTS=1 to run them. By default they are skipped so that a plain
 * `bai -t` never deploys anything.
 */
export const LiveDeployTestsEnabled = process.env.BAI_LIVE_DEPLOY_TESTS === '1';
export const describeLiveDeploy: Mocha.SuiteFunction = LiveDeployTestsEnabled ? describe : (describe.skip as unknown as Mocha.SuiteFunction);
export const itLiveDeploy: Mocha.TestFunction = LiveDeployTestsEnabled ? it : (it.skip as unknown as Mocha.TestFunction);
