export const GPT_Model = [
// GPT-4 series
    'gpt-4',
    'gpt-4-0613',
    'gpt-4-32k',
    'gpt-4-32k-0613',
    'gpt-4-turbo',
    'gpt-4-1106-preview',
    'gpt-4-0125-preview',
    'gpt-4o',

    // GPT-3.5 series
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
    'gpt-3.5-turbo-0301',
    'gpt-3.5-turbo-0613',
    'gpt-3.5-turbo-1106',
    'gpt-3.5-turbo-0125',

    // Embedding models
    'text-embedding-ada-002',
    'text-embedding-3-small',
    'text-embedding-3-large',

    // Moderation
    'text-moderation-latest',
    'text-moderation-stable',

    // Legacy completions (rarely used today)
    'text-davinci-003',
    'text-davinci-002',
    'code-davinci-002',
    'code-cushman-001',
] as const

export type GPT_Model = typeof GPT_Model[number];