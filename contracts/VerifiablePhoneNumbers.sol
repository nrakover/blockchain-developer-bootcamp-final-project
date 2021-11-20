// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

contract VerifiablePhoneNumbers {
    struct PhoneNumber {
        uint8 countryCode;
        uint40 number;
    }

    constructor() public {}

    function requestVerification(PhoneNumber calldata phoneNumber)
        external
        returns (uint256)
    {
        // User requests verification of a given phone number
    }

    function recordVerificationChallenge(
        uint256 verificationRequestId,
        bytes32 challengeHash
    ) external {
        // Verifier issues a challenge for a verification request
    }

    function submitChallengeResponse(
        uint256 verificationRequestId,
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
