# Problem statement
- Historically, phone numbers have been used as a sybil-resistant form of identity by many (centralized) services
- A number of existing and hypothetical _decentralized_ services could benefit from on-chain proof that an address "owns" a phone number (i.e. the controlling entity has access to any message sent to the number)
- There is currently no decentralized standard for proving that an on-chain address owns a phone number

# Proposal
A decentralized protocol that can create on-chain, verifyable proof that an address owns -- and is the sole owner of -- a particular phone number by means of attestations from a randomly-selected set of previously-verified accounts. The key objective is that, given successful attestations, an address should be able to easily prove to a 3rd party that:
1. It owns _some_ verified phone number         [weak claim]
2. It owns a _specific_ verified phone number   [strong claim]

Ideally no 3rd party can use this system to ascertain an address-phone relationship without the owning address's active participation, i.e we would like for it to be infeasible for some adversary to unilaterally infer which address owns a particular number or inversely (and of greater concern) which number is owned by a particular address.


## Approach 1
1. Account `$req_addrs` publishes a request for verification of _plaintext_ phone number `$num_to_verify` on-chain
2. A set of previously-verified phone numbers -- call it `$verifiers` -- is selected and published on-chain
3. Each verifier -- an account that owns one of the numbers in `$verifiers` -- issues a challenge to `$req_addrs` _via SMS_
    - In a nutshell, the verifier sends a random secret code over SMS to `$num_to_verify` encypted with `$req_addrs`'s public key and publishes a hash of `<verifier's address>:$req_addrs:<secret code>` on-chain
    - By publishing the plaintext secret code, `$req_addrs` provides verifyable proof that it sucessfully completed the challenge
4. Once a simple majority of challenges are completed, we can consider `$req_addrs`'s ownership of `$num_to_verify` as successfully verified

**Notes:** this approach provides a simple attestation scheme but fails to satisfy the privacy requirement. Anyone can easily deduce that `$req_addrs` owns `$num_to_verify`, starting from either the phone number or the address.


## Approach 2
- `$req_addrs` publishes intent to verify without specifying `$num_to_verify` in plaintext. Instead, it publishes a hash of `$num_to_verify:<next random nonce>` to a sequence of such verification intents (where each subsequent nonce is generated at the end of a verification request, so it is well known)
- contract selects `$verifiers` -- now identified simply by addresses -- and publishes them in response
- `$req_addrs` then sends `$num_to_verify` in a message to each verifier, but _encrypted_ by each verifier's respective public key
- each verifier does the following:
    - validate that `$num_to_verify` matches the published intent/hash
    - identify the previous verification of `$num_to_verify`, if one exists, and mark it on-chain as "superseded" by the current request -- this requires `O(# of intents)` work, and there are ways to shard the search space without meaningfully compromising privacy
    - generate a random secret code, and publish a hash of `<verifier's address>:<intent hash>:<secret code>` on-chain
    - send `$req_addrs` an SMS containing the secret code encrypted with `$req_addrs`'s public key
- `$req_addrs` completes each challenge by publishing the _plaintext_ secret code as a response

**Notes:** this approach improves on the privacy guarantees of the protocol by avoiding use of plaintext phone numbers on-chain.
- It's still easy for anyone to verify that an account owns _some_ phone number by looking at the intent hash and challenges, and an address can also provide proof of ownership of a particular number by disclosing (ideally off-chain) the number to the interested party
- Given a phone number, an entity needs to do `O(# of intents)` work to check if any address owns that number by simply checking if the number matches any intent hash
- Given an account address, deriving the associated phone number would require `O(# of possible phone numbers)` work to brute force, thanks to the nonce sequence

### Approach 2B
This introduces a modification to **Approach 2** whereby rather than including `$num_to_verify` directly in the intent hash, we instead use an _encrypted_ version of `$num_to_verify` produced by encryption via a well-known distributed threshold encryption scheme (e.g. using NuCypher). This should allow us to implement role-based restrictions on who is able to verify a number (e.g. only an account in `$verifiers` or an account that currently owns `$num_to_verify`), which should render brute forcing a phone number infeasible.

# Topics to flesh out
- Incentivizing verifiers
- Tolerance to phone number takeovers (e.g. SIM-swaps): preventing SIM-swaps is actually one of the killer use-cases for this protocol, but it requires some augmentation such as introducing a cooldown period between successful attestation and ownership being transferred during which previous phone number owner can "dispute"
- Who will watch the watchmen, i.e. policing verifiers' off-chain actions: since part of the protocol occurs off-chain, there exists the possibility of verifiers incorrectly implementing the protocol (e.g. sending unencrypted secret codes) maliciously or inadvertently, and we would like the protocol to have some means of enforcing or disincintivizing such behavior
