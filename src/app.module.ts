import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RwaModule } from './rwa/rwa.module';

@Module({
  imports: [AuthModule, RwaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
