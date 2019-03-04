import Checkbox from './ui/Checkbox';
import ColorPicker from './ui/ColorPicker';
import DropDown from './ui/DropDown';
import InputTextField from './ui/InputTextField';
import TreeNode from './ui/TreeNode';
import DragAndDrop from './ui/DragAndDrop';
import Slider from './ui/Slider';
import BaseComponent from './core/BaseComponent';

import Crypto from './core/crypto';
import Module from './core/Module';
import Interface from './core/Interface';
import EventDispatcher from './core/EventDispatcher';

import BrowserHistoryModule from './modules/BrowserHistoryModule';
import LocalizationModule from './modules/LocalizationModule';
import HttpModule from './modules/HttpModule';
import CookiesModule from './modules/CookiesModule';
import StorageModule from './modules/StorageModule';
import ResourcesModule from './modules/ResourcesModule';
import UndoRedoModule from './modules/UndoRedoModule';
import AnalyticsModule from './modules/AnalyticsModule';

import React from "react";
import PropTypes from "prop-types";
import {css as _css} from 'emotion'
import {Redirect} from 'react-router';
const css = (...objects) => {
	if (typeof objects[0][0] === "string" || objects[0][0] instanceof String)
		return _css(objects[0][0]);

	return _css(Object.assign({}, ...objects));
};

export {
	React,
	PropTypes,
	css,
	Redirect,

	// UI
	Slider,
	Checkbox,
	ColorPicker,
	DropDown,
	InputTextField,
	TreeNode,
	DragAndDrop,
	BaseComponent,

	// core
	Crypto,
	Module,
	EventDispatcher,
	Interface,

	// Modules
	BrowserHistoryModule,
	LocalizationModule,
	HttpModule,
	CookiesModule,
	StorageModule,
	ResourcesModule,
	UndoRedoModule,
	AnalyticsModule,
}
