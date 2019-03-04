import {Express} from "express";
import {resolveEndpointPath} from "@nu-art/server";

module.exports = function (prefixUrl: string, app: Express) {
	resolveEndpointPath(__dirname, prefixUrl, app, require, "");
};