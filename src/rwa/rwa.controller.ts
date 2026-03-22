import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  AggregateOrderDto,
  CommitOrderDto,
  CreatePoolDto,
  FinanceOrderDto,
  PrepareBridgeDto,
  RecordRepaymentDto,
  TokenizeOrderDto,
  TriggerSettlementDto,
  VerifyMerchantDto,
} from './dto/rwa.dto';
import { RwaProcurementService } from './rwa-procurement.service';
import type {
  AggregatedOrder,
  MerchantOrderCommitment,
  MerchantProfile,
  PurchasePool,
  RwaLifecycleStatus,
} from './rwa.types';

@Controller('rwa')
export class RwaController {
  constructor(private readonly rwaService: RwaProcurementService) {}

  @Post('merchants/verify')
  verifyMerchant(@Body() dto: VerifyMerchantDto): MerchantProfile {
    return this.rwaService.verifyMerchant(dto);
  }

  @Post('pools')
  createPool(@Body() dto: CreatePoolDto): Promise<PurchasePool> {
    return this.rwaService.createPool(dto);
  }

  @Get('pools/:poolId')
  getPool(@Param('poolId') poolId: string): PurchasePool {
    return this.rwaService.getPool(poolId);
  }

  @Post('commitments')
  commitOrder(@Body() dto: CommitOrderDto): MerchantOrderCommitment {
    return this.rwaService.commitOrder(dto);
  }

  @Post('orders/aggregate')
  aggregate(@Body() dto: AggregateOrderDto): AggregatedOrder {
    return this.rwaService.aggregateDemand(dto);
  }

  @Post('orders/tokenize')
  tokenize(@Body() dto: TokenizeOrderDto): Promise<AggregatedOrder> {
    return this.rwaService.tokenize(dto);
  }

  @Post('orders/finance')
  finance(@Body() dto: FinanceOrderDto): AggregatedOrder {
    return this.rwaService.finance(dto);
  }

  @Post('orders/settle')
  settle(@Body() dto: TriggerSettlementDto): Promise<AggregatedOrder> {
    return this.rwaService.settle(dto);
  }

  @Post('orders/repayment')
  recordRepayment(@Body() dto: RecordRepaymentDto): Promise<AggregatedOrder> {
    return this.rwaService.recordRepayment(dto);
  }

  @Post('orders/bridge')
  prepareBridge(@Body() dto: PrepareBridgeDto): Promise<AggregatedOrder> {
    return this.rwaService.prepareBridge(dto);
  }

  @Get('orders')
  listOrders(): AggregatedOrder[] {
    return this.rwaService.listOrders();
  }

  @Get('orders/:orderId')
  getOrder(@Param('orderId') orderId: string): AggregatedOrder {
    return this.rwaService.getOrder(orderId);
  }

  @Get('status')
  status(): RwaLifecycleStatus {
    return this.rwaService.getLifecycleStatus();
  }

  @Get('logs')
  logs(@Query('limit') limit?: string) {
    const parsed = Number(limit ?? '200');
    const safeLimit = Number.isFinite(parsed) ? parsed : 200;
    return this.rwaService.getLogs(safeLimit);
  }

  @Sse('logs/stream')
  streamLogs(): Observable<MessageEvent> {
    return this.rwaService.streamLogs();
  }
}
