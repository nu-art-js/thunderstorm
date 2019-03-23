import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {ModuleManager, ModuleType} from "@nu-art/core";
import './res/styles/styles.scss';
import {App} from "./app/App";
import {AppWrapper, BrowserHistoryModule, Fronzy, HttpModule, LocalizationModule, ResourcesModule, StorageModule} from "@nu-art/fronzy";

const modules: ModuleType[] = [HttpModule, LocalizationModule, StorageModule, BrowserHistoryModule, ResourcesModule];
ModuleManager.getInstance().setConfig(require("./config")).setModuleTypes(...modules).init();

const fronzy = new Fronzy();
fronzy.setMainApp(App);

ReactDOM.render(
	<AppWrapper fronzy={fronzy}/>,
	document.getElementById('app')
);
