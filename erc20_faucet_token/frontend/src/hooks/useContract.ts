import { Contract } from 'ethers';
import { useRunners } from './useRunners';
import { TOKEN_ABI } from '../ABI/Token';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string;

export function useContract(withSigner = false) {
    const { signer, readOnlyProvider } = useRunners();

    if (withSigner && signer) {
        return new Contract(CONTRACT_ADDRESS, TOKEN_ABI, signer);
    }
    
    return new Contract(CONTRACT_ADDRESS, TOKEN_ABI, readOnlyProvider);
}
