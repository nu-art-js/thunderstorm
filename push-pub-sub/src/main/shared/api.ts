import {ApiWithBody} from "@nu-art/thunderstorm";
import {Request_PushRegister} from "./types";

export type PubSubRegisterClient = ApiWithBody<'/v1/push/register', Request_PushRegister, void>