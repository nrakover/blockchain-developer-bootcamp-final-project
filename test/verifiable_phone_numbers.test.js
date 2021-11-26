const VerifiablePhoneNumbers = artifacts.require("VerifiablePhoneNumbers");

const {
  computeChallengeHash,
  extractVerificationRequestId,
  extractSelectedVerifiers,
  assertLogVerificationRequested,
  assertLogVerifierSelected,
  assertLogVerificationSucceeded,
  assertLogVerificationFailed,
  assertLogProofOfOwnershipRevoked,
  assertNoLogProofOfOwnershipRevoked,
  assertLogChallengeRecorded,
  assertLogChallengeCompleted,
  assertLogChallengeFailed
} = require("./helpers.js");
const { catchRevert } = require("./exceptionsHelpers.js");

contract("VerifiablePhoneNumbers", function (accounts) {
  const [_owner, alice, bob, carla, davi] = accounts;
  const emptyAddress = "0x0000000000000000000000000000000000000000";
  const phNum1 = { countryCode: 1, number: 1234567890 };
  const phNum2 = { countryCode: 1, number: 1234567891 };
  const phNum3 = { countryCode: 1, number: 1234567892 };

  let instance;

  describe("Protocol initialization", async () => {
    it("Bootstraps protocol with a set of verifiers", async () => {
      instance = await VerifiablePhoneNumbers.new(2, [alice, bob, carla]);

      assert.equal(await instance.numVerifiersPerRequest.call(), 2);

      assert.equal(await instance.numVerifiers.call(), 3);
      assert.equal(await instance.verifiers.call(0), alice);
      assert.equal(await instance.verifiers.call(1), bob);
      assert.equal(await instance.verifiers.call(2), carla);
    });

    it("Selects expected set of unique verifiers for verification requests", async () => {
      instance = await VerifiablePhoneNumbers.new(3, [alice, bob, carla]);

      const requestTx = await instance.requestVerification(phNum1, { from: davi });
      const selectedVerifiers = extractSelectedVerifiers(requestTx);

      assert.deepEqual([...selectedVerifiers].sort(), [alice, bob, carla].sort());
    });
  });

  describe("Protocol steps", async () => {
    beforeEach(async () => {
      instance = await VerifiablePhoneNumbers.new(1, [alice]);
    });

    it("Allow user to request verification of a given phone number", async () => {
      const requestTx = await instance.requestVerification(phNum1, { from: bob });
      assertLogVerificationRequested(requestTx, bob, phNum1);
      const verificationRequestId = extractVerificationRequestId(requestTx);
      assertLogVerifierSelected(requestTx, verificationRequestId, [alice]);
    });

    describe("Recording a challenge", async () => {
      let verificationRequestId;

      beforeEach(async () => {
        const requestTx = await instance.requestVerification(phNum1, { from: bob });
        verificationRequestId = extractVerificationRequestId(requestTx);
      });

      it("Allow verifier to issue a challenge for a verification request", async () => {
        const secretCode = 12345;
        const challengeHash = computeChallengeHash(alice, bob, phNum1, secretCode);
        const tx = await instance.recordVerificationChallenge(verificationRequestId, challengeHash, { from: alice });
        assertLogChallengeRecorded(tx, verificationRequestId, alice);
      });

      it("Does not allow non-verifier to issue a challenge for a verification request", async () => {
        const secretCode = 12345;
        const challengeHash = computeChallengeHash(alice, bob, phNum1, secretCode);
        await catchRevert(instance.recordVerificationChallenge(verificationRequestId, challengeHash, { from: bob }));
      });
    });

    describe("Submitting a challenge response", async () => {
      const secretCode = 12345;
      let verificationRequestId;

      beforeEach(async () => {
        const requestTx = await instance.requestVerification(phNum1, { from: bob });
        verificationRequestId = extractVerificationRequestId(requestTx);

        const challengeHash = computeChallengeHash(alice, bob, phNum1, secretCode);
        await instance.recordVerificationChallenge(verificationRequestId, challengeHash, { from: alice });
      });

      it("Accepts a correct challenge response from the requesting user", async () => {
        const tx = await instance.submitChallengeResponse(verificationRequestId, alice, secretCode, { from: bob });
        assertLogChallengeCompleted(tx, verificationRequestId, alice);
      });

      it("Rejects an incorrect challenge response from the requesting user", async () => {
        const tx = await instance.submitChallengeResponse(verificationRequestId, alice, secretCode + 1, { from: bob });
        assertLogChallengeFailed(tx, verificationRequestId, alice);
        assertLogVerificationFailed(tx, verificationRequestId, bob, phNum1);
      });

      it("Does not allow a non-requesting user to submit a challenge response", async () => {
        await catchRevert(instance.submitChallengeResponse(verificationRequestId, alice, secretCode, { from: carla }));
      });
    });
  });

  describe("End-to-end use cases", async () => {
    beforeEach(async () => {
      instance = await VerifiablePhoneNumbers.new(1, [alice]);
    });

    it("Shows that requester owns a phone number after successful verification", async () => {
      // Ensure requester doesn't already own the number
      assert.equal(await instance.isPhoneNumberOwner.call(bob, phNum1), false);

      // Do the dance
      const { completionTx } = await doVerification(bob, phNum1);

      // Ensure requester now owns the number
      assert.equal(await instance.isPhoneNumberOwner.call(bob, phNum1), true);

      // Smoke test that other don't also own it, and that the requester doesn't own other numbers
      assert.equal(await instance.isPhoneNumberOwner.call(bob, phNum2), false);
      assert.equal(await instance.isPhoneNumberOwner.call(alice, phNum1), false);
      assert.equal(await instance.isPhoneNumberOwner.call(carla, phNum1), false);

      assertNoLogProofOfOwnershipRevoked(completionTx);
    });

    it("Revokes previously issued proofs of ownership for a newly verified number", async () => {
      // Verify `bob` owns the number, after which they should own it and not `carla`
      let { completionTx } = await doVerification(bob, phNum1);
      assert.equal(await instance.isPhoneNumberOwner.call(bob, phNum1), true);
      assert.equal(await instance.isPhoneNumberOwner.call(carla, phNum1), false);
      assertNoLogProofOfOwnershipRevoked(completionTx);

      // Verify `carla` owns the number, after which they should own it and not `bob`
      ({ completionTx } = await doVerification(carla, phNum1));
      assert.equal(await instance.isPhoneNumberOwner.call(bob, phNum1), false);
      assert.equal(await instance.isPhoneNumberOwner.call(carla, phNum1), true);
      assertLogProofOfOwnershipRevoked(completionTx, bob, phNum1);
    });

    async function doVerification(requester, phoneNumber) {
      const requestTx = await instance.requestVerification(phoneNumber, { from: requester });
      const verificationRequestId = extractVerificationRequestId(requestTx);
      assert.equal(await instance.isPhoneNumberOwner.call(requester, phoneNumber), false);

      const secretCode = 12345;
      const challengeHash = computeChallengeHash(alice, requester, phoneNumber, secretCode);
      await instance.recordVerificationChallenge(verificationRequestId, challengeHash, { from: alice });
      assert.equal(await instance.isPhoneNumberOwner.call(requester, phoneNumber), false);

      const completionTx = await instance.submitChallengeResponse(verificationRequestId, alice, secretCode, { from: requester });
      assertLogVerificationSucceeded(completionTx, verificationRequestId, requester, phoneNumber);

      return { verificationRequestId, requestTx, completionTx };
    }
  });
});
