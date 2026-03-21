import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentLogService } from './agent-log.service';
import { AutonomousAgentService } from './autonomous-agent.service';
import { AvalanchePaymentService } from './avalanche-payment.service';
import { X402ClientService } from './x402-client.service';

@Module({
  controllers: [AgentController],
  providers: [
    AgentLogService,
    AutonomousAgentService,
    X402ClientService,
    AvalanchePaymentService,
  ],
  exports: [AutonomousAgentService],
})
export class AgentModule {}
