import { Contract } from 'ethers';
import { TOKEN_ABI } from '../ABI/Token';
import { APP_CONFIG, APP_CONFIG_ERROR } from '../config/app';
import { useRunners } from './useRunners';

export function useContract(withSigner = false) {
  const { signer, readOnlyProvider } = useRunners();

  if (APP_CONFIG_ERROR || !APP_CONFIG.contractAddress) {
    return null;
  }

  if (withSigner) {
    return signer ? new Contract(APP_CONFIG.contractAddress, TOKEN_ABI, signer) : null;
  }

  return new Contract(APP_CONFIG.contractAddress, TOKEN_ABI, readOnlyProvider);
}
