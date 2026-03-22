import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
import {
  AggregatedOrderResponseDto,
  MerchantOrderCommitmentResponseDto,
  MerchantProfileResponseDto,
  PurchasePoolResponseDto,
  RetailerDashboardProductsResponseDto,
  RwaLifecycleStatusResponseDto,
  RwaLogEntryResponseDto,
} from './dto/rwa-response.dto';
import { RwaProcurementService } from './rwa-procurement.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId, CurrentUserRole } from '../auth/current-user.decorator';
import type { UserRole } from '../auth/auth.types';
import type {
  AggregatedOrder,
  MerchantOrderCommitment,
  MerchantProfile,
  PurchasePool,
  RetailerDashboardProducts,
  RwaLifecycleStatus,
} from './rwa.types';

@ApiTags('rwa')
@Controller('rwa')
export class RwaController {
  constructor(private readonly rwaService: RwaProcurementService) {}

  @Get('retailer/products')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Retailer dashboard first page: list products (mocked)',
    description:
      'Core userflow: after retailer login/signup, call this endpoint to render the first dashboard page with products available to the retailer. Data is mocked for now.',
  })
  @ApiOkResponse({ type: RetailerDashboardProductsResponseDto })
  getRetailerDashboardProducts(
    @CurrentUserId() userId: string,
    @CurrentUserRole() role: UserRole,
  ): RetailerDashboardProducts {
    return this.rwaService.getRetailerDashboardProducts(userId, role);
  }

  @Post('merchants/verify')
  @ApiOperation({
    summary: 'Verify merchant eligibility for permissioned pools',
  })
  @ApiBody({ type: VerifyMerchantDto })
  @ApiOkResponse({ type: MerchantProfileResponseDto })
  verifyMerchant(@Body() dto: VerifyMerchantDto): MerchantProfile {
    return this.rwaService.verifyMerchant(dto);
  }

  @Post('pools')
  @ApiOperation({
    summary: 'Create a permissioned purchase pool on private L1',
  })
  @ApiBody({ type: CreatePoolDto })
  @ApiOkResponse({ type: PurchasePoolResponseDto })
  createPool(@Body() dto: CreatePoolDto): Promise<PurchasePool> {
    return this.rwaService.createPool(dto);
  }

  @Get('pools/:poolId')
  @ApiOperation({ summary: 'Get one purchase pool by id' })
  @ApiOkResponse({ type: PurchasePoolResponseDto })
  getPool(@Param('poolId') poolId: string): PurchasePool {
    return this.rwaService.getPool(poolId);
  }

  @Post('commitments')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Commit encrypted merchant order details into a pool',
    description:
      'Authenticated retailer flow. If merchantId is omitted, backend uses the current user id from bearer token.',
  })
  @ApiBody({ type: CommitOrderDto })
  @ApiOkResponse({ type: MerchantOrderCommitmentResponseDto })
  commitOrder(
    @Body() dto: CommitOrderDto,
    @CurrentUserId() userId: string,
  ): MerchantOrderCommitment {
    return this.rwaService.commitOrder({
      ...dto,
      merchantId: dto.merchantId ?? userId,
    });
  }

  @Post('orders/aggregate')
  @ApiOperation({
    summary: 'Aggregate pool commitments into one structured order',
  })
  @ApiBody({ type: AggregateOrderDto })
  @ApiOkResponse({ type: AggregatedOrderResponseDto })
  aggregate(@Body() dto: AggregateOrderDto): AggregatedOrder {
    return this.rwaService.aggregateDemand(dto);
  }

  @Post('orders/tokenize')
  @ApiOperation({
    summary: 'Tokenize aggregated order into entitlement and repayment tokens',
  })
  @ApiBody({ type: TokenizeOrderDto })
  @ApiOkResponse({ type: AggregatedOrderResponseDto })
  tokenize(@Body() dto: TokenizeOrderDto): Promise<AggregatedOrder> {
    return this.rwaService.tokenize(dto);
  }

  @Post('orders/finance')
  @ApiOperation({ summary: 'Register financing terms for an aggregated order' })
  @ApiBody({ type: FinanceOrderDto })
  @ApiOkResponse({ type: AggregatedOrderResponseDto })
  finance(@Body() dto: FinanceOrderDto): AggregatedOrder {
    return this.rwaService.finance(dto);
  }

  @Post('orders/settle')
  @ApiOperation({
    summary: 'Trigger settlement when contract conditions are met',
  })
  @ApiBody({ type: TriggerSettlementDto })
  @ApiOkResponse({ type: AggregatedOrderResponseDto })
  settle(@Body() dto: TriggerSettlementDto): Promise<AggregatedOrder> {
    return this.rwaService.settle(dto);
  }

  @Post('orders/repayment')
  @ApiOperation({ summary: 'Record one repayment event for an order' })
  @ApiBody({ type: RecordRepaymentDto })
  @ApiOkResponse({ type: AggregatedOrderResponseDto })
  recordRepayment(@Body() dto: RecordRepaymentDto): Promise<AggregatedOrder> {
    return this.rwaService.recordRepayment(dto);
  }

  @Post('orders/bridge')
  @ApiOperation({
    summary:
      'Prepare order asset for bridge interoperability to public Avalanche',
  })
  @ApiBody({ type: PrepareBridgeDto })
  @ApiOkResponse({ type: AggregatedOrderResponseDto })
  prepareBridge(@Body() dto: PrepareBridgeDto): Promise<AggregatedOrder> {
    return this.rwaService.prepareBridge(dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all aggregated orders' })
  @ApiOkResponse({ type: AggregatedOrderResponseDto, isArray: true })
  listOrders(): AggregatedOrder[] {
    return this.rwaService.listOrders();
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get one aggregated order by id' })
  @ApiOkResponse({ type: AggregatedOrderResponseDto })
  getOrder(@Param('orderId') orderId: string): AggregatedOrder {
    return this.rwaService.getOrder(orderId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get global lifecycle metrics' })
  @ApiOkResponse({ type: RwaLifecycleStatusResponseDto })
  status(): RwaLifecycleStatus {
    return this.rwaService.getLifecycleStatus();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get recent RWA lifecycle logs' })
  @ApiQuery({ name: 'limit', required: false, example: 200 })
  @ApiOkResponse({ type: RwaLogEntryResponseDto, isArray: true })
  logs(@Query('limit') limit?: string) {
    const parsed = Number(limit ?? '200');
    const safeLimit = Number.isFinite(parsed) ? parsed : 200;
    return this.rwaService.getLogs(safeLimit);
  }

  @Sse('logs/stream')
  @ApiOperation({ summary: 'Stream RWA logs with Server-Sent Events' })
  @ApiProduces('text/event-stream')
  @ApiOkResponse({ description: 'SSE stream of RWA log entries' })
  streamLogs(): Observable<MessageEvent> {
    return this.rwaService.streamLogs();
  }
}
