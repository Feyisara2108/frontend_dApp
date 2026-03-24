import { useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider } from 'ethers';
import type { Signer } from 'ethers';
import { useEffect, useState } from 'react';
import { getProvider } from '../constant/provider';

interface ProviderWithRequest {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
}

export function useRunners() {
  const { walletProvider } = useAppKitProvider<ProviderWithRequest>('eip155');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!walletProvider) {
      setProvider(null);
      setSigner(null);
      return () => {
        isMounted = false;
      };
    }

    const browserProvider = new BrowserProvider(walletProvider);
    setProvider(browserProvider);

    browserProvider
      .getSigner()
      .then((nextSigner) => {
        if (isMounted) {
          setSigner(nextSigner);
        }
      })
      .catch((error) => {
        console.error('Failed to load wallet signer:', error);
        if (isMounted) {
          setSigner(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [walletProvider]);

  return { provider, signer, readOnlyProvider: getProvider() };
}
