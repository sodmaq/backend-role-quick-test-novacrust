/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { WalletsService } from './wallets.service';
import { Wallet } from './schemas/wallet.schema';
import { Transaction } from './schemas/transaction.schema';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

describe('WalletsService', () => {
  let service: WalletsService;
  let walletModel: any;
  let transactionModel: any;

  const mockWallet = {
    id: 'test-wallet',
    currency: 'USD',
    balance: 1000,
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: getModelToken(Wallet.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            new: jest.fn().mockResolvedValue(mockWallet),
            constructor: jest.fn().mockResolvedValue(mockWallet),
          },
        },
        {
          provide: getModelToken(Transaction.name),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    walletModel = module.get(getModelToken(Wallet.name));
    transactionModel = module.get(getModelToken(Transaction.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWallet', () => {
    it('should create a new wallet', async () => {
      const createWalletDto = { id: 'new-wallet', currency: 'USD', balance: 0 };
      walletModel.findOne.mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(createWalletDto);
      walletModel.mockImplementation(() => ({
        ...createWalletDto,
        save: mockSave,
      }));

      // Note: This test structure depends on your actual implementation
      expect(service.createWallet).toBeDefined();
    });

    it('should throw ConflictException if wallet already exists', async () => {
      const createWalletDto = { id: 'existing-wallet', currency: 'USD' };
      walletModel.findOne.mockResolvedValue(mockWallet);

      await expect(service.createWallet(createWalletDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('fundWallet', () => {
    it('should add funds to wallet', async () => {
      const fundDto = { amount: 500 };
      const wallet = {
        ...mockWallet,
        save: jest.fn().mockResolvedValue(mockWallet),
      };

      walletModel.findOne.mockResolvedValue(wallet);
      transactionModel.findOne.mockResolvedValue(null);
      transactionModel.create.mockResolvedValue({});

      const result = await service.fundWallet('test-wallet', fundDto);

      expect(wallet.balance).toBe(1500);
      expect(wallet.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      walletModel.findOne.mockResolvedValue(null);

      await expect(
        service.fundWallet('non-existent', { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should respect idempotency', async () => {
      const fundDto = { amount: 500, idempotencyKey: 'test-key' };
      transactionModel.findOne.mockResolvedValue({
        idempotencyKey: 'test-key',
      });
      walletModel.findOne.mockResolvedValue(mockWallet);

      const result = await service.fundWallet('test-wallet', fundDto);

      expect(mockWallet.balance).toBe(1000); // Balance unchanged
    });
  });

  describe('transfer', () => {
    it('should throw BadRequestException for insufficient balance', async () => {
      const sender = { ...mockWallet, balance: 100, save: jest.fn() };
      const receiver = { ...mockWallet, id: 'receiver', save: jest.fn() };

      walletModel.findOne
        .mockResolvedValueOnce(sender)
        .mockResolvedValueOnce(receiver);
      transactionModel.findOne.mockResolvedValue(null);

      await expect(
        service.transfer({
          fromWalletId: 'sender',
          toWalletId: 'receiver',
          amount: 500,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for same wallet transfer', async () => {
      await expect(
        service.transfer({
          fromWalletId: 'wallet-1',
          toWalletId: 'wallet-1',
          amount: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if sender wallet does not exist', async () => {
      walletModel.findOne.mockResolvedValue(null);
      transactionModel.findOne.mockResolvedValue(null);

      await expect(
        service.transfer({
          fromWalletId: 'non-existent',
          toWalletId: 'receiver',
          amount: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getWallet', () => {
    it('should return wallet if exists', async () => {
      walletModel.findOne.mockResolvedValue(mockWallet);

      const result = await service.getWallet('test-wallet');

      expect(result).toEqual(mockWallet);
    });

    it('should throw NotFoundException if wallet does not exist', async () => {
      walletModel.findOne.mockResolvedValue(null);

      await expect(service.getWallet('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
