import { APP_CONFIG } from '../../config/app';
import { useRunners } from '../useRunners';
import { useContract } from '../useContract';

export function useWriteContract() {
  const contract = useContract(true);
  const { provider, signer } = useRunners();

  const getWritableContract = async () => {
    if (!provider) {
      throw new Error('Connect your wallet before submitting a transaction.');
    }

    const network = await provider.getNetwork();
    if (Number(network.chainId) !== APP_CONFIG.expectedChainId) {
      throw new Error(`Switch your wallet to ${APP_CONFIG.networkName} before submitting a transaction.`);
    }

    if (!contract) {
      throw new Error('Connect your wallet before submitting a transaction.');
    }

    return contract;
  };

  const getSignerAddress = async () => {
    const signerAddress = await signer?.getAddress();
    if (!signerAddress) {
      throw new Error('Connect your wallet before submitting a transaction.');
    }
    return signerAddress;
  };

  const requestToken = async () => {
    const writableContract = await getWritableContract();
    const tx = await writableContract.requestToken();
    return await tx.wait();
  };

  const transferTokens = async (to: string, amount: bigint) => {
    const writableContract = await getWritableContract();
    const tx = await writableContract.transfer(to, amount);
    return await tx.wait();
  };

  const mint = async (to: string, amount: bigint) => {
    const writableContract = await getWritableContract();
    const signerAddress = await getSignerAddress();
    const ownerAddress: string = await writableContract.owner();

    if (ownerAddress.toLowerCase() != signerAddress.toLowerCase()) {
      throw new Error('Only the contract owner can mint tokens.');
    }

    const tx = await writableContract.mint(to, amount);
    return await tx.wait();
  };

  const transferOwnership = async (newOwner: string) => {
    const writableContract = await getWritableContract();
    const signerAddress = await getSignerAddress();
    const ownerAddress: string = await writableContract.owner();

    if (ownerAddress.toLowerCase() != signerAddress.toLowerCase()) {
      throw new Error('Only the contract owner can transfer ownership.');
    }

    const tx = await writableContract.transferOwnership(newOwner);
    return await tx.wait();
  };

  return { contract, requestToken, transferTokens, mint, transferOwnership };
}
