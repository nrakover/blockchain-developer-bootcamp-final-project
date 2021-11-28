// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RandomUtil.sol";

/**
    @title A service for decentralized verification of phone number ownership.
    @author Nico Rakover
    @notice This version of the contract makes the address-phone relationship public, so be mindful of
        exposing information you would rather keep private.
    @custom:experimental This is an experimental contract.
*/
contract VerifiablePhoneNumbers is Ownable {
    /* Types */
    struct PhoneNumber {
        uint8 countryCode;
        uint40 number;
    }
    struct VerificationRequest {
        address requester;
        PhoneNumber number;
        address[] selectedVerifiers;
    }
    struct VerificationChallenge {
        address verifier;
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

    /* Events */

    // `countryCode` and `number` are denormalized because `phoneNumber` is included only as a hash
    event LogVerificationRequested(
        uint256 indexed verificationRequestId,
        address indexed requester,
        PhoneNumber indexed phoneNumber,
        uint8 countryCodeDenorm,
        uint40 numberDenorm
    );
    event LogVerifierSelected(
        address indexed verifier,
        uint256 verificationRequestId
    );
    event LogChallengeRecorded(
        uint256 indexed verificationRequestId,
        address indexed verifier
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
    event LogProofOfOwnershipRevoked(
        address indexed previousOwner,
        PhoneNumber indexed phoneNumber
    );

    /* Constants */
    uint8 constant MAX_SELECTED_VERIFIERS = 8; // This is due to how we generate a random sampling of verifiers

    /* State */
    uint8 public numVerifiersPerRequest;
    uint32 public numVerifiers;
    mapping(uint256 => address) public verifiers;

    mapping(uint8 => mapping(uint40 => address))
        private issuedProofsOfOwnership;

    uint256 private verificationRequestCounter = 0;
    mapping(uint256 => VerificationRequest) private verificationRequests;
    mapping(uint256 => VerificationState) private requestStates;

    mapping(uint256 => mapping(address => ChallengeState))
        private challengeStates;
    mapping(uint256 => mapping(address => VerificationChallenge))
        private verificationChallenges;

    constructor(uint8 _numVerifiersPerRequest, address[] memory _verifiers) {
        require(
            _numVerifiersPerRequest <= MAX_SELECTED_VERIFIERS,
            string(
                abi.encodePacked(
                    "Verifier per request cannot exceed ",
                    MAX_SELECTED_VERIFIERS
                )
            )
        );
        require(
            _verifiers.length < type(uint32).max,
            "Number of verifiers exceeds capacity (2^32 - 1)"
        );
        numVerifiersPerRequest = _numVerifiersPerRequest;
        numVerifiers = uint32(_verifiers.length);
        for (uint256 i = 0; i < _verifiers.length; i++) {
            verifiers[i] = _verifiers[i];
        }
    }

    /* Modifiers */

    modifier isActiveVerification(uint256 verificationRequestId) {
        require(
            requestStates[verificationRequestId] ==
                VerificationState.InProgress,
            "Not an active verification request"
        );
        _;
    }

    modifier isRequestVerifier(uint256 verificationRequestId, address addr) {
        address[] storage selectedVerifiers = verificationRequests[
            verificationRequestId
        ].selectedVerifiers;
        bool matched = false;
        for (uint8 i = 0; i < selectedVerifiers.length; i++) {
            if (addr == selectedVerifiers[i]) {
                matched = true;
                break;
            }
        }
        require(matched, "Not a verifier for this request");
        _;
    }

    modifier isRequester(uint256 verificationRequestId, address addr) {
        require(
            verificationRequests[verificationRequestId].requester == addr,
            "Not the requester for this request"
        );
        _;
    }

    /* API */

    /**
        @notice User requests verification of a given phone number.
        @param phoneNumber The number that the caller would like to prove ownership for.
        @return verificationRequestId The unique indentifier for this verification request.
     */
    function requestVerification(PhoneNumber calldata phoneNumber)
        external
        returns (uint256 verificationRequestId)
    {
        verificationRequestId = verificationRequestCounter;
        VerificationRequest storage newRequest = verificationRequests[
            verificationRequestId
        ];
        newRequest.requester = msg.sender;
        newRequest.number = phoneNumber;
        address[] storage selectedVerifiers = _selectAndAssignRandomVerifiers(
            verificationRequestId
        );
        requestStates[verificationRequestId] = VerificationState.InProgress;

        emit LogVerificationRequested(
            verificationRequestId,
            msg.sender,
            phoneNumber,
            phoneNumber.countryCode,
            phoneNumber.number
        );
        for (uint8 i = 0; i < selectedVerifiers.length; i++) {
            emit LogVerifierSelected(
                selectedVerifiers[i],
                verificationRequestId
            );
        }

        verificationRequestCounter++;
    }

    /**
        @notice Verifier issues a challenge for a verification request.
        @param verificationRequestId The verification for which this challenge is being issued.
        @param challengeHash The keccak256 hash of [verifier address, requester address, phone number, secret uint32 code]
     */
    function recordVerificationChallenge(
        uint256 verificationRequestId,
        bytes32 challengeHash
    )
        external
        isActiveVerification(verificationRequestId)
        isRequestVerifier(verificationRequestId, msg.sender)
    {
        require(
            challengeStates[verificationRequestId][msg.sender] ==
                ChallengeState.Null,
            "Can't record a challenge as one has already been issued"
        );
        challengeStates[verificationRequestId][msg.sender] = ChallengeState
            .Issued;
        verificationChallenges[verificationRequestId][
            msg.sender
        ] = VerificationChallenge(msg.sender, challengeHash);

        emit LogChallengeRecorded(verificationRequestId, msg.sender);
    }

    /**
        @notice Requesting user submits a challenge response, which should be the secret uint32 code
            corresponding to the associated challenge hash.
        @param verificationRequestId The verification for which this challenge was issued.
        @param verifier The address of the verifier that submitted the challenge.
        @param secretCode The secret code shared with the requester via SMS (off-chain).
     */
    function submitChallengeResponse(
        uint256 verificationRequestId,
        address verifier,
        uint32 secretCode
    )
        external
        isActiveVerification(verificationRequestId)
        isRequester(verificationRequestId, msg.sender)
    {
        require(
            challengeStates[verificationRequestId][verifier] ==
                ChallengeState.Issued,
            "Can't submit a response for this challenge"
        );
        bytes32 submittedResponseHash = _computeChallengeHash(
            verifier,
            msg.sender,
            verificationRequests[verificationRequestId].number,
            secretCode
        );
        VerificationChallenge memory challenge = verificationChallenges[
            verificationRequestId
        ][verifier];
        if (submittedResponseHash == challenge.challengeHash) {
            challengeStates[verificationRequestId][verifier] = ChallengeState
                .Completed;
            emit LogChallengeCompleted(verificationRequestId, verifier);
        } else {
            challengeStates[verificationRequestId][verifier] = ChallengeState
                .Failed;
            emit LogChallengeFailed(verificationRequestId, verifier);
        }

        _maybeCompleteVerification(verificationRequestId);
    }

    /**
        @notice Convenience method for any party to validate ownership of a phone number.
        @param account The hypothesized owner.
        @param phoneNumber The phone number for which this checks ownership.
        @return whether the account owns this phone number according to previously-completed verifications.
    */
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

    /* Admin API */

    /**
        @notice Allows the contract owner to add a verifier.
        @dev Note that this allows for duplicate verifiers, which affects odds of selection.
        @param verifierToAdd The verifier address to add.
    */
    function addVerifier(address verifierToAdd) external onlyOwner {
        verifiers[numVerifiers] = verifierToAdd;
        numVerifiers++;
    }

    /**
        @notice Allows the contract owner to remove a verifier.
        @dev Note that this method removes _all_ occurences of the verifier in the set.
        @param verifierToRemove The verifier address to remove.
    */
    function removeVerifier(address verifierToRemove) external onlyOwner {
        uint32 nextVerifierToSwap = numVerifiers - 1;
        while (
            nextVerifierToSwap >= 0 &&
            verifiers[nextVerifierToSwap] == verifierToRemove
        ) {
            delete verifiers[nextVerifierToSwap];
            nextVerifierToSwap--;
            numVerifiers--;
        }

        for (uint32 i = 0; i < numVerifiers; i++) {
            if (i >= nextVerifierToSwap) {
                break;
            }
            if (verifiers[i] == verifierToRemove) {
                verifiers[i] = verifiers[nextVerifierToSwap];
                delete verifiers[nextVerifierToSwap];
                nextVerifierToSwap--;
                numVerifiers--;
                while (
                    nextVerifierToSwap > 0 &&
                    verifiers[nextVerifierToSwap] == verifierToRemove
                ) {
                    delete verifiers[nextVerifierToSwap];
                    nextVerifierToSwap--;
                    numVerifiers--;
                }
            }
        }
    }

    /**
        @notice Allows the contract owner to change the number of verifiers selected per verification request.
        @param _numVerifiersPerRequest The desired number of verifiers selected per verification request.
    */
    function setNumVerifiersPerRequest(uint8 _numVerifiersPerRequest)
        external
        onlyOwner
    {
        require(_numVerifiersPerRequest < MAX_SELECTED_VERIFIERS);
        numVerifiersPerRequest = _numVerifiersPerRequest;
    }

    /* Private helpers */

    function _computeChallengeHash(
        address verifier,
        address requester,
        PhoneNumber memory phoneNumber,
        uint32 secretCode
    ) private pure returns (bytes32) {
        return
            keccak256(abi.encode(verifier, requester, phoneNumber, secretCode));
    }

    function _maybeCompleteVerification(uint256 verificationRequestId) private {
        VerificationRequest memory request = verificationRequests[
            verificationRequestId
        ];
        address[] memory selectedVerifiers = request.selectedVerifiers;
        ChallengeState[] memory challengeResults = new ChallengeState[](
            selectedVerifiers.length
        );
        for (uint8 i = 0; i < selectedVerifiers.length; i++) {
            challengeResults[i] = challengeStates[verificationRequestId][
                selectedVerifiers[i]
            ];
        }

        if (_isVerificationFailureConditionMet(challengeResults)) {
            // Update state
            requestStates[verificationRequestId] = VerificationState.Failed;

            // Emit event
            emit LogVerificationFailed(
                verificationRequestId,
                request.requester,
                request.number
            );
        } else if (_isVerificationSuccessConditionMet(challengeResults)) {
            // Update state
            requestStates[verificationRequestId] = VerificationState.Succeeded;
            address previousOwner = issuedProofsOfOwnership[
                request.number.countryCode
            ][request.number.number];
            issuedProofsOfOwnership[request.number.countryCode][
                request.number.number
            ] = request.requester;

            // Emit event
            emit LogVerificationSucceeded(
                verificationRequestId,
                request.requester,
                request.number
            );
            if (previousOwner != address(0)) {
                emit LogProofOfOwnershipRevoked(previousOwner, request.number);
            }
        }
    }

    function _isVerificationFailureConditionMet(
        ChallengeState[] memory challengeResults
    ) private pure returns (bool) {
        uint8 numCompletedChallenges = 0;
        uint8 numFailedChallenges = 0;
        for (uint8 i = 0; i < challengeResults.length; i++) {
            if (challengeResults[i] == ChallengeState.Completed) {
                numCompletedChallenges++;
            } else if (challengeResults[i] == ChallengeState.Failed) {
                numFailedChallenges++;
            }
        }

        if (
            numCompletedChallenges + numFailedChallenges ==
            challengeResults.length
        ) {
            return numFailedChallenges > numCompletedChallenges;
        }
        return false;
    }

    function _isVerificationSuccessConditionMet(
        ChallengeState[] memory challengeResults
    ) private pure returns (bool) {
        uint8 numCompletedChallenges = 0;
        uint8 numFailedChallenges = 0;
        for (uint8 i = 0; i < challengeResults.length; i++) {
            if (challengeResults[i] == ChallengeState.Completed) {
                numCompletedChallenges++;
            } else if (challengeResults[i] == ChallengeState.Failed) {
                numFailedChallenges++;
            }
        }

        if (
            numCompletedChallenges + numFailedChallenges ==
            challengeResults.length
        ) {
            return numCompletedChallenges > numFailedChallenges;
        }
        return false;
    }

    function _selectAndAssignRandomVerifiers(uint256 verificationRequestId)
        private
        returns (address[] storage)
    {
        assert(numVerifiersPerRequest <= MAX_SELECTED_VERIFIERS);
        address[] storage selectedVerifiers = verificationRequests[
            verificationRequestId
        ].selectedVerifiers;
        uint32[] memory selectedVerifierIndices = RandomUtil.sampleUnique(
            numVerifiers,
            numVerifiersPerRequest,
            RandomUtil.getRandomSeed(verificationRequestId)
        );
        for (uint8 i = 0; i < numVerifiersPerRequest; i++) {
            uint32 verifierIndex = selectedVerifierIndices[i];
            selectedVerifiers.push(verifiers[verifierIndex]);
        }
        return selectedVerifiers;
    }
}
