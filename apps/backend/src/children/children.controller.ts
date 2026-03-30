import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Controller('children')
@UseGuards(FirebaseAuthGuard)
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  getChildren(@CurrentUser() user: DecodedIdToken) {
    return this.childrenService.listChildrenForUser(user);
  }

  @Get(':childId')
  getChild(
    @Param('childId') childId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.childrenService.getChildForUser(childId, user);
  }

  @Post()
  createChild(
    @Body() createChildDto: CreateChildDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.childrenService.createChild(user, createChildDto);
  }

  @Patch(':childId')
  updateChild(
    @Param('childId') childId: string,
    @Body() updateChildDto: UpdateChildDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.childrenService.updateChild(childId, user, updateChildDto);
  }

  @Delete(':childId')
  deleteChild(
    @Param('childId') childId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.childrenService.deleteChild(childId, user);
  }
}
