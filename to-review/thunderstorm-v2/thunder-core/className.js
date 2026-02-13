/*
 * @nu-art/thunder-core - Thunderstorm core types: dispatcher and mouse utilities
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { filterInstances } from '@nu-art/ts-common';
/**
 * Builds a single className string from multiple class tokens.
 * Falsy values are omitted; truthy strings are joined with spaces.
 */
export function _className(...classes) {
    return filterInstances(classes.filter(c => !!c)).join(' ');
}
