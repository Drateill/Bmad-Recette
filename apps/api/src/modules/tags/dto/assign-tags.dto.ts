import { IsArray, IsNotEmpty, IsUUID, ArrayMinSize } from 'class-validator';

export class AssignTagsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one tag must be provided' })
  @IsUUID('4', { each: true, message: 'Each tag ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Tag IDs array cannot be empty' })
  tagIds!: string[];
}
