import { Controller, Get, Post } from '@nestjs/common';
import { SetupService } from './setup.service';
import { Auth } from 'src/identity/authentication/decorators/auth.decorator';
import { AuthType } from 'src/identity/authentication/enums/auth-type.enum';

@Auth(AuthType.None)
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get()
  async runSetup() {
    await this.setupService.executeSetup();
    return { message: 'Setup completed!' };
  }
}
