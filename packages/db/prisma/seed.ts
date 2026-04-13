import {
  AccountSubscriptionStatus,
  BillingCycle,
  PersonaVisibility,
  PlanStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS: { slug: string; module: string; name: string }[] = [
  { slug: "dashboard.view", module: "dashboard", name: "View dashboard" },
  { slug: "users.view", module: "users", name: "View users" },
  { slug: "users.create", module: "users", name: "Create users" },
  { slug: "users.edit", module: "users", name: "Edit users" },
  { slug: "users.delete", module: "users", name: "Delete users" },
  { slug: "roles.view", module: "roles", name: "View roles" },
  { slug: "roles.create", module: "roles", name: "Create roles" },
  { slug: "roles.edit", module: "roles", name: "Edit roles" },
  { slug: "roles.delete", module: "roles", name: "Delete roles" },
  { slug: "subscriptions.view", module: "subscriptions", name: "View subscriptions" },
  { slug: "subscriptions.create", module: "subscriptions", name: "Create subscriptions" },
  { slug: "subscriptions.edit", module: "subscriptions", name: "Edit subscriptions" },
  { slug: "subscriptions.delete", module: "subscriptions", name: "Delete subscription plans" },
  { slug: "audit_logs.view", module: "audit", name: "View audit logs" },
  { slug: "ai_usage.view", module: "ai_usage", name: "View AI usage logs" },
  { slug: "personas.view", module: "personas", name: "View personas" },
  { slug: "personas.create", module: "personas", name: "Create personas" },
  { slug: "personas.edit", module: "personas", name: "Edit personas" },
  { slug: "personas.delete", module: "personas", name: "Delete personas" },
  { slug: "personas.publish", module: "personas", name: "Publish personas" },
];

async function main() {
  const adminHash = bcrypt.hashSync("Admin123!Phase1", 10);
  const opHash = bcrypt.hashSync("Operator123!Phase1", 10);
  const custHash = bcrypt.hashSync("Customer123!Phase1", 10);
  const superHash = bcrypt.hashSync("SuperAdmin123!Phase1", 10);

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        module: p.module,
        name: p.name,
        description: p.name,
      },
      update: { module: p.module, name: p.name },
    });
  }

  const allPermIds = await prisma.permission.findMany({ select: { id: true } });

  const roleDefs = [
    { slug: "super_admin", name: "Super Admin", isSystem: true },
    { slug: "admin", name: "Admin", isSystem: true },
    { slug: "manager", name: "Manager", isSystem: true },
    { slug: "user", name: "User", isSystem: true },
  ] as const;

  const roleRows: { id: string; slug: string }[] = [];
  for (const r of roleDefs) {
    const row = await prisma.role.upsert({
      where: { slug: r.slug },
      create: {
        slug: r.slug,
        name: r.name,
        isSystem: r.isSystem,
        status: "active",
      },
      update: { name: r.name },
    });
    roleRows.push({ id: row.id, slug: row.slug });
  }

  const superAdminRole = roleRows.find((x) => x.slug === "super_admin")!;
  const adminRole = roleRows.find((x) => x.slug === "admin")!;
  const managerRole = roleRows.find((x) => x.slug === "manager")!;
  const userRoleRow = roleRows.find((x) => x.slug === "user")!;

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: {
        in: [superAdminRole.id, adminRole.id, managerRole.id, userRoleRow.id],
      },
    },
  });

  async function grant(roleId: string, slugs: string[]) {
    if (slugs.length === 0) return;
    const perms = await prisma.permission.findMany({
      where: { slug: { in: slugs } },
      select: { id: true },
    });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId, permissionId: p.id })),
    });
  }

  await grant(
    superAdminRole.id,
    PERMISSIONS.map((p) => p.slug)
  );
  await grant(adminRole.id, PERMISSIONS.map((p) => p.slug));
  await grant(managerRole.id, [
    "dashboard.view",
    "users.view",
    "roles.view",
    "subscriptions.view",
    "audit_logs.view",
    "ai_usage.view",
    "personas.view",
    "personas.create",
    "personas.edit",
    "personas.publish",
  ]);
  await grant(userRoleRow.id, []);

  await prisma.user.upsert({
    where: { email: "superadmin@phase1.local" },
    create: {
      email: "superadmin@phase1.local",
      passwordHash: superHash,
      role: UserRole.SUPER_ADMIN,
      displayName: "Super Admin",
      firstName: "Super",
      lastName: "Admin",
      status: "active",
    },
    update: {
      passwordHash: superHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@phase1.local" },
    create: {
      email: "admin@phase1.local",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      displayName: "Admin",
      firstName: "Admin",
      lastName: "User",
      status: "active",
    },
    update: {
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      firstName: "Admin",
      lastName: "User",
    },
  });

  await prisma.user.upsert({
    where: { email: "operator@phase1.local" },
    create: {
      email: "operator@phase1.local",
      passwordHash: opHash,
      role: UserRole.OPERATOR,
      displayName: "Operator",
      firstName: "Operator",
      lastName: "User",
      status: "active",
    },
    update: { passwordHash: opHash, role: UserRole.OPERATOR },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@phase1.local" },
    create: {
      email: "customer@phase1.local",
      passwordHash: custHash,
      role: UserRole.CUSTOMER,
      displayName: "Customer",
      firstName: "Customer",
      lastName: "User",
      status: "active",
    },
    update: { passwordHash: custHash },
  });

  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    create: {
      name: "Free",
      slug: "free",
      description: "Limited AI chat",
      price: 0,
      currency: "usd",
      billingCycle: BillingCycle.MONTHLY,
      trialDays: 0,
      aiRequestLimit: 50,
      status: PlanStatus.ACTIVE,
      sortOrder: 1,
      featureConfig: { tier: "free" },
    },
    update: { aiRequestLimit: 50 },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "pro" },
    create: {
      name: "Pro",
      slug: "pro",
      description: "Higher AI limits",
      price: 29.99,
      currency: "usd",
      billingCycle: BillingCycle.MONTHLY,
      trialDays: 7,
      aiRequestLimit: 2000,
      status: PlanStatus.ACTIVE,
      sortOrder: 2,
      featureConfig: { tier: "pro" },
    },
    update: {},
  });

  await prisma.subscriptionPlan.upsert({
    where: { slug: "enterprise" },
    create: {
      name: "Enterprise",
      slug: "enterprise",
      description: "Team limits + priority",
      price: 499,
      currency: "usd",
      billingCycle: BillingCycle.YEARLY,
      trialDays: 14,
      aiRequestLimit: 100000,
      maxUsers: 100,
      status: PlanStatus.ACTIVE,
      sortOrder: 3,
      featureConfig: { tier: "enterprise" },
    },
    update: {},
  });

  await prisma.userPlanSubscription.deleteMany({ where: { userId: customer.id } });
  await prisma.userPlanSubscription.create({
    data: {
      userId: customer.id,
      planId: freePlan.id,
      status: AccountSubscriptionStatus.active,
      startDate: new Date(),
    },
  });

  const personas = [
    { slug: "nova-aria", name: "Nova Aria", tagline: "Warm strategist" },
    { slug: "river-lens", name: "River Lens", tagline: "Calm, observant" },
    { slug: "ember-volt", name: "Ember Volt", tagline: "High-energy hype" },
    { slug: "solstice-grey", name: "Solstice Grey", tagline: "Dry wit, clear frames" },
    { slug: "mira-loop", name: "Mira Loop", tagline: "Curious synthesizer" },
  ];

  for (const p of personas) {
    const persona = await prisma.persona.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        name: p.name,
        isPublished: true,
        isActive: true,
        visibility: PersonaVisibility.PUBLIC,
        createdById: admin.id,
      },
      update: {
        name: p.name,
        isPublished: true,
        isActive: true,
        visibility: PersonaVisibility.PUBLIC,
        createdById: admin.id,
      },
    });

    await prisma.personaProfile.upsert({
      where: { personaId: persona.id },
      create: {
        personaId: persona.id,
        tagline: p.tagline,
        description: `Phase 1 seed persona: ${p.name}.`,
        systemPrompt: `You are ${p.name}, a persona on Phase 1. Be helpful, safe, and concise.`,
        agentConfig: { model: "gpt-4o-mini", temperature: 0.7 },
        voiceConfig: { provider: "mock", preset: "neutral" },
      },
      update: {
        tagline: p.tagline,
        description: `Phase 1 seed persona: ${p.name}.`,
        systemPrompt: `You are ${p.name}, a persona on Phase 1. Be helpful, safe, and concise.`,
      },
    });
  }

  console.log("Seed OK:");
  console.log("  superadmin@phase1.local / SuperAdmin123!Phase1 (SUPER_ADMIN)");
  console.log("  admin@phase1.local / Admin123!Phase1 (ADMIN)");
  console.log("  operator@phase1.local / Operator123!Phase1 (OPERATOR)");
  console.log("  customer@phase1.local / Customer123!Phase1 (CUSTOMER + Free plan)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
