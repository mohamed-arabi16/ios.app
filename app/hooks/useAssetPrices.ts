import { useQuery } from '@tanstack/react-query';
import { Asset } from './useAssets';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

// Mapping from our asset names/types to CoinGecko API IDs
const ASSET_ID_MAP: { [key: string]: string } = {
  'bitcoin': 'bitcoin',
  'ethereum': 'ethereum',
  'gold': 'gold',
  'silver': 'silver',
};

const fetchAssetPrices = async (assets: Asset[]): Promise<{ [key: string]: number }> => {
  const ids = assets
    .map(asset => ASSET_ID_MAP[asset.name.toLowerCase()])
    .filter(Boolean)
    .join(',');

  if (!ids) return {};

  const response = await fetch(`${COINGECKO_API_URL}?ids=${ids}&vs_currencies=usd`);
  if (!response.ok) {
    throw new Error('Failed to fetch asset prices');
  }
  const data = await response.json();

  const prices: { [key: string]: number } = {};
  for (const asset of assets) {
      const id = ASSET_ID_MAP[asset.name.toLowerCase()];
      if (id && data[id]) {
          prices[asset.id] = data[id].usd;
      }
  }

  return prices;
};

export const useAssetPrices = (assets: Asset[]) => {
  return useQuery({
    queryKey: ['assetPrices', assets.map(a => a.id).join(',')],
    queryFn: () => fetchAssetPrices(assets),
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    enabled: assets && assets.length > 0,
  });
};
