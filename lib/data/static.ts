import {
  STORE_LOCATIONS,
  BREW_GUIDES,
  findGuide as findGuideMock,
  type StoreLocation,
  type BrewGuide,
} from "../mocks/static";

// Store locations + brew guides have no backend endpoint yet, so these always
// serve curated mock content. Wire to the API once those routes ship.
export async function listStoreLocations(): Promise<StoreLocation[]> {
  return STORE_LOCATIONS;
}

export async function listBrewGuides(): Promise<BrewGuide[]> {
  return BREW_GUIDES;
}

export async function getBrewGuide(slug: string): Promise<BrewGuide | undefined> {
  return findGuideMock(slug);
}
