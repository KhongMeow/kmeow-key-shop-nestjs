import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthType } from './enums/auth-type.enum';
import { Auth } from './decorators/auth.decorator';
import { AuthenticationGuard } from './guards/authentication.guard';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { ActiveUser } from '../decorators/active-user.decorator';
import { SendVerifyEmailDto } from './dto/send-verify-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

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
  @Post('refresh-tokens')
  @UseInterceptors(FileInterceptor(''))
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-out')
  @Auth(AuthType.Bearer)
  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FileInterceptor(''))
  async signOut(@ActiveUser() user: ActiveUserData) {
    const userId = user['sub'];
    return await this.authService.signOut(userId);
  }

  @Post('send-verification-email')
  @UseInterceptors(FileInterceptor(''))
  async sendVerificationEmail(@Body() sendVerifyEmailDto: SendVerifyEmailDto) {
    await this.authService.sendVerificationEmail(sendVerifyEmailDto);
    return { message: 'Verification email sent' };
  }

  @Post('verify-email')
  @UseInterceptors(FileInterceptor(''))
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyEmailDto);
    return { message: 'Email verified successfully' };
  }
}
