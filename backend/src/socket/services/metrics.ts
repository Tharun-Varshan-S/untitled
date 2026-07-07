import { logger } from '../../utils/logger';

class SocketMetrics {
  private activeConnections = 0;
  private authFailures = 0;
  private messagesSent = 0;
  private messagesReceived = 0;
  private reconnects = 0;
  
  // Connection durations tracking
  private totalConnectionDurationMs = 0;
  private totalClosedConnections = 0;

  // Project rooms tracked roughly
  private connectionsPerProject = new Map<string, number>();

  public incrementActiveConnections(): void {
    this.activeConnections++;
  }

  public decrementActiveConnections(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  public incrementAuthFailures(): void {
    this.authFailures++;
  }

  public incrementMessagesSent(count: number = 1): void {
    this.messagesSent += count;
  }

  public incrementMessagesReceived(): void {
    this.messagesReceived++;
  }

  public incrementReconnects(): void {
    this.reconnects++;
  }

  public recordConnectionDuration(durationMs: number): void {
    this.totalConnectionDurationMs += durationMs;
    this.totalClosedConnections++;
  }

  public trackProjectJoin(projectId: string): void {
    const current = this.connectionsPerProject.get(projectId) || 0;
    this.connectionsPerProject.set(projectId, current + 1);
  }

  public trackProjectLeave(projectId: string): void {
    const current = this.connectionsPerProject.get(projectId) || 0;
    if (current <= 1) {
      this.connectionsPerProject.delete(projectId);
    } else {
      this.connectionsPerProject.set(projectId, current - 1);
    }
  }

  public getMetrics() {
    const avgDuration = this.totalClosedConnections > 0 
      ? Math.round(this.totalConnectionDurationMs / this.totalClosedConnections) 
      : 0;

    return {
      activeConnections: this.activeConnections,
      authFailures: this.authFailures,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      reconnects: this.reconnects,
      avgConnectionDurationMs: avgDuration,
      activeProjectsCount: this.connectionsPerProject.size,
    };
  }

  public dumpMetrics(): void {
    const metrics = this.getMetrics();
    logger.info(`[Socket Metrics] Active: ${metrics.activeConnections} | Reconnects: ${metrics.reconnects} | Sent: ${metrics.messagesSent} | Rcvd: ${metrics.messagesReceived} | Auth Fails: ${metrics.authFailures} | Avg Duration (ms): ${metrics.avgConnectionDurationMs}`);
  }
}

export const socketMetrics = new SocketMetrics();
