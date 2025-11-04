// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @notice Modular smart contract vault on HyperEVM for interacting with HyperCore via CoreWriter.
 *         Supports basic deposit/withdraw of USDC, with separate functions for all CoreWriter actions.
 *         Handles precise scaling: USD/prices/sizes as 10^8 (e.g., 1.23 USDC → 123000000), token wei as 10^18.
 *         Assumes USDC (6 decimals) on HyperEVM; scales inputs accordingly.
 *         Owner-only for trading actions to follow user instructions securely.
 * @dev Deploy on HyperEVM (chain ID 33101). Test on 33110. Audit before use.
 *      USDC address: Use mainnet USDC (e.g., 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, but confirm for HyperEVM).
 */
contract HyperCoreVault is Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    // Constants
    address public constant CORE_WRITER = 0x3333333333333333333333333333333333333333;
    IERC20 public USDC; // USDC token on HyperEVM (6 decimals)
    uint256 public constant USD_SCALE = 10**8; // Hyperliquid USD/price/size scaling
    uint256 public constant WEI_SCALE = 10**18; // Native token wei scaling
    uint256 public constant USDC_DECIMALS = 10**6; // USDC decimals

    uint64 public USDC_ID;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event DepositedToCore(address indexed user, address indexed token, uint256 amount);
    event WithdrawnFromCore(address indexed user, address indexed token, uint256 amount);
    event ActionExecuted(uint24 actionId, bytes data);

    // Errors
    error InvalidAmount();
    error InvalidAction();
    error ActionFailed();

    /**
     * @notice Initialize the upgradeable contract
     * @param usdcAddress Address of USDC on HyperEVM
     * @param owner Address of the contract owner
     */
    function initialize(address usdcAddress, address owner) public initializer {
        __Ownable_init(owner);
        USDC = IERC20(usdcAddress);
        USDC_ID = 0;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DEPOSIT / WITHDRAW FUNCTIONS (Basic Vault Actions)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deposit USDC from user to HyperCore spot balance.
     * @dev User approves vault for USDC, vault transfers from user then sends to system address.
     *      System address for USDC (token ID 0): 0x2000000000000000000000000000000000000000
     * @param amount USDC amount in native decimals (6 decimals, e.g., 1000000 = 1 USDC).
     */
    function depositUSDC(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();

        // Transfer USDC from user to vault
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // Send to system address (0x2000...0000 for token ID 0)
        // This credits the vault's HyperCore spot balance
        USDC.safeTransfer(address(uint160(0x2000000000000000000000000000000000000000)), amount);

        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw USDC from HyperCore spot balance to caller.
     * @dev Uses spotSend action with system address as destination.
     *      The system will call transfer(recipient, amount) on USDC contract.
     *      Recipient is automatically set to the sender (this vault).
     * @param amount USDC amount in native decimals (6 decimals, e.g., 1000000 = 1 USDC).
     */
    function withdrawUSDC(uint256 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();

        // Scale to 10^18 for spotSend (weiAmount)
        uint64 weiAmount = uint64(amount * 1e12); // Convert 6 decimals to 18 decimals

        // spotSend with system address as destination
        // System will transfer tokens to this vault
        address systemAddress = address(uint160(0x2000000000000000000000000000000000000000));
        bytes memory encoded = abi.encode(systemAddress, USDC_ID, weiAmount);
        _executeAction(0x000006, encoded);

        // Transfer from vault to caller
        USDC.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COREWRITER FUNCTIONS (Separate for Each Action)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Place a limit order on perps/spots (ID 1).
     * @dev Owner-only. Scales price/size to 10^8.
     * @param asset Asset ID (e.g., 0 for BTC).
     * @param isBuy True for buy/long.
     * @param limitPx Human-readable price (e.g., 50000.50 → pass 5000050000000 for 10^8 scale externally, but function scales it).
     * @param sz Human-readable size (e.g., 0.01 BTC).
     * @param reduceOnly True to reduce position only.
     * @param encodedTif Time-in-force (1=Alo, 2=Gtc, 3=Ioc).
     * @param cloid Client order ID (uint128).
     */
    function placeLimitOrder(
        uint32 asset,
        bool isBuy,
        uint64 limitPx, // Human-readable * 10^8 (caller provides scaled)
        uint64 sz,      // Human-readable * 10^8 (caller provides scaled)
        bool reduceOnly,
        uint8 encodedTif,
        uint128 cloid
    ) external onlyOwner {
        bytes memory encoded = abi.encode(asset, isBuy, limitPx, sz, reduceOnly, encodedTif, cloid);
        _executeAction(0x000001, encoded);
    }

    /**
     * @notice Transfer to/from vault (ID 2).
     * @dev Owner-only. Scales USD to 10^8.
     * @param vault Vault address.
     * @param isDeposit True to deposit.
     * @param usd Human-readable USD (e.g., 100.00 → pass 10000000000 for 10^8 scale externally).
     */
    function vaultTransfer(
        address vault,
        bool isDeposit,
        uint64 usd
    ) external onlyOwner {
        bytes memory encoded = abi.encode(vault, isDeposit, usd);
        _executeAction(0x000002, encoded);
    }

    /**
     * @notice Delegate/undelegate tokens for staking (ID 3).
     * @dev Owner-only. Scales wei to 10^18.
     * @param validator Validator address.
     * @param weiAmount Human-readable wei (scaled 10^18 externally).
     * @param isUndelegate True to undelegate.
     */
    function tokenDelegate(
        address validator,
        uint64 weiAmount,
        bool isUndelegate
    ) external onlyOwner {
        bytes memory encoded = abi.encode(validator, weiAmount, isUndelegate);
        _executeAction(0x000003, encoded);
    }

    /**
     * @notice Staking deposit (ID 4).
     * @dev Owner-only. Scales wei to 10^18.
     * @param weiAmount Human-readable wei (scaled 10^18).
     */
    function stakingDeposit(uint64 weiAmount) external onlyOwner {
        bytes memory encoded = abi.encode(weiAmount);
        _executeAction(0x000004, encoded);
    }

    /**
     * @notice Staking withdraw (ID 5).
     * @dev Owner-only. Scales wei to 10^18.
     * @param weiAmount Human-readable wei (scaled 10^18).
     */
    function stakingWithdraw(uint64 weiAmount) external onlyOwner {
        bytes memory encoded = abi.encode(weiAmount);
        _executeAction(0x000005, encoded);
    }

    /**
     * @notice Spot send (ID 6).
     * @dev Owner-only. Scales wei to 10^18.
     * @param destination Recipient address.
     * @param token Token ID.
     * @param weiAmount Human-readable wei (scaled 10^18).
     */
    function spotSend(
        address destination,
        uint64 token,
        uint64 weiAmount
    ) external onlyOwner {
        bytes memory encoded = abi.encode(destination, token, weiAmount);
        _executeAction(0x000006, encoded);
    }

    /**
     * @notice USD class transfer (ID 7) - perp ↔ spot USDC.
     * @dev Owner-only. Scales ntl to 10^8.
     * @param ntl Human-readable USD (scaled 10^8).
     * @param toPerp True to send to perp.
     */
    function usdClassTransfer(
        uint64 ntl,  // Scaled 10^8
        bool toPerp
    ) external onlyOwner {
        bytes memory encoded = abi.encode(ntl, toPerp);
        _executeAction(0x000007, encoded);
    }

    /**
     * @notice Finalize EVM contract (ID 8).
     * @dev Owner-only. Scales token to 10^8.
     * @param token Human-readable token (scaled 10^8).
     * @param encodedFinalizeEvmContractVariant Variant (uint8).
     * @param createNonce Nonce.
     */
    function finalizeEvmContract(
        uint64 token,  // Scaled 10^8
        uint8 encodedFinalizeEvmContractVariant,
        uint64 createNonce
    ) external onlyOwner {
        bytes memory encoded = abi.encode(token, encodedFinalizeEvmContractVariant, createNonce);
        _executeAction(0x000008, encoded);
    }

    /**
     * @notice Add API wallet (ID 9).
     * @dev Owner-only.
     * @param apiWallet Wallet address.
     * @param name Wallet name (UTF-8 string).
     */
    function addApiWallet(address apiWallet, string calldata name) external onlyOwner {
        bytes memory encoded = abi.encode(apiWallet, name);
        _executeAction(0x000009, encoded);
    }

    /**
     * @notice Cancel order by OID (ID 10).
     * @dev Owner-only.
     * @param asset Asset ID.
     * @param oid Order ID.
     */
    function cancelOrderByOid(uint32 asset, uint64 oid) external onlyOwner {
        bytes memory encoded = abi.encode(asset, oid);
        _executeAction(0x00000A, encoded);
    }

    /**
     * @notice Cancel order by CLOID (ID 11).
     * @dev Owner-only.
     * @param asset Asset ID.
     * @param cloid Client order ID.
     */
    function cancelOrderByCloid(uint32 asset, uint128 cloid) external onlyOwner {
        bytes memory encoded = abi.encode(asset, cloid);
        _executeAction(0x00000B, encoded);
    }

    /**
     * @notice Approve builder fee (ID 12).
     * @dev Owner-only. maxFeeRate in decibps (e.g., 10 = 0.01%).
     * @param maxFeeRate Max fee rate.
     * @param builder Builder address.
     */
    function approveBuilderFee(uint64 maxFeeRate, address builder) external onlyOwner {
        bytes memory encoded = abi.encode(maxFeeRate, builder);
        _executeAction(0x00000C, encoded);
    }

    /**
     * @notice Send asset (ID 13) - Testnet only.
     * @dev Owner-only. Scales wei to 10^18.
     * @param destination Destination.
     * @param subAccount Subaccount.
     * @param sourceDex Source DEX (uint32::MAX for spot).
     * @param destinationDex Destination DEX.
     * @param token Token ID.
     * @param weiAmount Scaled wei (10^18).
     */
    function sendAssetTestnet(
        address destination,
        address subAccount,
        uint32 sourceDex,
        uint32 destinationDex,
        uint64 token,
        uint64 weiAmount
    ) external onlyOwner {
        bytes memory encoded = abi.encode(destination, subAccount, sourceDex, destinationDex, token, weiAmount);
        _executeAction(0x00000D, encoded);
    }

    /**
     * @notice Reflect EVM supply change (ID 14) - Testnet only.
     * @dev Owner-only. Scales wei to 10^18.
     * @param token Token ID.
     * @param weiAmount Scaled wei (10^18).
     * @param isMint True to mint.
     */
    function reflectEvmSupplyTestnet(
        uint64 token,
        uint64 weiAmount,
        bool isMint
    ) external onlyOwner {
        bytes memory encoded = abi.encode(token, weiAmount, isMint);
        _executeAction(0x00000E, encoded);
    }

    /**
     * @notice Deposit tokens to HyperCore
     * @dev Calculates system address based on token ID and sends tokens there
     * @param tokenContract ERC20 token contract address (or HYPE system address)
     * @param tokenId Token ID on HyperCore (0 for USDC, 135 for HYPE, etc.)
     * @param amount Amount to deposit (in token's native decimals)
     */
    function deposiToCore(address tokenContract, uint64 tokenId, uint64 amount) external payable onlyOwner {
        if (amount == 0) revert InvalidAmount();

        // Calculate system address based on token ID
        // HYPE: 0x2222222222222222222222222222222222222222
        // Others: 0x20 + zeros + tokenId in big-endian
        address systemAddress;
        if (tokenId == 135) {
            // HYPE special case
            systemAddress = 0x2222222222222222222222222222222222222222;
        } else {
            // Standard system address: 0x20 + tokenId in big-endian
            systemAddress = address(uint160(0x2000000000000000000000000000000000000000) | uint160(tokenId));
        }

        // Check if native token (HYPE)
        if (systemAddress == 0x2222222222222222222222222222222222222222) {
            // For native HYPE, msg.value should be sent
            if (msg.value != amount) revert InvalidAmount();
            
            // Send native HYPE to system address to deposit to core
            (bool success, ) = systemAddress.call{value: amount}("");
            if (!success) revert ActionFailed();
        } else {
            // For ERC20 tokens (USDC, etc.)
            // Transfer tokens from user to vault
            IERC20(tokenContract).safeTransferFrom(msg.sender, address(this), amount);
            
            // Send to system address to deposit to core
            IERC20(tokenContract).safeTransfer(systemAddress, amount);
        }

        emit DepositedToCore(msg.sender, tokenContract, amount);
    }

    /**
     * @notice Deposit tokens to HyperCore using vault's own balance (no user transfer).
     * @dev Useful when vault already holds tokens and wants to deposit them to core.
     * @param tokenContract ERC20 token contract address (or HYPE system address)
     * @param tokenId Token ID on HyperCore (0 for USDC, 135 for HYPE, etc.)
     * @param amount Amount to deposit (in token's native decimals)
     */
    function depositVaultBalanceToCore(address tokenContract, uint64 tokenId, uint64 amount) external payable onlyOwner {
        if (amount == 0) revert InvalidAmount();

        // Calculate system address based on token ID
        address systemAddress;
        if (tokenId == 135) {
            systemAddress = 0x2222222222222222222222222222222222222222;
        } else {
            systemAddress = address(uint160(0x2000000000000000000000000000000000000000) | uint160(tokenId));
        }

        // Check if native token (HYPE)
        if (systemAddress == 0x2222222222222222222222222222222222222222) {
            // For native HYPE, msg.value should be sent
            if (msg.value != amount) revert InvalidAmount();
            
            // Send native HYPE to system address to deposit to core
            (bool success, ) = systemAddress.call{value: amount}("");
            if (!success) revert ActionFailed();
        } else {
            // For ERC20 tokens - use vault's own balance
            IERC20(tokenContract).safeTransfer(systemAddress, amount);
        }

        emit DepositedToCore(address(this), tokenContract, amount);
    }

    /**
     * @notice Withdraw tokens from HyperCore spot balance to this vault.
     * @dev Uses spotSend action with system address as destination.
     *      The system will automatically credit tokens to the sender (this vault).
     * @param tokenContract ERC20 token contract address
     * @param tokenId Token ID on HyperCore
     * @param amount Amount to withdraw (in token's native decimals for ERC20, or 18 decimals for native)
     */
    function withdrawFromCore(address tokenContract, uint64 tokenId, uint64 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();

        // Calculate system address based on token ID
        address systemAddress;
        if (tokenId == 135) {
            systemAddress = 0x2222222222222222222222222222222222222222;
        } else {
            systemAddress = address(uint160(0x2000000000000000000000000000000000000000) | uint160(tokenId));
        }

        bytes memory encoded = abi.encode(systemAddress, tokenId, amount);
        _executeAction(0x000006, encoded);

        emit WithdrawnFromCore(address(this), tokenContract, amount);
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // RECEIVE FUNCTION (Accept native HYPE)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Receive function to accept native HYPE transfers.
     * @dev Allows the vault to receive HYPE from external sources.
     */
    receive() external payable {
        // Accept HYPE - no action needed, just log
        emit DepositedToCore(msg.sender, address(0), msg.value);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Internal executor for CoreWriter actions.
     * @dev Encodes version (0x01) + 3-byte ID + fields.
     * @param actionId 3-byte action ID (e.g., 0x000001).
     * @param encoded ABI-encoded action fields.
     */
    function _executeAction(uint24 actionId, bytes memory encoded) internal {
        bytes memory data = new bytes(4 + encoded.length);
        data[0] = 0x01; // Version
        data[1] = bytes1(uint8(actionId >> 16)); // ID byte 1
        data[2] = bytes1(uint8(actionId >> 8));  // ID byte 2
        data[3] = bytes1(uint8(actionId));       // ID byte 3

        for (uint256 i = 0; i < encoded.length; i++) {
            data[4 + i] = encoded[i];
        }

        (bool success, ) = CORE_WRITER.call(abi.encodeWithSignature("sendRawAction(bytes)", data));
        if (!success) revert ActionFailed();

        emit ActionExecuted(actionId, data);
    }

    /**
     * @notice Withdraw all balances of specified tokens from vault to owner.
     * @dev Owner-only emergency function to recover tokens.
     * @param tokens Array of token addresses to withdraw (use HYPE system address for native HYPE).
     */
    function withdrawAllTokens(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            
            if (token == address(0x2222222222222222222222222222222222222222)) {
                // Native HYPE - send via transfer
                uint256 balance = address(this).balance;
                if (balance > 0) {
                    payable(msg.sender).transfer(balance);
                }
            } else {
                // ERC20 token
                uint256 balance = IERC20(token).balanceOf(address(this));
                if (balance > 0) {
                    IERC20(token).safeTransfer(msg.sender, balance);
                }
            }
        }
    }
}