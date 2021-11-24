const BN = web3.utils.BN;
const VerifiablePhoneNumbers = artifacts.require("VerifiablePhoneNumbers");

contract("VerifiablePhoneNumbers", function (accounts) {
  const [_owner, alice, bob] = accounts;
  const emptyAddress = "0x0000000000000000000000000000000000000000";

  let instance;

  beforeEach(async () => {
    instance = await VerifiablePhoneNumbers.new();
  });

  describe("Use cases", () => {
    it("should bootstrap protocol with a set of account-phone number pairs", () => {
      assert(false);
    });

    it("should allow user to request verification of a given phone number", () => {
      assert(false);
    });

    it("should allow verifier to issue a challenge for a verification request", () => {
      assert(false);
    });

    it("should allow the requesting user to submit a challenge response", () => {
      assert(false);
    });

    it("should issue proof of phone number ownership upon successful verification", () => {
      assert(false);
    });

    it("should allow checking that an account owns a particular phone number", () => {
      assert(false);
    });
  });
});
