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

async function _fetchUnverifiedRequests(verificationRequestId: number, challengedRequests: Array<string>, connection: MetaMaskConnection): Promise<Array<VerificationRequest>> {
    return connection.verificationContract.queryFilter(
        connection.verificationContract.filters.LogVerificationRequested(verificationRequestId, null, null),
        -10000
    )
        .then(events => {
            return events
                .filter(event => !(event.args![0] in challengedRequests))
                .map(event => {
                    const reqId = event.args![0].toNumber();
                    const phoneNumber = { countryCode: event.args![3], number: event.args![4] };
                    return { verificationRequestId: reqId, phoneNumber: phoneNumber };
                });
        });
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

    static async registerVerifierSelectionListener(connection: MetaMaskConnection, onUnverifiedRequest: (request: VerificationRequest) => void) {
        const recordedChallengesFilter = connection.verificationContract.filters.LogChallengeRecorded(null, connection.account);
        const challengedRequests: Array<string> = await connection.verificationContract.queryFilter(recordedChallengesFilter, -10000)
            .then(events => events.map(event => event.args![0]));
        console.log(`Requests with recorded challenges: ${challengedRequests}`);

        const verifierSelectedFilter = connection.verificationContract.filters.LogVerifierSelected(connection.account);

        // Listen for new events
        connection.verificationContract.on(verifierSelectedFilter, (verifier, requestId, event) => {
            _fetchUnverifiedRequests(requestId, challengedRequests, connection).then(requests => requests.forEach(onUnverifiedRequest));
        });

        // Query for historical events
        connection.verificationContract.queryFilter(verifierSelectedFilter, -10000)
            .then(events => {
                events
                    .filter(event => !(event.args![1] in challengedRequests))
                    .forEach(event => {
                        const requestId = event.args![1];
                        _fetchUnverifiedRequests(requestId, challengedRequests, connection).then(requests => requests.forEach(onUnverifiedRequest));
                    });
            });

    }
}

export { Dapp };
export type { MetaMaskConnection, PhoneNumber, VerificationRequest };