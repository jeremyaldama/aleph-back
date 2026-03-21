import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AutonomousAgentService } from './autonomous-agent.service';
import type { AgentLogEntry, AgentStatus } from './agent.types';
import type { StartAgentDto } from './dto/start-agent.dto';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly autonomousAgentService: AutonomousAgentService,
  ) {}

  @Post('start')
  start(@Body() body: StartAgentDto): AgentStatus {
    return this.autonomousAgentService.start(body);
  }

  @Post('stop')
  stop(): AgentStatus {
    return this.autonomousAgentService.stop();
  }

  @Post('cycle')
  async cycle(): Promise<{ status: AgentStatus }> {
    await this.autonomousAgentService.runSingleCycle();
    return { status: this.autonomousAgentService.getStatus() };
  }

  @Get('status')
  status(): AgentStatus {
    return this.autonomousAgentService.getStatus();
  }

  @Get('logs')
  logs(@Query('limit') limit?: string): AgentLogEntry[] {
    const parsed = Number(limit ?? '200');
    const safeLimit = Number.isFinite(parsed) ? parsed : 200;
    return this.autonomousAgentService.getLogs(safeLimit);
  }

  @Sse('logs/stream')
  logsStream(): Observable<MessageEvent> {
    return this.autonomousAgentService.getLogsStream();
  }
}
