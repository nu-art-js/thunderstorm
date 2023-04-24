import {DB_Object} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';


export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];
