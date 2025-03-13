import { PartialType } from '@nestjs/mapped-types';
import { CreateLicenseKeyDto } from './create-license-key.dto';

export class UpdateLicenseKeyDto extends PartialType(CreateLicenseKeyDto) {}
