import { JsonRpcProvider } from 'ethers';
import { APP_CONFIG, APP_CONFIG_ERROR } from '../config/app';

const readOnlyProvider = APP_CONFIG_ERROR
  ? null
  : new JsonRpcProvider(APP_CONFIG.rpcUrl, APP_CONFIG.expectedChainId);

export const getProvider = () => readOnlyProvider;
