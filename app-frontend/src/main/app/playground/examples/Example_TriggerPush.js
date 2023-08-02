"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Example_TriggerPush = void 0;
/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const React = require("react");
const frontend_1 = require("@nu-art/thunderstorm/frontend");
const ts_common_1 = require("@nu-art/ts-common");
const ExampleModule_1 = require("@modules/ExampleModule");
const frontend_2 = require("@nu-art/push-pub-sub/frontend");
class Example_TriggerPush_Renderer extends frontend_1.ComponentSync {
    deriveStateFromProps(nextProps) {
        return { notifications: [] };
    }
    render() {
        return React.createElement("div", { className: 'll_h_v' },
            React.createElement("button", { onClick: frontend_2.ModuleFE_PushPubSub.requestPermissions }, "request permissions"),
            React.createElement("button", { onClick: () => this.registerForPush() }, "Register"),
            React.createElement("button", { onClick: () => this.triggerPush() }, "Trigger Push"),
            React.createElement("button", { onClick: () => this.triggerPush(ts_common_1.Second) }, "Trigger Delayed Push"),
            this.state.notifications.map(_notification => React.createElement("div", null, _notification.read.toString())));
    }
    triggerPush(timeout) {
        return (0, ts_common_1._setTimeout)(() => {
            ExampleModule_1.ExampleModule.testPush();
        }, timeout);
    }
    registerForPush() {
        const mySubscriptions = [{
                pushKey: 'key',
                props: { a: 'prop' }
            }, {
                pushKey: 'test',
                props: { id: 'test1' }
            }];
        frontend_2.ModuleFE_PushPubSub.v1.registerAll(mySubscriptions);
    }
}
exports.Example_TriggerPush = { renderer: Example_TriggerPush_Renderer, name: 'Trigger Push' };
//# sourceMappingURL=Example_TriggerPush.js.map