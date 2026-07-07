export declare const SocketEvents: {
    readonly JOIN_PROJECT: "join-project";
    readonly LEAVE_PROJECT: "leave-project";
    readonly NEW_LOG: "new-log";
    readonly ANALYTICS_UPDATE: "analytics-update";
    readonly CONNECT: "connect";
    readonly DISCONNECT: "disconnect";
    readonly CONNECT_ERROR: "connect_error";
};
export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];
//# sourceMappingURL=events.d.ts.map