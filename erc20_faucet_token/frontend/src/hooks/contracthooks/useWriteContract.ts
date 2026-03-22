import { useContract } from '../useContract';

export function useWriteContract() {
    const contract = useContract(true);

    const requestToken = async () => {
        const tx = await contract.requestToken();
        return await tx.wait();
    };

    const mint = async (amount: bigint) => {
        const tx = await contract.mint(amount);
        return await tx.wait();
    };

    return { contract, requestToken, mint };
}
