import { ethers } from 'ethers';
import { VerificationRequest, Dapp, MetaMaskConnection } from './DappApi';

async function generateAndRecordChallenge(request: VerificationRequest, connection: MetaMaskConnection): Promise<number> {
    const secretCode = ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    return Dapp.recordVerificationChallenge(connection, request, secretCode).then(() => secretCode);
}

async function createSignedChallengeMessage(secretCode: number, connection: MetaMaskConnection): Promise<string> {
    return connection.signer.signMessage(`${secretCode}`)
        .then(signature => btoa(JSON.stringify({ secretCode: secretCode, signature: signature })));

}

export { generateAndRecordChallenge, createSignedChallengeMessage };
