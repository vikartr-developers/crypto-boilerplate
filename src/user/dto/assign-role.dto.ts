import { IsString, IsArray, ArrayNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @IsString()
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roleIds: string[];
}
