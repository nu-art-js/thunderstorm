import {Dispatcher} from '@nu-art/ts-common';
import {CanDeleteDBEntitiesProto} from './types';

export const canDeleteDispatcherV3 = new Dispatcher<CanDeleteDBEntitiesProto, '__canDeleteEntitiesProto'>('__canDeleteEntitiesProto');