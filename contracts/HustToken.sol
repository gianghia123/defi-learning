// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HustToken is IERC20, Ownable {
    uint256 _totalSupply = 10000 ether;
    uint256 _currentSupply = 0;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;

    constructor() Ownable(msg.sender) {}

    function name() public pure returns (string memory) {
        return "HUSTToken";
    }

    function symbol() public pure returns (string memory) {
        return "HUST";
    }

    function decimals() public pure returns (uint8) {
        return 18; // Just like wei.
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function allowance(
        address _owner,
        address _spender
    ) public view returns (uint256 remaining) {
        return allowances[_owner][_spender];
    }

    function transfer(
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(_to != address(0));
        return _transfer(msg.sender, _to, _value);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require((_from != address(0)) || (_to != address(0)));
        require(allowances[_from][_to] >= _value);
        allowances[_from][_to] -= _value;
        return _transfer(_from, _to, _value);
    }

    function mint(
        address _to,
        uint256 _value
    ) public onlyOwner returns (bool success) {
        require(_to != address(0));
        return _transfer(address(0), _to, _value);
    }

    function burn(uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        return _transfer(msg.sender, address(0), _value);
    }

    function approve(
        address _spender,
        uint256 _value
    ) public returns (bool success) {
        require(_spender != address(0));
        require(balances[msg.sender] >= _value); // Avoid overspend
        allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal returns (bool success) {
        if (_from == address(0)) {
            // Minting new token.
            require(_currentSupply + _value <= _totalSupply);
            balances[_to] += _value;
            _currentSupply += _value;
        } else if (_to == address(0)) {
            // Burning token
            require(balances[_from] >= _value);
            balances[_from] -= _value;
            _currentSupply -= _value;
        } else {
            require(
                (balances[_from] >= _value) ||
                    (allowances[_from][_to] >= _value)
            );
            balances[_from] -= _value;
            balances[_to] += _value;
        }
        emit Transfer(_from, _to, _value);
        return true;
    }
}
