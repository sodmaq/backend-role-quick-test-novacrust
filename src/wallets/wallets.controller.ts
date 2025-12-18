import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto, FundWalletDto, TransferDto } from './dto/wallet.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createWallet(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.createWallet(createWalletDto);
  }

  @Post(':id/fund')
  @HttpCode(HttpStatus.OK)
  fundWallet(@Param('id') id: string, @Body() fundWalletDto: FundWalletDto) {
    return this.walletsService.fundWallet(id, fundWalletDto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  transfer(@Body() transferDto: TransferDto) {
    return this.walletsService.transfer(transferDto);
  }

  @Get(':id')
  getWallet(@Param('id') id: string) {
    return this.walletsService.getWalletWithTransactions(id);
  }
}
