import { useContract } from '../useContract';

export function useReadContract() {
    const contract = useContract(false);

    const getClaimableTime = async (address: string) => {
        return await contract.getClaimableTime(address);
    };

    const getBalance = async (address: string) => {
        return await contract.balanceOf(address);
    };

    const getFaucetAmount = async () => {
        return await contract.FAUCET_AMOUNT();
    };

    const getSymbol = async () => {
        return await contract.symbol();
    };

    return { contract, getClaimableTime, getBalance, getFaucetAmount, getSymbol };
}
