import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { RequirePermissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { CreatePersonaDto } from "./dto/create-persona.dto";
import { PublishPersonaDto } from "./dto/publish-persona.dto";
import { UpdatePersonaDto } from "./dto/update-persona.dto";
import { PersonasService } from "./personas.service";

type Authed = Request & { user: { sub: string; role: UserRole } };

@Controller()
export class PersonasController {
  constructor(private readonly personas: PersonasService) {}

  @Get("personas")
  async list() {
    const personas = await this.personas.listPublished();
    return { personas };
  }

  @Get("personas/:slug")
  async getOne(@Param("slug") slug: string) {
    const p = await this.personas.getPublishedBySlug(slug);
    if (!p) throw new NotFoundException();
    return p;
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @RequirePermissions("personas.view")
  @Get("admin/personas")
  async adminList() {
    const personas = await this.personas.listAll();
    return { personas };
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @RequirePermissions("personas.view")
  @Get("admin/personas/:id")
  async adminGetOne(@Param("id") id: string) {
    const persona = await this.personas.getById(id);
    if (!persona) throw new NotFoundException();
    return persona;
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @RequirePermissions("personas.create")
  @Post("admin/personas")
  create(@Req() req: Authed, @Body() body: CreatePersonaDto) {
    return this.personas.create(body, req.user.sub);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @RequirePermissions("personas.edit")
  @Patch("admin/personas/:id")
  update(@Req() req: Authed, @Param("id") id: string, @Body() body: UpdatePersonaDto) {
    return this.personas.update(id, body, req.user.sub);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @RequirePermissions("personas.publish")
  @Patch("admin/personas/:id/publish")
  publish(@Req() req: Authed, @Param("id") id: string, @Body() body: PublishPersonaDto) {
    return this.personas.update(id, { isPublished: body.isPublished }, req.user.sub);
  }

  @UseGuards(AuthGuard("jwt"), RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @RequirePermissions("personas.delete")
  @Delete("admin/personas/:id")
  remove(@Req() req: Authed, @Param("id") id: string) {
    return this.personas.remove(id, req.user.sub);
  }
}
