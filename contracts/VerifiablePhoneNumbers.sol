// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

contract VerifiablePhoneNumbers {
    // Types
    struct PhoneNumber {
        uint8 countryCode;
        uint40 number;
    }
    struct Verifier {
        address addr;
        PhoneNumber number;
    }
    struct VerificationRequest {
        address requester;
        PhoneNumber number;
        Verifier[] selectedVerifiers;
    }
    struct VerificationChallenge {
        address verifierAddress;
        bytes32 challengeHash;
    }
    enum VerificationState {
        Null,
        InProgress,
        Succeeded,
        Failed
    }
    enum ChallengeState {
        Null,
        Issued,
        Completed,
        Failed
    }

    // Events
    event LogVerificationRequested(
        uint256 indexed verificationRequestId,
        address indexed requester,
        PhoneNumber indexed phoneNumber
    );
    event LogVerifierSelected(
        address indexed verifierAddress,
        uint256 verificationRequestId
    );
    event LogChallengeRecorded(
        uint256 indexed verificationRequestId,
        address verifier
    );
    event LogChallengeCompleted(
        uint256 indexed verificationRequestId,
        address verifier
    );
    event LogChallengeFailed(
        uint256 indexed verificationRequestId,
        address verifier
    );
    event LogVerificationSucceeded(
        uint256 indexed verificationRequestId,
        address indexed requester,
        PhoneNumber indexed phoneNumber
    );
    event LogVerificationFailed(
        uint256 indexed verificationRequestId,
        address indexed requester,
        PhoneNumber indexed phoneNumber
    );

    // State
    address public owner;
    uint256 public numVerifiers;
    mapping(uint256 => Verifier) public verifiers;

    mapping(uint8 => mapping(uint40 => address))
        private issuedProofsOfOwnership;

    uint256 private verificationRequestCounter = 0;
    mapping(uint256 => VerificationRequest) private verificationRequests;
    mapping(uint256 => VerificationState) private requestStates;

    mapping(uint256 => mapping(address => ChallengeState))
        private challengeStates;
    mapping(uint256 => mapping(address => VerificationChallenge))
        private verificationChallenges;

    constructor(Verifier[] memory _verifiers) {
        owner = msg.sender;
        numVerifiers = _verifiers.length;
        for (uint256 i = 0; i < _verifiers.length; i++) {
            verifiers[i] = _verifiers[i];
        }
    }

    // Modifiers
    modifier isActiveVerification(uint256 verificationRequestId) {
        require(
            requestStates[verificationRequestId] == VerificationState.InProgress
        );
        _;
    }

    // API
    function requestVerification(PhoneNumber calldata phoneNumber)
        external
        returns (uint256 verificationRequestId)
    {
        // User requests verification of a given phone number
    }

    function recordVerificationChallenge(
        uint256 verificationRequestId,
        bytes32 challengeHash
    ) external isActiveVerification(verificationRequestId) {
        // Verifier issues a challenge for a verification request
    }

    function submitChallengeResponse(
        uint256 verificationRequestId,
        address verifier,
        uint32 secretCode
    ) external isActiveVerification(verificationRequestId) {
        // Requesting user submits a challenge response
    }

    function isPhoneNumberOwner(
        address account,
        PhoneNumber calldata phoneNumber
    ) external view returns (bool) {
        // Third-party validates that an account owns a particular phone number
        require(account != address(0));
        return
            issuedProofsOfOwnership[phoneNumber.countryCode][
                phoneNumber.number
            ] == account;
    }
}
