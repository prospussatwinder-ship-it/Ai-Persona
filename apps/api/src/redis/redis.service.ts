import { Injectable, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

/**
 * Phase 1: optional connection; safe no-op getters when Redis URL missing.
 * Use for rate limits / BullMQ in later iterations.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis | null;

  constructor() {
    const url = process.env.REDIS_URL;
    this.client = url
      ? new Redis(url, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 4_000,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        })
      : null;
  }

  get raw(): Redis | null {
    return this.client;
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }
}
