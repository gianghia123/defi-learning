// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

contract HustToken {
  string _name = "HustToken";
  string _symbol = "HTN";
  uint64 _decimals = 1 ether;
  uint256 _totalSupply = 100000 ether;
  uint256 _currentSupply = 0;

  mapping (address => uint256) balances;
  mapping (address => mapping(address => uint256)) allowances;

  event Transfer (
    address indexed sender,
    address indexed receiver,
    uint256 amount
  );

  event Approval (
    address indexed _owner,
    address indexed _spender,
    uint256 _value
  );

  function name() public view returns (string memory) {
    return _name;
  }

  function symbol() public view returns (string memory) {
    return _symbol;
  }

  function decimals() public view returns (uint256) {
    return _decimals;
  }

  function totalSupply() public view returns (uint256) {
    return _totalSupply;
  }

  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

  function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
    return allowances[_owner][_spender];
  }

  function approve(address _spender, uint256 _value) public returns (bool success) {
    allowances[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  function transfer(address _to, uint256 _value) public returns (bool success) {
    require(balances[msg.sender] >= _value, "Not enough token to complete the transaction!");
    balances[msg.sender] -= _value;
    balances[_to] += _value;
    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
    require(balances[_from] >= _value, "Not enough token to complete the transaction!");
    require(allowances[_from][_to] >= _value, "The owner allows less token than the transaction!");
    balances[_from] -= _value;
    balances[_to] -= _value;
    allowances[_from][_to] -= _value;
    emit Transfer(_from, _to, _value);
    return true;
  }

  function mint(address _minter, uint256 _value) public returns (bool success) {
    require(_currentSupply + _value <= _totalSupply, "Current supply overflows total allowed supply");
    balances[_minter] += _value;
    _currentSupply += _value;
    return true;
  }
}
