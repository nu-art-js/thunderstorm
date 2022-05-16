import {ApiWithBody} from '@nu-art/thunderstorm';
import {Request_PushRegister, Request_ReadPush} from './types';

export type PubSubRegisterClient = ApiWithBody<'/v1/push/register', Request_PushRegister, void>
export type PubSubReadNotification = ApiWithBody<'/v1/push/read', Request_ReadPush, void>