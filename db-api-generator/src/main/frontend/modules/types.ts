import {DB_Object} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {BaseDB_ApiCaller} from './BaseDB_ApiCaller';
import {BaseDB_ApiCallerV2} from './BaseDB_ApiCallerV2';

export type DBItemApiCaller<T extends DB_Object, Ks extends keyof T = '_id'> = BaseDB_ApiCaller<T, Ks> | BaseDB_ApiCallerV2<T, Ks>;

export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];
