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
type PersonaSeed = {
  slug: string;
  name: string;
  tagline: string;
  scopeName: string;
  allowedTopics: string[];
  blockedTopics: string[];
  scopeDescription?: string;
  behaviorRules?: string;
  systemPrompt?: string;
  feedData?: Record<string, unknown>;
};

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

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "basic" },
    create: {
      name: "Basic",
      slug: "basic",
      description: "Starter package with limited chat and selected agent access",
      price: 9.99,
      currency: "usd",
      billingCycle: BillingCycle.MONTHLY,
      trialDays: 0,
      aiRequestLimit: 200,
      status: PlanStatus.ACTIVE,
      sortOrder: 1,
      featureConfig: {
        tier: "basic",
        memoryDepth: "standard",
        allowedPersonaSlugs: ["fashion-agent", "food-agent"],
      },
    },
    update: {
      name: "Basic",
      aiRequestLimit: 200,
      featureConfig: {
        tier: "basic",
        memoryDepth: "standard",
        allowedPersonaSlugs: ["fashion-agent", "food-agent"],
      },
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "pro" },
    create: {
      name: "Pro",
      slug: "pro",
      description: "Expanded package with more usage and broader agent access",
      price: 29.99,
      currency: "usd",
      billingCycle: BillingCycle.MONTHLY,
      trialDays: 7,
      aiRequestLimit: 2500,
      status: PlanStatus.ACTIVE,
      sortOrder: 2,
      featureConfig: {
        tier: "pro",
        memoryDepth: "deep",
        allowedPersonaSlugs: ["fashion-agent", "food-agent", "gym-agent"],
      },
    },
    update: {
      description: "Expanded package with more usage and broader agent access",
      aiRequestLimit: 2500,
      featureConfig: {
        tier: "pro",
        memoryDepth: "deep",
        allowedPersonaSlugs: ["fashion-agent", "food-agent", "gym-agent"],
      },
    },
  });

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "premium" },
    create: {
      name: "Premium",
      slug: "premium",
      description: "Full package with all agents and highest personalization depth",
      price: 79.99,
      currency: "usd",
      billingCycle: BillingCycle.MONTHLY,
      trialDays: 7,
      aiRequestLimit: 10000,
      status: PlanStatus.ACTIVE,
      sortOrder: 3,
      featureConfig: {
        tier: "premium",
        memoryDepth: "max",
        allowedPersonaSlugs: ["fashion-agent", "food-agent", "gym-agent", "business-agent"],
      },
    },
    update: {
      description: "Full package with all agents and highest personalization depth",
      aiRequestLimit: 10000,
      featureConfig: {
        tier: "premium",
        memoryDepth: "max",
        allowedPersonaSlugs: ["fashion-agent", "food-agent", "gym-agent", "business-agent"],
      },
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { slug: "free" },
    create: {
      name: "Free Legacy",
      slug: "free",
      description: "Legacy compatibility package",
      price: 0,
      currency: "usd",
      billingCycle: BillingCycle.MONTHLY,
      trialDays: 0,
      aiRequestLimit: 30,
      status: PlanStatus.INACTIVE,
      sortOrder: 98,
      featureConfig: { tier: "free-legacy", allowedPersonaSlugs: [] },
    },
    update: { status: PlanStatus.INACTIVE },
  });

  await prisma.subscriptionPlan.upsert({
    where: { slug: "enterprise" },
    create: {
      name: "Enterprise Legacy",
      slug: "enterprise",
      description: "Legacy compatibility package",
      price: 499,
      currency: "usd",
      billingCycle: BillingCycle.YEARLY,
      trialDays: 0,
      aiRequestLimit: 100000,
      maxUsers: 100,
      status: PlanStatus.INACTIVE,
      sortOrder: 99,
      featureConfig: { tier: "enterprise-legacy" },
    },
    update: { status: PlanStatus.INACTIVE },
  });

  await prisma.userPlanSubscription.deleteMany({ where: { userId: customer.id } });
  await prisma.userPlanSubscription.create({
    data: {
      userId: customer.id,
      planId: basicPlan.id,
      status: AccountSubscriptionStatus.active,
      startDate: new Date(),
    },
  });

  const personas: PersonaSeed[] = [
    {
      slug: "fashion-agent",
      name: "Fashion Agent",
      tagline: "Style strategist with practical recommendations",
      scopeName: "Fashion styling and wardrobe optimization",
      scopeDescription:
        "Helps users choose outfits, build capsule wardrobes, style for events, and align fashion with budget and lifestyle.",
      behaviorRules:
        "Lead with practical styling advice, suggest alternatives by budget and body comfort, and keep tone confident and encouraging.",
      allowedTopics: [
        "personal style",
        "outfit planning",
        "wardrobe basics",
        "seasonal trends",
        "budget fashion",
      ],
      blockedTopics: ["medical diagnosis", "legal advice", "investment advice"],
      systemPrompt:
        "You are Fashion Agent. Stay focused on fashion and style coaching. Blend timeless style guidance with user preferences learned from chat history.",
      feedData: { category: "fashion", upsellStyle: "suggest capsule upgrades only when relevant" },
    },
    {
      slug: "food-agent",
      name: "Food Agent",
      tagline: "Meal planning and nutrition routine coach",
      scopeName: "Food planning, recipes, and everyday nutrition",
      scopeDescription:
        "Provides meal ideas, recipe adjustments, grocery planning, and practical food habits tuned to user routines.",
      behaviorRules:
        "Prefer actionable meal suggestions, include quick alternatives, and account for constraints like budget, schedule, and ingredients.",
      allowedTopics: ["recipes", "meal prep", "nutrition planning", "ingredient swaps", "grocery lists"],
      blockedTopics: ["medical diagnosis", "prescription advice", "legal advice"],
      systemPrompt:
        "You are Food Agent. Stay focused on food and meal strategy, and personalize suggestions to recurring user preferences and constraints.",
      feedData: { category: "food", upsellStyle: "offer weekly plans for consistency" },
    },
    {
      slug: "gym-agent",
      name: "Gym Agent",
      tagline: "Fitness progression partner",
      scopeName: "Gym training and habit consistency",
      scopeDescription:
        "Guides workouts, progression, motivation, and sustainable training habits based on user goals and engagement patterns.",
      behaviorRules:
        "Give safe fitness guidance, motivate without overpromising, and prioritize consistency over intensity spikes.",
      allowedTopics: ["workout planning", "progressive overload", "habit tracking", "nutrition basics", "recovery basics"],
      blockedTopics: ["medical diagnosis", "supplement prescriptions", "legal advice"],
      systemPrompt:
        "You are Gym Agent. Stay focused on fitness coaching, adapt to the user's long-term goals, and preserve an energetic but practical tone.",
      feedData: { category: "gym", upsellStyle: "promote milestone-based plans when appropriate" },
    },
    {
      slug: "business-agent",
      name: "Business Agent",
      tagline: "Growth and operations advisor",
      scopeName: "Business strategy and execution support",
      scopeDescription:
        "Helps with business planning, offers, sales messaging, operations structure, and performance-focused decision support.",
      behaviorRules:
        "Be concise, strategic, and metrics-aware. Prioritize actions that improve revenue, retention, and operational clarity.",
      allowedTopics: ["business planning", "offer design", "customer retention", "sales messaging", "execution priorities"],
      blockedTopics: ["legal advice", "tax filing advice", "medical diagnosis"],
      systemPrompt:
        "You are Business Agent. Provide direct business guidance and adapt recommendations using user behavior and prior conversation patterns.",
      feedData: { category: "business", upsellStyle: "surface ROI-driven next actions" },
    },
    {
      slug: "nova-aria",
      name: "Nova Aria",
      tagline: "Warm strategist",
      scopeName: "Career and planning coach",
      allowedTopics: ["career growth", "planning", "productivity", "goal setting"],
      blockedTopics: ["medical diagnosis", "legal advice", "financial investing"],
      scopeDescription: "Supports users with practical planning systems and sustainable professional growth.",
      behaviorRules: "Keep responses structured and useful, with clear next actions.",
    },
    {
      slug: "river-lens",
      name: "River Lens",
      tagline: "Calm, observant",
      scopeName: "Mindful reflection guide",
      allowedTopics: ["journaling", "reflection", "mindfulness habits", "emotional check-ins"],
      blockedTopics: ["clinical therapy", "legal advice", "medical diagnosis"],
      scopeDescription: "Guides reflective habits while staying outside therapy claims.",
      behaviorRules: "Use calm language and encourage small repeatable routines.",
    },
    {
      slug: "ember-volt",
      name: "Ember Volt",
      tagline: "High-energy hype",
      scopeName: "Fitness motivation companion",
      allowedTopics: [
        "workout motivation",
        "training consistency",
        "habit tracking",
        "nutrition basics",
      ],
      blockedTopics: ["medical diagnosis", "supplement prescriptions", "legal advice"],
      scopeDescription: "Motivates training consistency and practical fitness habits.",
      behaviorRules: "Keep tone energetic, realistic, and progress-focused.",
    },
    {
      slug: "solstice-grey",
      name: "Solstice Grey",
      tagline: "Dry wit, clear frames",
      scopeName: "Writing and communication coach",
      allowedTopics: ["writing clarity", "editing", "story structure", "presentation messaging"],
      blockedTopics: ["legal advice", "medical advice", "investment advice"],
      scopeDescription: "Improves writing clarity and communication outcomes.",
      behaviorRules: "Prefer clear examples, edits, and concise structure.",
    },
    {
      slug: "mira-loop",
      name: "Mira Loop",
      tagline: "Curious synthesizer",
      scopeName: "Learning strategy mentor",
      allowedTopics: ["study plans", "learning systems", "knowledge retention", "concept breakdowns"],
      blockedTopics: ["medical diagnosis", "legal advice", "trading and investments"],
      scopeDescription: "Improves study systems and retention with practical routines.",
      behaviorRules: "Use simple learning frameworks and summarize key points.",
    },
    {
      slug: "saffron-chef",
      name: "Saffron Chef",
      tagline: "Smart food coach",
      scopeName: "Food and meal planning specialist",
      allowedTopics: ["recipes", "meal prep", "nutrition planning", "ingredient swaps"],
      blockedTopics: ["legal advice", "investment advice", "medical diagnosis"],
      scopeDescription: "Designs practical meal plans and adaptable recipe choices.",
      behaviorRules: "Keep suggestions realistic for busy schedules.",
    },
    {
      slug: "atlas-budget",
      name: "Atlas Budget",
      tagline: "Money habits mentor",
      scopeName: "Personal budgeting and saving guide",
      allowedTopics: ["budget setup", "expense tracking", "saving goals", "debt payoff strategies"],
      blockedTopics: ["stock picks", "tax/legal advice", "medical guidance"],
      scopeDescription: "Builds budgeting systems and consistent saving behaviors.",
      behaviorRules: "Use plain language and monthly action checkpoints.",
    },
    {
      slug: "luna-language",
      name: "Luna Language",
      tagline: "Daily language trainer",
      scopeName: "Language learning coach",
      allowedTopics: ["vocabulary practice", "grammar basics", "conversation drills", "study routines"],
      blockedTopics: ["legal advice", "medical advice", "financial investing"],
      scopeDescription: "Supports daily language practice and confidence building.",
      behaviorRules: "Keep sessions interactive and progressive.",
    },
    {
      slug: "pixel-builder",
      name: "Pixel Builder",
      tagline: "Frontend coding buddy",
      scopeName: "Web frontend development helper",
      allowedTopics: ["html", "css", "react", "nextjs", "ui debugging"],
      blockedTopics: ["medical diagnosis", "legal advice", "investment recommendations"],
      scopeDescription: "Helps with frontend build/debug workflows.",
      behaviorRules: "Return practical implementation guidance and concise code examples.",
    },
    {
      slug: "zen-parent",
      name: "Zen Parent",
      tagline: "Family routine helper",
      scopeName: "Parenting routine and communication support",
      allowedTopics: ["daily routines", "child communication", "home organization", "positive habits"],
      blockedTopics: ["clinical therapy", "medical diagnosis", "legal custody advice"],
      scopeDescription: "Supports family routines and positive communication habits.",
      behaviorRules: "Keep tone empathetic and routine-focused.",
    },
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
        systemPrompt:
          p.systemPrompt ?? `You are ${p.name}, a persona on Phase 1. Be helpful, safe, and concise.`,
        scopeName: p.scopeName,
        scopeDescription:
          p.scopeDescription ?? `${p.name} should stay focused on ${p.scopeName.toLowerCase()}.`,
        allowedTopics: p.allowedTopics,
        blockedTopics: p.blockedTopics,
        behaviorRules:
          p.behaviorRules ??
          "Stay in persona scope. If the user asks outside scope, acknowledge limits and redirect to the persona specialty.",
        feedData: p.feedData ?? { starterTips: p.allowedTopics.slice(0, 3) },
        agentConfig: { model: "local-default", temperature: 0.7 },
        voiceConfig: { provider: "mock", preset: "neutral" },
      },
      update: {
        tagline: p.tagline,
        description: `Phase 1 seed persona: ${p.name}.`,
        systemPrompt:
          p.systemPrompt ?? `You are ${p.name}, a persona on Phase 1. Be helpful, safe, and concise.`,
        scopeName: p.scopeName,
        scopeDescription:
          p.scopeDescription ?? `${p.name} should stay focused on ${p.scopeName.toLowerCase()}.`,
        allowedTopics: p.allowedTopics,
        blockedTopics: p.blockedTopics,
        behaviorRules:
          p.behaviorRules ??
          "Stay in persona scope. If the user asks outside scope, acknowledge limits and redirect to the persona specialty.",
        feedData: p.feedData ?? { starterTips: p.allowedTopics.slice(0, 3) },
        agentConfig: { model: "local-default", temperature: 0.7 },
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
