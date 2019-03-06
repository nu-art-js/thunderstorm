/**
 * Created by tacb0ss on 10/07/2018.
 */
import * as functions from 'firebase-functions';
import {Express} from "express";
import {httpServer} from "./services";


const express: Express = httpServer.express;
require('./main/api')('', express);

const resolveRoutes = (stack: any[], prefixUrl?: string): any[] => {
	return stack.map(function (layer: any) {
		if (layer.route && typeof layer.route.path === "string") {
			let methods = Object.keys(layer.route.methods);
			if (methods.length > 20)
				methods = ["ALL"];

			return {methods: methods, path: layer.route.path};
		}

		if (layer.name === 'router') {
			const url = layer.regexp.toString();
			const _prefixUrl = url.substring(2, url.indexOf("?") - 2).replace(/\\\//gi, "/");
			return resolveRoutes(layer.handle.stack, _prefixUrl);
		}

	}).filter(route => route);
};

const routes = resolveRoutes(express._router.stack);

const printRoute = (route: any): void => {
	if (Array.isArray(route)) {
		route.forEach(_route => printRoute(_route));
		return;
	}

	console.log(JSON.stringify(route.methods) + " " + route.path);
};

printRoute(routes);

httpServer.start()
	.then(() => {
		console.log("Started");
	})
	.catch(reason => console.error("Error: ", reason));

export const api = functions.https.onRequest(httpServer.express);
