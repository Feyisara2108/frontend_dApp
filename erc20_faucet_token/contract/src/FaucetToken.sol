// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FaucetToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10 ** 18;
    uint256 public constant FAUCET_AMOUNT = 10 * 10 ** 18;
    uint256 public constant COOLDOWN_PERIOD = 24 hours;

    mapping(address => uint256) public lastClaimTime;

    event TokenRequested(address indexed user, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    constructor(address initialOwner) ERC20("KOMI", "KMI") Ownable(initialOwner) {}

    function requestToken() external {
        require(totalSupply() + FAUCET_AMOUNT <= MAX_SUPPLY, "Max supply reached");
        require(
            lastClaimTime[msg.sender] == 0 || block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN_PERIOD,
            "Cooldown period not elapsed"
        );

        lastClaimTime[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit TokenRequested(msg.sender, FAUCET_AMOUNT);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);

        emit TokensMinted(to, amount);
    }

    function getClaimableTime(address user) external view returns (uint256) {
        if (lastClaimTime[user] == 0) return 0;

        uint256 readyTime = lastClaimTime[user] + COOLDOWN_PERIOD;
        if (block.timestamp >= readyTime) return 0;

        return readyTime - block.timestamp;
    }
}
