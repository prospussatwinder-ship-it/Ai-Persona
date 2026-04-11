import { Module } from "@nestjs/common";
import { AdminAiUsageController } from "./admin-ai-usage.controller";
import { AdminAiUsageService } from "./admin-ai-usage.service";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminDashboardService } from "./admin-dashboard.service";
import { AdminRolesController } from "./admin-roles.controller";
import { AdminRolesService } from "./admin-roles.service";
import { AdminSubscriptionPlansController } from "./admin-subscription-plans.controller";
import { AdminUserSubscriptionsController } from "./admin-user-subscriptions.controller";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { UserPlanSubscriptionsService } from "./user-plan-subscriptions.service";

@Module({
  controllers: [
    AdminUsersController,
    AdminDashboardController,
    AdminAiUsageController,
    AdminSubscriptionPlansController,
    AdminUserSubscriptionsController,
    AdminRolesController,
  ],
  providers: [
    AdminUsersService,
    AdminDashboardService,
    AdminAiUsageService,
    SubscriptionPlansService,
    UserPlanSubscriptionsService,
    AdminRolesService,
  ],
})
export class AdminModule {}
