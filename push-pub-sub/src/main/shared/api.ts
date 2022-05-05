import {BodyApi} from '@nu-art/thunderstorm';
import {Request_PushRegister, Request_ReadPush} from './types';

export type PubSubRegisterClient = BodyApi<'/v1/push/register', Request_PushRegister, void>
export type PubSubReadNotification = BodyApi<'/v1/push/read', Request_ReadPush, void>