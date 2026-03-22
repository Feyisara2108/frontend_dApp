// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import {FaucetToken} from "../src/FaucetToken.sol";

contract FaucetTokenTest is Test {
    FaucetToken public token;
    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    function setUp() public {
        vm.prank(owner);
        token = new FaucetToken(owner);
    }

    function test_RolesAssigned() public view {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), owner));
        assertTrue(token.hasRole(token.MINTER_ROLE(), owner));
    }

    function test_MintByMinter() public {
        vm.prank(owner);
        token.mint(1000 * 10**18);
        assertEq(token.balanceOf(owner), 1000 * 10**18);
    }

    function testRevert_MintByNonMinter() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(1000 * 10**18);
    }

    function test_RequestToken() public {
        vm.prank(user1);
        token.requestToken();
        assertEq(token.balanceOf(user1), token.FAUCET_AMOUNT());
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
}
