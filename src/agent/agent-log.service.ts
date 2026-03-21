import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { AgentLogEntry, AgentLogLevel } from './agent.types';

const MAX_LOG_ENTRIES = 1000;

@Injectable()
export class AgentLogService {
  private readonly entries: AgentLogEntry[] = [];
  private readonly stream$ = new Subject<AgentLogEntry>();

  log(
    level: AgentLogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): AgentLogEntry {
    const entry: AgentLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      level,
      at: new Date().toISOString(),
      message,
      context,
    };

    this.entries.push(entry);
    if (this.entries.length > MAX_LOG_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_LOG_ENTRIES);
    }

    this.stream$.next(entry);
    return entry;
  }

  getRecent(limit = 200): AgentLogEntry[] {
    if (limit <= 0) {
      return [];
    }

    return this.entries.slice(-limit);
  }

  getStream(): Observable<AgentLogEntry> {
    return this.stream$.asObservable();
  }
}
