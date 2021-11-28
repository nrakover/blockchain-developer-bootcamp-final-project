import { ethers } from 'ethers';

function loadVerifiablePhoneNumbersContract(provider: ethers.providers.Provider): ethers.Contract {
    const abi = new ethers.utils.Interface([
        "constructor(uint8 _numVerifiersPerRequest, address[] _verifiers)",
        "function recordVerificationChallenge(uint256 verificationRequestId, bytes32 challengeHash)",
        "event LogVerificationRequested(uint256 indexed verificationRequestId, address indexed requester, tuple(uint8, uint40) indexed phoneNumber, uint8 countryCodeDenorm, uint40 numberDenorm)",
        "event LogVerifierSelected(address indexed verifier, uint256 verificationRequestId)",
        "event LogChallengeRecorded(uint256 indexed verificationRequestId, address indexed verifier)",
        "event LogChallengeCompleted(uint256 indexed verificationRequestId, address verifier)",
        "event LogChallengeFailed(uint256 indexed verificationRequestId, address verifier)",
        "event LogVerificationSucceeded(uint256 indexed verificationRequestId, address indexed requester, tuple(uint8, uint40) indexed phoneNumber)",
        "event LogVerificationFailed(uint256 indexed verificationRequestId, address indexed requester, tuple(uint8, uint40) indexed phoneNumber)",
        "event LogProofOfOwnershipRevoked(address indexed previousOwner, tuple(uint8, uint40) indexed phoneNumber)"
    ]);
    return new ethers.Contract(process.env.REACT_APP_VERIFICATION_CONTRACT_ADDRESS!, abi, provider);
}

export { loadVerifiablePhoneNumbersContract };
