import { env } from "../env";
import {
  ANNOUNCE_MESSAGES,
  HERO_HOME,
  SPOTLIGHT_HOME,
  FEATURED_PACK_HOME,
} from "../mocks/site-content";
import type {
  AnnounceMessage,
  HeroContent,
  SpotlightContent,
  FeaturedPackContent,
} from "../types";

export async function getAnnounceMessages(): Promise<AnnounceMessage[]> {
  if (env.useMocks) return ANNOUNCE_MESSAGES;
  throw new Error("getAnnounceMessages: live API not wired yet");
}

export async function getHomeHero(): Promise<HeroContent> {
  if (env.useMocks) return HERO_HOME;
  throw new Error("getHomeHero: live API not wired yet");
}

export async function getHomeSpotlight(): Promise<SpotlightContent> {
  if (env.useMocks) return SPOTLIGHT_HOME;
  throw new Error("getHomeSpotlight: live API not wired yet");
}

export async function getFeaturedPack(): Promise<FeaturedPackContent> {
  if (env.useMocks) return FEATURED_PACK_HOME;
  throw new Error("getFeaturedPack: live API not wired yet");
}
