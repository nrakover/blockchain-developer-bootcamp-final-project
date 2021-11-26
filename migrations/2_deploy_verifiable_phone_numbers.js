const VerifiablePhoneNumbers = artifacts.require("VerifiablePhoneNumbers");

module.exports = function (deployer, network, accounts) {
    const [owner] = accounts;
    deployer.deploy(VerifiablePhoneNumbers, 1, [owner], { from: owner });
};
