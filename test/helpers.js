function _phoneNumberHash(phoneNumber) {
    return web3.utils.keccak256(
        web3.eth.abi.encodeParameter(
            { 'PhoneNumber': { 'countryCode': 'uint8', 'number': 'uint40' } },
            phoneNumber
        )
    );
}

function computeChallengeHash(verifier, requester, phoneNumber, secretCode) {
    const encodedParams = web3.eth.abi.encodeParameters(
        ['address', 'address', { 'PhoneNumber': { 'countryCode': 'uint8', 'number': 'uint40' } }, 'uint32'],
        [verifier, requester, phoneNumber, secretCode]
    );
    return web3.utils.keccak256(encodedParams);
}

function extractVerificationRequestId(requestTx) {
    const logs = requestTx.logs.filter(log => log.event == "LogVerificationRequested");
    assert.equal(logs.length, 1);
    return logs[0].args['0'].toNumber();
}

function extractSelectedVerifiers(requestTx) {
    const logs = requestTx.logs.filter(log => log.event == "LogVerifierSelected");
    return logs.map(log => log.args["0"]);
}

function assertLogVerificationRequested(tx, requester, phoneNumber) {
    const logs = tx.logs.filter(log => log.event == "LogVerificationRequested");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].args['1'], requester);
    assert.equal(
        logs[0].args['2'],
        _phoneNumberHash(phoneNumber)
    );
}

function assertLogVerifierSelected(tx, verificationRequestId, verifiers) {
    const logs = tx.logs.filter(log => log.event == "LogVerifierSelected");
    assert.equal(logs.length, verifiers.length);

    const actualVerifiers = [];
    logs.forEach(log => {
        assert.equal(log.args["1"], verificationRequestId);
        actualVerifiers.push(log.args["0"]);
    });
    actualVerifiers.sort();
    assert.deepEqual(actualVerifiers, [...verifiers].sort());
}

function assertLogVerificationSucceeded(tx, verificationRequestId, requester, phoneNumber) {
    const logs = tx.logs.filter(log => log.event == "LogVerificationSucceeded");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].args['0'].toNumber(), verificationRequestId);
    assert.equal(logs[0].args['1'], requester);
    assert.equal(logs[0].args['2'], _phoneNumberHash(phoneNumber));
}

function assertLogVerificationFailed(tx, verificationRequestId, requester, phoneNumber) {
    const logs = tx.logs.filter(log => log.event == "LogVerificationFailed");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].args['0'].toNumber(), verificationRequestId);
    assert.equal(logs[0].args['1'], requester);
    assert.equal(logs[0].args['2'], _phoneNumberHash(phoneNumber));
}

function assertLogProofOfOwnershipRevoked(tx, previousOwner, phoneNumber) {
    const logs = tx.logs.filter(log => log.event == "LogProofOfOwnershipRevoked");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].args['0'], previousOwner);
    assert.equal(logs[0].args['1'], _phoneNumberHash(phoneNumber));
}

function assertNoLogProofOfOwnershipRevoked(tx) {
    const logs = tx.logs.filter(log => log.event == "LogProofOfOwnershipRevoked");
    assert.equal(logs.length, 0);
}

function assertLogChallengeRecorded(tx, verificationRequestId, verifier) {
    const logs = tx.logs.filter(log => log.event == "LogChallengeRecorded");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].args['0'].toNumber(), verificationRequestId);
    assert.equal(logs[0].args['1'], verifier);
}

function assertLogChallengeCompleted(tx, verificationRequestId, verifier) {
    const logs = tx.logs.filter(log => log.event == "LogChallengeCompleted");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].args['0'].toNumber(), verificationRequestId);
    assert.equal(logs[0].args['1'], verifier);
}

function assertLogChallengeFailed(tx, verificationRequestId, verifier) {
    const logs = tx.logs.filter(log => log.event == "LogChallengeFailed");
    assert.equal(logs.length, 1);
    assert.equal(logs[0].args['0'].toNumber(), verificationRequestId);
    assert.equal(logs[0].args['1'], verifier);
}

module.exports = {
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
};