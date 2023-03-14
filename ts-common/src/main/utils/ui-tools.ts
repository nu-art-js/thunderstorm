/**
 *
 * Creates a debounce function with a debounce and default timers
 *
 * @remarks
 * This method is a part of ui-utils in ts-common
 *
 * @param func The callback function to be called when the debounce fired.
 * @param timeout The debounce timer
 * @param defaultCallback The default timer for the default event to be fired.
 */
export const debounce = <Args extends any[]>(func: (...params: Args) => void, timeout: number = 500, defaultCallback: number = 1000) => {
    let timer: NodeJS.Timeout;
    let defaultTimer: NodeJS.Timeout | undefined;
    return (...args: Args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func(...args);
            clearTimeout(defaultTimer);
            defaultTimer = undefined;
        }, timeout);
        if (!defaultTimer) {
            defaultTimer = setTimeout(() => {
                func(...args);
                defaultTimer = undefined;
            }, defaultCallback)
        }
    };
}
