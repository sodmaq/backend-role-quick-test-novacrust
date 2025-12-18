import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/wallet-service'),
    WalletsModule,
  ],
})
export class AppModule {}
