import { BadRequestException, Injectable, Logger } from "@nestjs/common";

/**
 * Phase 1 hook: plug keyword lists, OpenAI moderation, or vendor APIs.
 */
@Injectable()
export class ComplianceService {
  private readonly log = new Logger(ComplianceService.name);

  assertMessageAllowed(text: string) {
    const blocked = ["terrorist recipe", "how to make a bomb"]; // illustrative only
    const lower = text.toLowerCase();
    for (const b of blocked) {
      if (lower.includes(b)) {
        this.log.warn("Blocked message by compliance stub");
        throw new BadRequestException("Message blocked by safety policy");
      }
    }
  }
}
