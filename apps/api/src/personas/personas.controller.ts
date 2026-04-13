import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request } from "express";
import { Prisma, UserRole } from "@prisma/client";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { RequirePermissions } from "../rbac/require-permissions.decorator";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { CreatePersonaDto } from "./dto/create-persona.dto";
import { GrantPersonaAccessDto } from "./dto/grant-persona-access.dto";
import { PublishPersonaDto } from "./dto/publish-persona.dto";
import { UpsertPersonaTrainingDto } from "./dto/upsert-persona-training.dto";
import { UpdatePersonaDto } from "./dto/update-persona.dto";
import { MemoryService } from "../memory/memory.service";
import { PersonaContextService } from "./persona-context.service";
import { PersonasService } from "./personas.service";

type Authed = Request & { user: { sub: string; role: UserRole } };

@Controller()
export class PersonasController {
  constructor(
    private readonly personas: PersonasService,
    private readonly personaContext: PersonaContextService,
    private readonly memory: MemoryService
  ) {}

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

  @UseGuards(AuthGuard("jwt"))
  @Get("users/me/persona-access")
  listMyPersonaAccess(@Req() req: Authed) {
    return this.personaContext.listUserAccessiblePersonas(req.user.sub);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("personas/:slug/training")
  async getMyTraining(@Req() req: Authed, @Param("slug") slug: string) {
    const persona = await this.personaContext.resolvePersonaForUserBySlug(
      req.user.sub,
      slug.toLowerCase()
    );
    const training = await this.personaContext.getUserTraining(req.user.sub, persona.id);
    return {
      persona: { id: persona.id, slug: persona.slug, name: persona.name },
      training,
    };
  }

  @UseGuards(AuthGuard("jwt"))
  @Put("personas/:slug/training")
  async upsertMyTraining(
    @Req() req: Authed,
    @Param("slug") slug: string,
    @Body() body: UpsertPersonaTrainingDto
  ) {
    const persona = await this.personaContext.resolvePersonaForUserBySlug(
      req.user.sub,
      slug.toLowerCase()
    );
    const training = await this.personaContext.upsertUserTraining({
      userId: req.user.sub,
      personaId: persona.id,
      title: body.title,
      trainingNotes: body.trainingNotes,
      structuredProfile: body.structuredProfile as Prisma.InputJsonValue | undefined,
    });
    return { ok: true, training };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("personas/:slug/memory")
  async getMyPersonaMemory(@Req() req: Authed, @Param("slug") slug: string) {
    const persona = await this.personaContext.resolvePersonaForUserBySlug(
      req.user.sub,
      slug.toLowerCase()
    );
    const memory = await this.memory.listStructured(req.user.sub, persona.id, 50);
    return {
      persona: { id: persona.id, slug: persona.slug, name: persona.name },
      memory,
    };
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
  @RequirePermissions("personas.edit")
  @Post("admin/personas/:id/access")
  grantAccess(@Param("id") id: string, @Body() body: GrantPersonaAccessDto) {
    return this.personaContext.grantPersonaAccess({
      userId: body.userId,
      personaId: id,
      accessType: body.accessType,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      metadata: body.metadata as Prisma.InputJsonValue | undefined,
    });
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
