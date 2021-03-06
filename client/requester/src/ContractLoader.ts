import { ethers } from 'ethers';

function loadVerifiablePhoneNumbersContract(provider: ethers.providers.Provider): ethers.Contract {
    const abi = new ethers.utils.Interface([
        "constructor(uint8 _numVerifiersPerRequest, address[] _verifiers)",
        "function requestVerification(tuple(uint8, uint40) phoneNumber) returns (uint256 verificationRequestId)",
        "function submitChallengeResponse(uint256 verificationRequestId, address verifier, uint32 secretCode)",
        "function isPhoneNumberOwner(address account, tuple(uint8, uint40) phoneNumber) view returns (bool)",
        "event LogVerificationRequested(uint256 indexed verificationRequestId, address indexed requester, tuple(uint8, uint40) indexed phoneNumber, uint8 countryCodeDenorm, uint40 numberDenorm)",
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
