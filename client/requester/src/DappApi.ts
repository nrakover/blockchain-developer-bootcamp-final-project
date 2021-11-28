import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';

import { loadVerifiablePhoneNumbersContract } from './ContractLoader';

interface PhoneNumber {
    countryCode: number;
    number: number;
}

interface VerificationRequest {
    verificationRequestId: number;
    phoneNumber: PhoneNumber;
}

interface MetaMaskConnection {
    provider: ethers.providers.Provider;
    signer: ethers.Signer;
    verificationContract: ethers.Contract;
    account: string;
}

class Dapp {
    static async connectToMetaMask(onConnect: (connection: MetaMaskConnection) => void) {
        const provider = await detectEthereumProvider({ mustBeMetaMask: true });
        if (provider) {
            // From now on, this should always be true: provider === window.ethereum
            // @ts-ignore
            await provider.request({ method: 'eth_requestAccounts' });
            // @ts-ignore
            const ethersProvider = new ethers.providers.Web3Provider(provider);
            const signer = ethersProvider.getSigner();

            const verificationContract = loadVerifiablePhoneNumbersContract(ethersProvider);

            onConnect({ provider: ethersProvider, signer: signer, verificationContract: verificationContract, account: await signer.getAddress() });
        } else {
            alert('Please install MetaMask!');
        }
    }

    static async submitVerificationRequest(connection: MetaMaskConnection, phoneNumber: PhoneNumber): Promise<VerificationRequest> {
        const contractWithSigner = connection.verificationContract.connect(connection.signer);
        return contractWithSigner.requestVerification([phoneNumber.countryCode, phoneNumber.number])
            .then((response: any) => {
                // @ts-ignore
                return response.wait();
            })
            .then((receipt: any) => {
                const events = receipt.events.filter((event: any) => event.event === "LogVerificationRequested");
                if (events.length !== 1) {
                    console.error(`Expected to encounter exactly one verification request log, but found ${events.length}`);
                    return;
                }

                const [verificationRequestLog] = events;
                return { verificationRequestId: verificationRequestLog.args[0].toNumber(), phoneNumber: phoneNumber };
            });
    }

    static submitChallengeResponse(
        connection: MetaMaskConnection,
        verificationRequestId: number,
        verifierAddress: string,
        secretCode: number,
        onSuccess: () => void,
        onFailure: () => void
    ) {
        const contractWithSigner = connection.verificationContract.connect(connection.signer);
        contractWithSigner.functions.submitChallengeResponse(verificationRequestId, verifierAddress, secretCode)
            .then((response: any) => {
                // @ts-ignore
                return response.wait();
            })
            .then((receipt: any) => {
                const verificationSucceededEvents = receipt.events.filter((event: any) => event.event === "LogVerificationSucceeded");
                if (verificationSucceededEvents.length === 1) {
                    onSuccess();
                    return;
                }

                const verificationFailedEvents = receipt.events.filter((event: any) => event.event === "LogVerificationFailed");
                if (verificationFailedEvents.length === 1) {
                    onFailure();
                    return;
                }
            });
    }
}

export { Dapp };
export type { MetaMaskConnection, PhoneNumber, VerificationRequest };