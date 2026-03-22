export const TOKEN_ABI = [

    "function COOLDOWN_PERIOD() view returns (uint256)",
    "function FAUCET_AMOUNT() view returns (uint256)",
    "function MAX_SUPPLY() view returns (uint256)",


    //ERC20 Standard
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",

    // Faucet (View)
    "function getClaimableTime(address user) view returns (uint256)",
    "function lastClaimTime(address) view returns (uint256)",

    // ERC20 Standard (Write) 
    "function transfer(address to, uint256 value) returns (bool)",

    // Core (Write) 
    "function requestToken()",
    "function mint(uint256 amount)",

];