/**
 * Created by tacb0ss on 10/07/2018.
 */
import {HttpServer} from "@nu-art/server";
import {ModuleManager} from "@nu-art/core";

const config = require("./config/config-dev");

export const moduleManager = ModuleManager.createModuleManager().setConfig(config).setModuleTypes(HttpServer).init();
// const httpServer1: HttpServer = new HttpServer();
// // @ts-ignore
// httpServer1.setConfig(config.server);
// export const httpServer = httpServer1;

