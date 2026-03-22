import { useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, Signer } from 'ethers';
import { useEffect, useState } from 'react';
import { getProvider } from '../constant/provider';

interface ProviderWithRequest {
    request: (args: any) => Promise<any>;
}

export function useRunners() {
    // Ethers v6 compatible wallet provider from AppKit adapter
    const { walletProvider } = useAppKitProvider<ProviderWithRequest>('eip155');
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);

    useEffect(() => {
        if (walletProvider) {
            const browserProvider = new BrowserProvider(walletProvider as any);
            setProvider(browserProvider);
            browserProvider.getSigner().then(setSigner).catch(console.error);
        } else {
            setProvider(null);
            setSigner(null);
        }
    }, [walletProvider]);

    return { provider, signer, readOnlyProvider: getProvider() };
}
