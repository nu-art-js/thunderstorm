"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = exports.AnalyticsModule_Class = exports.TIME = exports.VIEW_TIME = exports.PAGE_MOUNT = exports.dispatch_onAnalyticsQuery = void 0;
var frontend_1 = require("@nu-art/db-api-generator/frontend");
var frontend_2 = require("@nu-art/thunderstorm/frontend");
var ts_common_1 = require("@nu-art/ts-common");
exports.dispatch_onAnalyticsQuery = new frontend_2.ThunderDispatcher('__onAnalyticsQuery');
exports.PAGE_MOUNT = "page_mount";
exports.VIEW_TIME = "view_time";
exports.TIME = "time";
var AnalyticsModule_Class = /** @class */ (function (_super) {
    __extends(AnalyticsModule_Class, _super);
    function AnalyticsModule_Class() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.items = undefined;
        _this.screenStart = undefined;
        return _this;
    }
    AnalyticsModule_Class.prototype.getItems = function () {
        return this.items;
    };
    AnalyticsModule_Class.prototype.pageMount = function () {
        this.logEvent(exports.PAGE_MOUNT);
        this.start = ts_common_1.currentTimeMillies();
    };
    AnalyticsModule_Class.prototype.visibilityStart = function () {
        this.start = ts_common_1.currentTimeMillies();
    };
    AnalyticsModule_Class.prototype.visibilityStop = function () {
        if (!this.start)
            return;
        var delta = ts_common_1.currentTimeMillies() - this.start;
        this.logEvent(exports.VIEW_TIME, { time: delta });
    };
    AnalyticsModule_Class.prototype.setUser = function (user) {
        this.user = user;
    };
    AnalyticsModule_Class.prototype.setCurrentScreen = function (screen) {
        var now = ts_common_1.currentTimeMillies();
        if (this.screenStart && this.currentScreen) {
            var start = this.screenStart;
            var delta = now - start;
            this.logEvent("screen_view_time", { screen: this.currentScreen, time: delta });
        }
        this.currentScreen = screen;
        this.screenStart = now;
    };
    AnalyticsModule_Class.prototype.logEvent = function (eventName, eventParams) {
        var timestamp = ts_common_1.currentTimeMillies();
        this.create({
            eventName: eventName,
            eventParams: eventParams,
            timestamp: timestamp,
            user: this.user,
            screen: this.currentScreen
        });
    };
    AnalyticsModule_Class.prototype.onEntryCreated = function (response) {
        return Promise.resolve(undefined);
    };
    AnalyticsModule_Class.prototype.onEntryDeleted = function (response) {
        return Promise.resolve(undefined);
    };
    AnalyticsModule_Class.prototype.onEntryUpdated = function (response) {
        return Promise.resolve(undefined);
    };
    AnalyticsModule_Class.prototype.onGotUnique = function (response) {
        return Promise.resolve(undefined);
    };
    AnalyticsModule_Class.prototype.onQueryReturned = function (response) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.items = response;
                exports.dispatch_onAnalyticsQuery.dispatchUI([]);
                return [2 /*return*/];
            });
        });
    };
    AnalyticsModule_Class.prototype.currentTimeMillies = function () {
        var date = new Date();
        return date.getTime();
    };
    return AnalyticsModule_Class;
}(frontend_1.BaseDB_ApiGeneratorCaller));
exports.AnalyticsModule_Class = AnalyticsModule_Class;
exports.AnalyticsModule = new AnalyticsModule_Class({ key: "analytic", relativeUrl: "/v1/analytic" });
//# sourceMappingURL=AnalyticsModule.js.map