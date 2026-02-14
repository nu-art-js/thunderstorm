/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type React from 'react';

export type InferProps<C extends React.Component<any>> = C extends React.Component<infer P> ? P : never;
export type InferState<C extends React.Component<any, any>> = C extends React.Component<any, infer S> ? S : never;
