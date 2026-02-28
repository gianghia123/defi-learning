// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract HustToken {
  string _name = "HustToken";
  string _symbol = "HTN";
  uint64 _decimals = 1e6;
  uint256 _totalSupply = 1e10;

  mapping (address => uint256) balances;
  mapping (address => mapping(address => uint256)) allowances;

  event Transfer {
    address indexed sender;
    address indexed receiver;
    uint256 amount;
  }

  function name() public view returns (string memory) {
    return _name;
  }

  function symbol() public view returns (string memory) {
    return _symbol;
  }

  function decimals() public view returns (uint64) {
    return _decimals;
  }

  function totalSupply() public view returns (uint64) {
    return _totalSupply;
  }

  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(balances[])
  }
}
