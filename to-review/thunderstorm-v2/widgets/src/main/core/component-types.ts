/*
 * @nu-art/thunder-widgets - Thunder Widgets and Components
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Component} from 'react';

export type InferProps<C extends Component<any>> = C extends Component<infer P> ? P : never;
export type InferState<C extends Component<any, any>> = C extends Component<any, infer S> ? S : never;
export type DefaultProps<C extends Component<any>> = Partial<InferProps<C>>;
