import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MerchantVerificationService } from './merchant-verification.service';
import { OrderEncryptionService } from './order-encryption.service';
import { PrivateL1ContractsService } from './private-l1-contracts.service';
import { RwaController } from './rwa.controller';
import { RwaLogService } from './rwa-log.service';
import { RwaProcurementService } from './rwa-procurement.service';

@Module({
  imports: [AuthModule],
  controllers: [RwaController],
  providers: [
    RwaProcurementService,
    MerchantVerificationService,
    OrderEncryptionService,
    PrivateL1ContractsService,
    RwaLogService,
  ],
  exports: [RwaProcurementService],
})
export class RwaModule {}
