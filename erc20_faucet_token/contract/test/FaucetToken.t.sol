// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {FaucetToken} from "../src/FaucetToken.sol";

contract FaucetTokenTest is Test {
    FaucetToken public token;
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    function setUp() public {
        token = new FaucetToken(owner);
    }

    function test_InitialOwnerIsSet() public view {
        assertEq(token.owner(), owner);
    }

    function test_MintByOwner() public {
        vm.prank(owner);
        token.mint(user2, 1_000 * 10 ** 18);

        assertEq(token.balanceOf(user2), 1_000 * 10 ** 18);
    }

    function testRevert_MintByNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user1, 1_000 * 10 ** 18);
    }

    function testRevert_MintExceedsMaxSupply() public {
        uint256 excessiveAmount = token.MAX_SUPPLY() + 1;

        vm.prank(owner);
        vm.expectRevert("Exceeds max supply");
        token.mint(user1, excessiveAmount);
    }

    function test_RequestToken() public {
        vm.prank(user1);
        token.requestToken();

        assertEq(token.balanceOf(user1), token.FAUCET_AMOUNT());
        assertEq(token.lastClaimTime(user1), block.timestamp);
    }

    function testRevert_RequestTokenCooldown() public {
        vm.prank(user1);
        token.requestToken();

        vm.prank(user1);
        vm.expectRevert("Cooldown period not elapsed");
        token.requestToken();
    }

    function test_RequestTokenAfterCooldown() public {
        vm.prank(user1);
        token.requestToken();

        skip(1 days);

        vm.prank(user1);
        token.requestToken();

        assertEq(token.balanceOf(user1), token.FAUCET_AMOUNT() * 2);
    }

    function test_RequestTokenCooldownIsUserSpecific() public {
        vm.prank(user1);
        token.requestToken();

        vm.prank(user2);
        token.requestToken();

        assertEq(token.balanceOf(user1), token.FAUCET_AMOUNT());
        assertEq(token.balanceOf(user2), token.FAUCET_AMOUNT());
    }

    function test_GetClaimableTime() public {
        vm.prank(user1);
        token.requestToken();

        uint256 remaining = token.getClaimableTime(user1);
        assertEq(remaining, 1 days);

        skip(12 hours);
        remaining = token.getClaimableTime(user1);
        assertEq(remaining, 12 hours);

        skip(12 hours);
        remaining = token.getClaimableTime(user1);
        assertEq(remaining, 0);
    }

    function test_TransferOwnershipAllowsNewOwnerToMint() public {
        vm.prank(owner);
        token.transferOwnership(user2);

        vm.prank(user2);
        token.mint(user1, 250 * 10 ** 18);

        assertEq(token.owner(), user2);
        assertEq(token.balanceOf(user1), 250 * 10 ** 18);
    }
}
