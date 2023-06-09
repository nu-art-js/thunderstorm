import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {QueryParams} from '../../../shared';
import {IncomingHttpHeaders} from 'http';
import {ExpressRequest} from '../../utils/types';
import {ApiResponse} from './server-api';


export const MemKey_HttpRequest = new MemKey<ExpressRequest>('http-request', true);
export const MemKey_HttpResponse = new MemKey<ApiResponse>('http-response', true);
export const MemKey_HttpRequestHeaders = new MemKey<IncomingHttpHeaders>('http-request--incoming-headers', true);
export const MemKey_HttpRequestBody = new MemKey<any>('http-request--incoming-body', true);
export const MemKey_HttpRequestQuery = new MemKey<QueryParams>('http-request--query', true);
export const MemKey_HttpRequestUrl = new MemKey<string>('http-request--url', true);
export const MemKey_HttpRequestOriginalUrl = new MemKey<string>('http-request--original-url', true);
export const MemKey_HttpRequestMethod = new MemKey<any>('http-request--method', true);
