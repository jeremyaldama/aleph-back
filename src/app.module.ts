import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RwaModule } from './rwa/rwa.module';

@Module({
  imports: [RwaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
