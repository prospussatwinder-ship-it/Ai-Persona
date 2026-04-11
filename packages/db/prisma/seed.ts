import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = bcrypt.hashSync("Admin123!Phase1", 10);
  const opHash = bcrypt.hashSync("Operator123!Phase1", 10);
  const custHash = bcrypt.hashSync("Customer123!Phase1", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@phase1.local" },
    create: {
      email: "admin@phase1.local",
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      displayName: "Admin",
    },
    update: { passwordHash: adminHash, role: UserRole.ADMIN },
  });

  await prisma.user.upsert({
    where: { email: "operator@phase1.local" },
    create: {
      email: "operator@phase1.local",
      passwordHash: opHash,
      role: UserRole.OPERATOR,
      displayName: "Operator",
    },
    update: { passwordHash: opHash, role: UserRole.OPERATOR },
  });

  await prisma.user.upsert({
    where: { email: "customer@phase1.local" },
    create: {
      email: "customer@phase1.local",
      passwordHash: custHash,
      role: UserRole.CUSTOMER,
      displayName: "Customer",
    },
    update: { passwordHash: custHash },
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
        createdById: admin.id,
      },
      update: { name: p.name, isPublished: true, createdById: admin.id },
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

  console.log("Seed OK: admin@phase1.local / Admin123!Phase1");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
