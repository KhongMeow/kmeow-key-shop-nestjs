import { BadGatewayException, ConflictException, Injectable } from '@nestjs/common';

@Injectable()
export class GlobalService {

  async convertToSlug(name: string): Promise<string> {
    return name.toLowerCase().replace(' ', '-');
  }
}
