import {FCMServiceWorker} from '@thunder-storm/push-pub-sub/pubsub-sw';

new FCMServiceWorker().init(require('../main/config').config?.ModuleFE_Firebase?.local);