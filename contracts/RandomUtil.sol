// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

library RandomUtil {
    uint8 constant MAX_SAMPLING_RETRIES = 10;

    function getRandomSeed(uint256 nonce) internal view returns (uint256) {
        return
            uint256(
                keccak256(abi.encodePacked(block.number, msg.sender, nonce))
            );
    }

    function _generatePseudoRandomNum(uint256 seed, uint8 i)
        private
        pure
        returns (uint256)
    {
        return uint256(keccak256(abi.encode(seed + i)));
    }

    function sampleUnique(
        uint32 n,
        uint8 k,
        uint256 seed
    ) internal pure returns (uint32[] memory) {
        uint32[] memory samples = new uint32[](k);
        uint8 i = 0;
        uint8 retries = 0;
        while (i < k) {
            uint256 rand = _generatePseudoRandomNum(seed, i + retries);
            uint32 s = uint32(rand % n);
            bool unique = true;
            for (uint8 j = 0; j < i; j++) {
                if (s == samples[j]) {
                    unique = false;
                    break;
                }
            }
            if (unique) {
                samples[i] = s;
                i++;
            } else {
                retries++;
                assert(retries < MAX_SAMPLING_RETRIES);
            }
        }
        return samples;
    }
}
