import { useAppKitProvider } from '@reown/appkit/react';
import { BrowserProvider, type Signer } from 'ethers'; // ← remove 'type' from BrowserProvider
import { useEffect, useState } from 'react';
import { getProvider } from '../constant/provider';

interface ProviderWithRequest {
    request: (args: any) => Promise<any>;
}

export function useRunners() {
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