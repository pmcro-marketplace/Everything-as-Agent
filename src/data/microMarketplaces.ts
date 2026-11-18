import project from '../../marketplaces/project-management/marketplace.yaml?raw';
import template from '../../marketplaces/template-generation/marketplace.yaml?raw';
import skill from '../../marketplaces/skill-creation/marketplace.yaml?raw';
import plugin from '../../marketplaces/plugin-creation/marketplace.yaml?raw';

type ProviderSource =
  | { type: 'github-plugin'; repository: string; ref: string; path: string }
  | { type: 'installed-plugin'; name: string };

export interface MicroMarketplace {
  kind: 'Marketplace';
  version: 1;
  name: string;
  source: { type: 'github-repository'; repository: string; path: string };
  plugins: { name: string; agent: string; source: ProviderSource; skills: string[]; enabled: boolean }[];
}

// Authored catalogs are the source; the UI never stores a second copy of membership.
export const MICRO_MARKETPLACES: MicroMarketplace[] = [project, template, skill, plugin]
  .map(raw => JSON.parse(raw) as MicroMarketplace);
