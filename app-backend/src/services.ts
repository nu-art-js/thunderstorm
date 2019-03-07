/**
 * Created by tacb0ss on 10/07/2018.
 */
import {HttpServer} from "@nu-art/server";

const config = require("./config/config-dev");

export const httpServer = new HttpServer().setup(config.server);

