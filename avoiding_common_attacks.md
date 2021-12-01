## Avoiding common attacks
- All contract functions follow the **Checks-Effects-Interactions** pattern
- **Pull over push**: the contract makes _no calls to other contracts, nor does it transfer ether to any address_
- Liberal use of modifiers that apply `require` predicates
- Very narrow pragma, compiling only against `0.8.9` at time of writing
