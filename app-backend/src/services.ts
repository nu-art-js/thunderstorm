/**
 * Created by tacb0ss on 10/07/2018.
 */
import {HttpServer} from "@nu-art/server";

const config = require("./config/dev.json");

export const httpServer = new HttpServer().setup(config.server);

