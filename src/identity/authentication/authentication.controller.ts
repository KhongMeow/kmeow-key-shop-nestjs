import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthType } from './enums/auth-type.enum';
import { Auth } from './decorators/auth.decorator';
import { SendVerifyEmailDto } from './dto/send-verify-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Permissions } from '../authorization/decorators/permissions.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Auth(AuthType.None)
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('sign-up')
  @UseInterceptors(FileInterceptor(''))
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  @UseInterceptors(FileInterceptor(''))
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  resetPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-tokens')
  @UseInterceptors(FileInterceptor(''))
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-out/:username')
  @Auth(AuthType.Bearer)
  @ApiBearerAuth('access-token')
  @Permissions('change-role-user')
  @UseInterceptors(FileInterceptor(''))
  async signOut(@Param('username') username: string) {
    return await this.authService.signOut(username);
  }

  @Post('send-verification-email')
  @UseInterceptors(FileInterceptor(''))
  async sendVerificationEmail(@Body() sendVerifyEmailDto: SendVerifyEmailDto) {
    return await this.authService.sendVerificationEmail(sendVerifyEmailDto);
  }

  @Post('verify-email')
  @UseInterceptors(FileInterceptor(''))
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.authService.verifyEmail(verifyEmailDto);
  }
}
