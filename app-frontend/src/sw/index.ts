import {FCMServiceWorker} from '@nu-art/push-pub-sub/pubsub-sw';

new FCMServiceWorker().init(require('../main/config').config?.FirebaseModule?.local);