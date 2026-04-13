import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RepositoriesModule } from "./repositories/repositories.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PersonasModule } from "./personas/personas.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { MessagesModule } from "./messages/messages.module";
import { MemoryModule } from "./memory/memory.module";
import { AiClientModule } from "./ai-client/ai-client.module";
import { BillingModule } from "./billing/billing.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { PurchasesModule } from "./purchases/purchases.module";
import { ScheduledPostsModule } from "./scheduled-posts/scheduled-posts.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AuditModule } from "./audit/audit.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { VoiceModule } from "./voice/voice.module";
import { ComplianceModule } from "./compliance/compliance.module";
import { HealthController } from "./health/health.controller";
import { RedisModule } from "./redis/redis.module";
import { AdminModule } from "./admin/admin.module";
import { RbacModule } from "./rbac/rbac.module";
import { AiUsageModule } from "./ai-usage/ai-usage.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RepositoriesModule,
    RedisModule,
    RbacModule,
    AiUsageModule,
    AiClientModule,
    MemoryModule,
    AuthModule,
    UsersModule,
    PersonasModule,
    ConversationsModule,
    MessagesModule,
    BillingModule,
    SubscriptionsModule,
    PurchasesModule,
    ScheduledPostsModule,
    AnalyticsModule,
    AuditModule,
    AuditLogsModule,
    VoiceModule,
    ComplianceModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
