// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

contract VerifiablePhoneNumbers {
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
    event LogVerificationRequested(
        uint256 indexed verificationRequestId,
        address indexed requester,
        PhoneNumber indexed phoneNumber
    );
    event LogVerifierSelected(
        address indexed verifier,
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
    event LogProofOfOwnershipRevoked(
        address indexed previousOwner,
        PhoneNumber indexed phoneNumber
    );

    /* Constants */
    uint8 constant MAX_SELECTED_VERIFIERS = 8; // This is due to how we generate a random sampling of verifiers

    /* State */
    address public owner;
    uint8 public numSelectedVerifiers = 1;
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

    constructor(address[] memory _verifiers) {
        require(
            _verifiers.length < type(uint32).max,
            "Number of verifiers exceeds capacity (2^32 - 1)"
        );
        owner = msg.sender;
        numVerifiers = uint32(_verifiers.length);
        for (uint256 i = 0; i < _verifiers.length; i++) {
            verifiers[i] = _verifiers[i];
        }
    }

    /* Modifiers */

    modifier isActiveVerification(uint256 verificationRequestId) {
        require(
            requestStates[verificationRequestId] == VerificationState.InProgress
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
        @notice User requests verification of a given phone number
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
            phoneNumber
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
        @notice Verifier issues a challenge for a verification request
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
        @notice Requesting user submits a challenge response
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

    /* Private helpers */

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

    function _computeChallengeHash(
        address verifier,
        address requester,
        PhoneNumber memory phoneNumber,
        uint32 secretCode
    ) private pure returns (bytes32) {
        return
            keccak256(abi.encode(verifier, requester, phoneNumber, secretCode));
    }

    function _getRandomSeed(uint256 verificationRequestId)
        private
        view
        returns (uint256)
    {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.number,
                        msg.sender,
                        verificationRequestId
                    )
                )
            );
    }

    function _selectAndAssignRandomVerifiers(uint256 verificationRequestId)
        private
        returns (address[] storage)
    {
        assert(numSelectedVerifiers <= MAX_SELECTED_VERIFIERS);
        uint256 seed = _getRandomSeed(verificationRequestId);

        address[] storage selectedVerifiers = verificationRequests[
            verificationRequestId
        ].selectedVerifiers;
        for (uint8 i = 0; i < numSelectedVerifiers; i++) {
            uint32 verifierIndex = uint32(seed % numVerifiers);
            selectedVerifiers.push(verifiers[verifierIndex]);
            seed = seed / numVerifiers;
        }
        return selectedVerifiers;
    }
}
