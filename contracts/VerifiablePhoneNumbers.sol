// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

contract VerifiablePhoneNumbers {
    // Types
    struct PhoneNumber {
        uint8 countryCode;
        string number;
    }

    // Events
    event LogVerificationRequested(
        uint256 indexed verificationRequestId,
        address indexed requester,
        PhoneNumber indexed phoneNumber
    );
    event LogChallengeRecorded(
        uint256 indexed verificationRequestId,
        uint8 challengeId
    );
    event LogChallengeCompleted(
        uint256 indexed verificationRequestId,
        uint8 challengeId
    );
    event LogChallengeFailed(
        uint256 indexed verificationRequestId,
        uint8 challengeId
    );
    event LogVerificationCompleted(
        uint256 indexed verificationRequestId,
        address indexed requester,
        PhoneNumber indexed phoneNumber
    );
    event LogVerificationFailed(
        uint256 indexed verificationRequestId,
        address indexed requester,
        PhoneNumber indexed phoneNumber
    );

    constructor() public {}

    function requestVerification(PhoneNumber calldata phoneNumber)
        external
        returns (uint256 verificationRequestId)
    {
        // User requests verification of a given phone number
    }

    function recordVerificationChallenge(
        uint256 verificationRequestId,
        bytes32 challengeHash
    ) external returns (uint8 challengeId) {
        // Verifier issues a challenge for a verification request
    }

    function submitChallengeResponse(
        uint256 verificationRequestId,
        uint8 challengeId,
        uint32 secretCode
    ) external {
        // Requesting user submits a challenge response
    }

    function isPhoneNumberOwner(
        address account,
        PhoneNumber calldata phoneNumber
    ) external view returns (bool) {
        // Third-party validates that an account owns a particular phone number
    }
}
