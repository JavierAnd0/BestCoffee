import { env } from "../env";
import {
  STORE_LOCATIONS,
  BREW_GUIDES,
  findGuide as findGuideMock,
  type StoreLocation,
  type BrewGuide,
} from "../mocks/static";

export async function listStoreLocations(): Promise<StoreLocation[]> {
  if (env.useMocks) return STORE_LOCATIONS;
  throw new Error("listStoreLocations: live API not wired yet");
}

export async function listBrewGuides(): Promise<BrewGuide[]> {
  if (env.useMocks) return BREW_GUIDES;
  throw new Error("listBrewGuides: live API not wired yet");
}

export async function getBrewGuide(slug: string): Promise<BrewGuide | undefined> {
  if (env.useMocks) return findGuideMock(slug);
  throw new Error("getBrewGuide: live API not wired yet");
}
