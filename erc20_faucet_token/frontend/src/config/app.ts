import { getAddress } from 'ethers';

const EXPECTED_CHAIN_ID = 4202;
const NETWORK_NAME = 'Lisk Sepolia';

function parseContractAddress(value: string | undefined) {
  if (!value) {
    return {
      contractAddress: '',
      error: 'Missing VITE_CONTRACT_ADDRESS in frontend/.env.',
    };
  }

  try {
    return {
      contractAddress: getAddress(value.trim()),
      error: null,
    };
  } catch {
    return {
      contractAddress: '',
      error: 'VITE_CONTRACT_ADDRESS is not a valid EVM address.',
    };
  }
}

const rpcUrl = import.meta.env.VITE_LISK_SEPOLIA_RPC_URL as string | undefined;
const { contractAddress, error: contractAddressError } = parseContractAddress(
  import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined,
);

const configErrors = [
  contractAddressError,
  rpcUrl ? null : 'Missing VITE_LISK_SEPOLIA_RPC_URL in frontend/.env.',
].filter(Boolean) as string[];

export const APP_CONFIG = {
  expectedChainId: EXPECTED_CHAIN_ID,
  networkName: NETWORK_NAME,
  contractAddress,
  rpcUrl: rpcUrl ?? '',
  projectId: (import.meta.env.VITE_APPKIT_PROJECT_ID as string | undefined) ?? '',
};

export const APP_CONFIG_ERROR = configErrors.length > 0 ? configErrors.join(' ') : null;

export function assertAppConfig() {
  if (APP_CONFIG_ERROR) {
    throw new Error(APP_CONFIG_ERROR);
  }

  return APP_CONFIG;
}
