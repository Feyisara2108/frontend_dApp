import { APP_CONFIG_ERROR } from '../../config/app';
import { useContract } from '../useContract';

export function useReadContract() {
  const contract = useContract(false);

  const getReadableContract = () => {
    if (!contract) {
      throw new Error(APP_CONFIG_ERROR ?? 'Read-only contract is unavailable.');
    }

    return contract;
  };

  const getClaimableTime = async (address: string) => {
    return await getReadableContract().getClaimableTime(address);
  };

  const getLastClaimTime = async (address: string) => {
    return await getReadableContract().lastClaimTime(address);
  };

  const getBalance = async (address: string) => {
    return await getReadableContract().balanceOf(address);
  };

  const getFaucetAmount = async () => {
    return await getReadableContract().FAUCET_AMOUNT();
  };

  const getSymbol = async () => {
    return await getReadableContract().symbol();
  };

  const getName = async () => {
    return await getReadableContract().name();
  };

  const getTotalSupply = async () => {
    return await getReadableContract().totalSupply();
  };

  const getMaxSupply = async () => {
    return await getReadableContract().MAX_SUPPLY();
  };

  const getOwner = async () => {
    return await getReadableContract().owner();
  };

  return {
    contract,
    getClaimableTime,
    getLastClaimTime,
    getBalance,
    getFaucetAmount,
    getSymbol,
    getName,
    getTotalSupply,
    getMaxSupply,
    getOwner,
  };
}
