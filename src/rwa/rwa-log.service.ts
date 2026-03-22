import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type { RwaLogEntry, RwaLogLevel } from './rwa.types';

const MAX_RWA_LOGS = 1000;

@Injectable()
export class RwaLogService {
  private readonly entries: RwaLogEntry[] = [];
  private readonly stream$ = new Subject<RwaLogEntry>();

  emit(
    level: RwaLogLevel,
    event: string,
    context?: Record<string, unknown>,
  ): RwaLogEntry {
    const entry: RwaLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      at: new Date().toISOString(),
      level,
      event,
      context,
    };

    this.entries.push(entry);
    if (this.entries.length > MAX_RWA_LOGS) {
      this.entries.splice(0, this.entries.length - MAX_RWA_LOGS);
    }

    this.stream$.next(entry);
    return entry;
  }

  getRecent(limit = 200): RwaLogEntry[] {
    if (limit <= 0) {
      return [];
    }

    return this.entries.slice(-limit);
  }

  stream(): Observable<RwaLogEntry> {
    return this.stream$.asObservable();
  }
}
