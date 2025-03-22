import { PartialType } from '@nestjs/swagger';
import { CreateLicenseKeyDto } from './create-license-key.dto';

export class UpdateLicenseKeyDto extends PartialType(CreateLicenseKeyDto) {}
