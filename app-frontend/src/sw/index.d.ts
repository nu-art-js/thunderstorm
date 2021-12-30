declare const config: any;
declare enum LogLevel {
    INFO = 0,
    ERROR = 1
}
declare function myLog(level: LogLevel, ...text: any[]): void;
declare function myLogError(...text: any[]): void;
declare function myLogInfo(...text: any[]): void;
declare const isSupported: any;
