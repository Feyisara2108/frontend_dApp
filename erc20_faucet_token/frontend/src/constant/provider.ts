import { JsonRpcProvider } from 'ethers';

export const readOnlyProvider = new JsonRpcProvider(
    import.meta.env.VITE_SEPOLIA_RPC_URL as string
);

export const getProvider = () => {
    return readOnlyProvider;
};
