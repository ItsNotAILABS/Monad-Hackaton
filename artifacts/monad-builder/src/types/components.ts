export const ComponentDataType = {
  'wallet-connect': 'wallet-connect',
  'token-balance': 'token-balance',
  'nft-gallery': 'nft-gallery',
  'transaction-feed': 'transaction-feed',
  'token-swap': 'token-swap',
  'price-chart': 'price-chart',
  'dao-vote': 'dao-vote',
  heading: 'heading',
  paragraph: 'paragraph',
  button: 'button',
  image: 'image',
  divider: 'divider',
  'hero-section': 'hero-section',
  card: 'card',
  'stats-row': 'stats-row',
} as const;

export type ComponentDataType = typeof ComponentDataType[keyof typeof ComponentDataType];

export interface ComponentData {
  id: string;
  type: ComponentDataType;
  props: Record<string, any>;
  order: number;
}
