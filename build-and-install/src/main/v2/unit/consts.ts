import {WatchEventType} from './types';

export const WatchEvent_Add: WatchEventType = 'add';
export const WatchEvent_Update: WatchEventType = 'update';
export const WatchEvent_RemoveDir: WatchEventType = 'remove_dir';
export const WatchEvent_RemoveFile: WatchEventType = 'remove_file';
export const WatchEvent_Ready: WatchEventType = 'ready';