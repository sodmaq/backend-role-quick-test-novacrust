import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  FUND = 'FUND',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  walletId: string;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop()
  fromWalletId?: string;

  @Prop()
  toWalletId?: string;

  @Prop()
  idempotencyKey?: string;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop()
  reference?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
