import { jsx as _jsx } from "react/jsx-runtime";
/*
 * Thunderstorm form package.
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { ComponentSync } from '@nu-art/thunder-widgets';
export class TS_Form extends ComponentSync {
    deriveStateFromProps(nextProps) {
        const state = this.state ? { ...this.state } : {};
        return state;
    }
    render() {
        return _jsx("div", {});
    }
}
//# sourceMappingURL=TS_Form.js.map