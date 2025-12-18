import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionType,
} from './schemas/transaction.schema';
import { CreateWalletDto, FundWalletDto, TransferDto } from './dto/wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
  ) {}

  async createWallet(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const existingWallet = await this.walletModel.findOne({
      id: createWalletDto.id,
    });
    if (existingWallet) {
      throw new ConflictException(
        `Wallet with id ${createWalletDto.id} already exists`,
      );
    }

    const wallet = new this.walletModel({
      ...createWalletDto,
      currency: createWalletDto.currency || 'USD',
      balance: createWalletDto.balance || 0,
    });

    return wallet.save();
  }

  async fundWallet(
    walletId: string,
    fundWalletDto: FundWalletDto,
  ): Promise<Wallet> {
    // Check idempotency
    if (fundWalletDto.idempotencyKey) {
      const existingTransaction = await this.transactionModel.findOne({
        idempotencyKey: fundWalletDto.idempotencyKey,
      });
      if (existingTransaction) {
        return this.getWallet(walletId);
      }
    }

    const wallet = await this.walletModel.findOne({ id: walletId });
    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }

    wallet.balance += fundWalletDto.amount;
    await wallet.save();

    // Record transaction
    await this.transactionModel.create({
      walletId,
      type: TransactionType.FUND,
      amount: fundWalletDto.amount,
      balanceAfter: wallet.balance,
      idempotencyKey: fundWalletDto.idempotencyKey,
      reference: fundWalletDto.reference,
    });

    return wallet;
  }

  async transfer(
    transferDto: TransferDto,
  ): Promise<{ sender: Wallet; receiver: Wallet }> {
    const { fromWalletId, toWalletId, amount, idempotencyKey, reference } =
      transferDto;

    if (fromWalletId === toWalletId) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }

    // Check idempotency
    if (idempotencyKey) {
      const existingTransaction = await this.transactionModel.findOne({
        idempotencyKey,
      });
      if (existingTransaction) {
        const sender = await this.getWallet(fromWalletId);
        const receiver = await this.getWallet(toWalletId);
        return { sender, receiver };
      }
    }

    // Fetch both wallets
    const sender = await this.walletModel.findOne({ id: fromWalletId });
    if (!sender) {
      throw new NotFoundException(`Sender wallet ${fromWalletId} not found`);
    }

    const receiver = await this.walletModel.findOne({ id: toWalletId });
    if (!receiver) {
      throw new NotFoundException(`Receiver wallet ${toWalletId} not found`);
    }

    // Check sufficient balance
    if (sender.balance < amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${sender.balance}, Required: ${amount}`,
      );
    }

    // Perform transfer
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    // Record transactions for both wallets
    await this.transactionModel.create([
      {
        walletId: fromWalletId,
        type: TransactionType.TRANSFER_OUT,
        amount: -amount,
        toWalletId,
        balanceAfter: sender.balance,
        idempotencyKey,
        reference,
      },
      {
        walletId: toWalletId,
        type: TransactionType.TRANSFER_IN,
        amount: amount,
        fromWalletId,
        balanceAfter: receiver.balance,
        idempotencyKey,
        reference,
      },
    ]);

    return { sender, receiver };
  }

  async getWallet(walletId: string): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({ id: walletId });
    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }
    return wallet;
  }

  async getWalletWithTransactions(walletId: string): Promise<{
    wallet: Wallet;
    transactions: Transaction[];
  }> {
    const wallet = await this.getWallet(walletId);
    const transactions = await this.transactionModel
      .find({ walletId })
      .sort({ createdAt: -1 })
      .exec();

    return { wallet, transactions };
  }
}
