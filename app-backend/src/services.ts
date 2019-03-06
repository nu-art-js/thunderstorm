/**
 * Created by tacb0ss on 10/07/2018.
 */
import {HttpServer, FirebaseModule} from "@nu-art/server";
// import {Saml} from "./main/modules/wrappers/saml";

const config = require("./config/dev.json");

export const httpServer = new HttpServer().setup(config.server);
// export const saml = new Saml().setup(config.saml);
export const firebase = new FirebaseModule().setup(config.firebase);
firebase.createAdminSession("adam-test");

