// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./HustToken.sol";

contract TokenTest {
    HustToken token;

    function setUp() public {
        token = new HustToken();
    }

    function hash(string memory _i) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_i)));
    }

    function test_Name() public view {
        require(hash(token.name()) == hash("HUSTToken"));
    }

    function test_Symbol() public view {
        require(hash(token.symbol()) == hash("HUST"));
    }

    function test_Decimals() public view {
        require(token.decimals() == 18);
    }

    function test_TotalBalance() public view {
        require(token.totalSupply() == 10000 ether);
    }

    function test_Mint() public {
        address testAddress = address(1337);
        token.mint(testAddress, 1 gwei);
        require(token.balanceOf(testAddress) == 1 gwei);
    }
}
