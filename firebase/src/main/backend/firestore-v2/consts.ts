import {Dispatcher} from "@nu-art/ts-common";
import {CanDeleteDBEntitiesV2} from "./types";

export const canDeleteDispatcherV2 = new Dispatcher<CanDeleteDBEntitiesV2<any, any>, '__canDeleteEntities'>('__canDeleteEntities');