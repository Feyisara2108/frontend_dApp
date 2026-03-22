// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {FaucetToken} from "../src/FaucetToken.sol";

contract FaucetTokenScript is Script {
    function setUp() public {}

    function run() public {
        address owner = vm.envAddress("OWNER");
        vm.startBroadcast(owner);

        new FaucetToken(owner);

        vm.stopBroadcast();
    }
}
