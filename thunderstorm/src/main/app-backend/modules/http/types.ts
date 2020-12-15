import {
	AxiosRequestConfig,
	AxiosResponse,
	CancelTokenSource,
	Method
} from "axios";


export type Axios_RequestConfig = AxiosRequestConfig
export type Axios_Response<T = any> = AxiosResponse<T>
export type Axios_CancelTokenSource = CancelTokenSource
export type Axios_Method = Method