import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from "ethers";

interface PhoneNumber {
    countryCode: number;
    number: number;
}

interface MetaMaskConnection {
    provider: ethers.providers.Provider;
    account: string;
}

class Dapp {
    static async connectToMetaMask(onConnect: (connection: MetaMaskConnection) => void) {
        const provider = await detectEthereumProvider({ mustBeMetaMask: true });
        if (provider) {
            // From now on, this should always be true:
            // provider === window.ethereum            
            // @ts-ignore
            const ethersProvider = new ethers.providers.Web3Provider(provider);
            const accounts = await ethersProvider.listAccounts();

            onConnect({ provider: ethersProvider, account: accounts[0] });
        } else {
            alert('Please install MetaMask!');
        }
    }

    static submitVerificationRequest(connection: MetaMaskConnection, phoneNumber: PhoneNumber) {
        alert(`Submitted +${phoneNumber.countryCode} ${phoneNumber.number}`)
    }
}

export { Dapp };
export type { MetaMaskConnection };