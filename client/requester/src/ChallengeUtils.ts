import { ethers } from 'ethers';
import { Dapp, MetaMaskConnection } from './DappApi';

function validateAndSubmitChallengeResponse(
    challengeMessage: string,
    verificationRequestId: number,
    connection: MetaMaskConnection,
    onSuccess: () => void,
    onFailure: () => void
) {
    try {
        const { secretCode, signature } = JSON.parse(atob(challengeMessage));
        const signingAddress = ethers.utils.verifyMessage(`${secretCode}`, signature);
        Dapp.submitChallengeResponse(connection, verificationRequestId, signingAddress, secretCode, onSuccess, onFailure);
    } catch (e) {
        onFailure();
    }
}

export { validateAndSubmitChallengeResponse };
