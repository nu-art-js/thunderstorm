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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticModule = exports.AnalyticModule_Class = exports.CollectionName_Configs = void 0;
var BaseDB_ApiGenerator_1 = require("@nu-art/db-api-generator/app-backend/BaseDB_ApiGenerator");
var ts_common_1 = require("@nu-art/ts-common");
var apis_1 = require("@nu-art/db-api-generator/app-backend/apis");
exports.CollectionName_Configs = "analytics";
var AnalyticModule_Class = /** @class */ (function (_super) {
    __extends(AnalyticModule_Class, _super);
    function AnalyticModule_Class() {
        return _super.call(this, exports.CollectionName_Configs, AnalyticModule_Class._validator, "analytic") || this;
    }
    AnalyticModule_Class.prototype.apis = function (pathPart) {
        return [
            new apis_1.ServerApi_Create(this, pathPart),
            new apis_1.ServerApi_Unique(this, pathPart),
            new apis_1.ServerApi_Update(this, pathPart),
            new apis_1.ServerApi_Query(this, pathPart)
        ];
    };
    AnalyticModule_Class._validator = {
        _id: ts_common_1.validateExists(true),
        eventName: ts_common_1.validateExists(true),
        timestamp: ts_common_1.validateExists(true),
        user: undefined,
        screen: undefined,
        eventParams: undefined
    };
    return AnalyticModule_Class;
}(BaseDB_ApiGenerator_1.BaseDB_ApiGenerator));
exports.AnalyticModule_Class = AnalyticModule_Class;
exports.AnalyticModule = new AnalyticModule_Class();
//# sourceMappingURL=AnalyticModule.js.map