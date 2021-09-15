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

import {CheckboxOption} from "@nu-art/thunderstorm/frontend";

export type ChckbxOption = {
    label: string
    value: string
}

export const options: CheckboxOption<ChckbxOption>[] = [
    {value: {
            label: "element 1",
            value: "el1"
        }
    },
    {value: {
            label: "element 2",
            value: "el2"
        }
    },
    {value: {
            label: "element 3",
            value: "el3"
        }
    },
    {value: {
            label: "element 4",
            value: "el4"
        }
    },
    {value: {
            label: "element 5",
            value: "el5"
        }
    },
    {value: {
            label: "element 6",
            value: "el6"
        }
    },
    {value: {
            label: "element 7",
            value: "el7"
        }
    },
    {value: {
            label: "element 8",
            value: "el8"
        }
    },
    {value: {
            label: "element 9",
            value: "el9"
        }
    },
    {value: {
            label: "element 10",
            value: "el10"
        }
    },
    {value: {
            label: "element 11",
            value: "el11"
        }
    },
    {value: {
            label: "element 12",
            value: "el12"
        }
    },
    {value: {
            label: "element 13",
            value: "el13"
        }
    },
    {value: {
            label: "element 14",
            value: "el14"
        }
    },
    {value: {
            label: "element 15",
            value: "el15"
        }
    },
    {value: {
            label: "element 16",
            value: "el16"
        }
    },
    {value: {
            label: "element 17",
            value: "el17"
        }
    }
];

export const lessOptions: CheckboxOption<ChckbxOption>[] = [
    {value: {
            label: "element 1",
            value: "el1"
        }
    },
    {value: {
            label: "element 2",
            value: "el2"
        }
    },
    {value: {
            label: "element 3",
            value: "el3"
        }
    },
]

export const lessOptions2: CheckboxOption<ChckbxOption>[] = [
    {value: {
            label: "One",
            value: "el1"
        }
    },
    {value: {
            label: "Two",
            value: "el2"
        }
    },
    {value: {
            label: "Three",
            value: "el3"
        }
    },
]