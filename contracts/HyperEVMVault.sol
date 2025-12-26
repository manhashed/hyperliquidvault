// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";


/**
 * @notice Wrapper contract for ERC4626 vault on Felix.
 *         Users deposit/withdraw USDC, which is then deposited/withdrawn from the underlying ERC4626 vault.
 *         Tracks user shares and calculates yield based on total assets.
 * @dev Deploy on HyperEVM. The underlying ERC4626 vault is at 0x8A862fD6c12f9ad34C9c2ff45AB2b6712e8CEa27.
 *      This contract maintains a 1:1 mapping between user deposits and vault shares.
 */
contract HyperEVMVault is Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    // Constants
    address public constant FELIX_VAULT = 0x8A862fD6c12f9ad34C9c2ff45AB2b6712e8CEa27;

    // State variables
    IERC20 public USDC; // USDC token (6 decimals)
    IERC4626 public felixVault; // ERC4626 vault on Felix

    // User tracking
    mapping(address => uint256) public userShares; // User's share balance in this vault
    mapping(address => uint256) public userDeposits; // Total USDC deposited by user (for yield calculation)
    uint256 public totalShares; // Total shares issued by this vault
    uint256 public totalDeposits; // Total USDC deposited by all users (for yield calculation)

    // Events
    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event YieldAccrued(address indexed user, uint256 yieldAmount);

    // Errors
    error InvalidAmount();
    error InsufficientBalance();
    error VaultDepositFailed();
    error VaultWithdrawFailed();
    error ZeroAddress();

    /**
     * @notice Initialize the upgradeable contract
     * @param usdcAddress Address of USDC token
     * @param owner Address of the contract owner
     */
    function initialize(address usdcAddress, address owner) public initializer {
        if (usdcAddress == address(0) || owner == address(0)) revert ZeroAddress();
        
        __Ownable_init(owner);
        USDC = IERC20(usdcAddress);
        felixVault = IERC4626(FELIX_VAULT);
        
        // // Approve Felix vault to spend USDC
        // USDC.safeIncreaseAllowance(FELIX_VAULT, type(uint256).max);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DEPOSIT / WITHDRAW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Deposit USDC into the vault.
     * @dev Transfers USDC from user, deposits to Felix vault, and issues shares.
     * @param amount USDC amount in native decimals (6 decimals, e.g., 1000000 = 1 USDC).
     * @return shares Number of shares minted to the user.
     */
    function deposit(uint256 amount) external returns (uint256 shares) {
        if (amount == 0) revert InvalidAmount();

        // Transfer USDC from user to this vault
        USDC.safeTransferFrom(msg.sender, address(this), amount);

        // Increase USDC allowance for felix
        USDC.safeIncreaseAllowance(FELIX_VAULT, amount);

        // Deposit to Felix vault
        uint256 felixShares = felixVault.deposit(amount, address(this));
        if (felixShares == 0) revert VaultDepositFailed();

        // Calculate shares to issue to user (1:1 with Felix shares for simplicity)
        // In a more complex implementation, you might want to track this differently
        shares = felixShares;

        // Update user tracking
        userShares[msg.sender] += shares;
        userDeposits[msg.sender] += amount;
        totalShares += shares;
        totalDeposits += amount;

        emit Deposited(msg.sender, amount, shares);
    }

    /**
     * @notice Withdraw USDC from the vault.
     * @dev Redeems shares from Felix vault and transfers USDC to user.
     * @param shares Number of shares to redeem.
     * @return assets Amount of USDC withdrawn.
     */
    function withdraw(uint256 shares) external returns (uint256 assets) {
        if (shares == 0) revert InvalidAmount();
        if (userShares[msg.sender] < shares) revert InsufficientBalance();

        // Store user's current share balance before reduction
        uint256 userShareBalance = userShares[msg.sender];

        // Calculate assets to withdraw based on current vault value
        assets = felixVault.previewRedeem(shares);

        // Increase vault token allowance for felix
        IERC20(FELIX_VAULT).safeIncreaseAllowance(address(FELIX_VAULT), shares);

        // Redeem from Felix vault
        uint256 assetsReceived = felixVault.redeem(shares, address(this), address(this));
        if (assetsReceived == 0) revert VaultWithdrawFailed();

        // Update user tracking
        userShares[msg.sender] -= shares;
        totalShares -= shares;
        
        // Calculate proportional deposit reduction for yield tracking
        // Use original share balance before reduction
        if (userShareBalance > 0) {
            uint256 depositReduction = (userDeposits[msg.sender] * shares) / userShareBalance;
            userDeposits[msg.sender] -= depositReduction;
            totalDeposits -= depositReduction;
        }

        // Transfer USDC to user
        USDC.safeTransfer(msg.sender, assetsReceived);

        emit Withdrawn(msg.sender, assetsReceived, shares);
        return assetsReceived;
    }

    /**
     * @notice Withdraw USDC by specifying asset amount.
     * @dev Redeems shares equivalent to the asset amount and transfers USDC to user.
     * @param assets Amount of USDC to withdraw.
     * @return shares Number of shares redeemed.
     */
    function withdrawAssets(uint256 assets) external returns (uint256 shares) {
        if (assets == 0) revert InvalidAmount();

        // Calculate shares needed
        shares = felixVault.previewWithdraw(assets);
        
        if (userShares[msg.sender] < shares) revert InsufficientBalance();

        // Store user's current share balance before reduction
        uint256 userShareBalance = userShares[msg.sender];

        // Redeem from Felix vault
        uint256 sharesRedeemed = felixVault.withdraw(assets, address(this), address(this));
        if (sharesRedeemed == 0) revert VaultWithdrawFailed();

        // Update user tracking
        userShares[msg.sender] -= sharesRedeemed;
        totalShares -= sharesRedeemed;
        
        // Calculate proportional deposit reduction for yield tracking
        // Use original share balance before reduction
        if (userShareBalance > 0) {
            uint256 depositReduction = (userDeposits[msg.sender] * sharesRedeemed) / userShareBalance;
            userDeposits[msg.sender] -= depositReduction;
            totalDeposits -= depositReduction;
        }

        // Transfer USDC to user
        USDC.safeTransfer(msg.sender, assets);

        emit Withdrawn(msg.sender, assets, sharesRedeemed);
        return sharesRedeemed;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - User Share & Yield Calculation
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get user's current share of total assets.
     * @param user Address of the user.
     * @return userAssets User's share of total assets in USDC.
     */
    function getUserAssets(address user) external view returns (uint256 userAssets) {
        if (totalShares == 0) return 0;
        
        // Get total assets from Felix vault based on vault's share balance
        uint256 totalVaultAssets = felixVault.convertToAssets(felixVault.balanceOf(address(this)));
        
        // Calculate user's proportional share
        userAssets = (totalVaultAssets * userShares[user]) / totalShares;
    }

    /**
     * @notice Get user's yield (current value - original deposit).
     * @param user Address of the user.
     * @return yieldAmount Yield earned by the user in USDC.
     */
    function getUserYield(address user) external view returns (uint256 yieldAmount) {
        uint256 userAssets = this.getUserAssets(user);
        uint256 userDeposit = userDeposits[user];
        
        if (userAssets > userDeposit) {
            yieldAmount = userAssets - userDeposit;
        } else {
            yieldAmount = 0;
        }
    }

    /**
     * @notice Get user's yield percentage (APY equivalent).
     * @param user Address of the user.
     * @return yieldPercent Yield as a percentage (scaled by 1e18, e.g., 5% = 5e16).
     */
    function getUserYieldPercent(address user) external view returns (uint256 yieldPercent) {
        uint256 userDeposit = userDeposits[user];
        if (userDeposit == 0) return 0;
        
        uint256 yieldAmount = this.getUserYield(user);
        yieldPercent = (yieldAmount * 1e18) / userDeposit;
    }

    /**
     * @notice Get user's share balance.
     * @param user Address of the user.
     * @return shares Number of shares owned by the user.
     */
    function getUserShares(address user) external view returns (uint256 shares) {
        return userShares[user];
    }

    /**
     * @notice Get total yield earned by all users.
     * @return totalYield Total yield in USDC.
     */
    function getTotalYield() external view returns (uint256 totalYield) {
        uint256 totalVaultAssets = felixVault.convertToAssets(felixVault.balanceOf(address(this)));
        if (totalVaultAssets > totalDeposits) {
            totalYield = totalVaultAssets - totalDeposits;
        } else {
            totalYield = 0;
        }
    }

    /**
     * @notice Get current price per share (assets per share).
     * @return pricePerShare Price per share (scaled by 1e18).
     */
    function getPricePerShare() external view returns (uint256 pricePerShare) {
        if (totalShares == 0) return 1e18; // Default to 1:1 if no shares
        
        uint256 totalVaultAssets = felixVault.convertToAssets(felixVault.balanceOf(address(this)));
        pricePerShare = (totalVaultAssets * 1e18) / totalShares;
    }

    /**
     * @notice Get user's original deposit amount.
     * @param user Address of the user.
     * @return depositAmount Original USDC deposit amount.
     */
    function getUserDeposit(address user) external view returns (uint256 depositAmount) {
        return userDeposits[user];
    }

    /**
     * @notice Get total deposits made by all users.
     * @return totalDepositsAmount Total USDC deposited.
     */
    function getTotalDeposits() external view returns (uint256 totalDepositsAmount) {
        return totalDeposits;
    }

    /**
     * @notice Get this contract's share balance in the Felix vault.
     * @return vaultShares Number of shares this contract holds in Felix vault.
     */
    function getVaultShares() external view returns (uint256 vaultShares) {
        return felixVault.balanceOf(address(this));
    }

    /**
     * @notice Verify that internal tracking matches Felix vault state.
     * @return isSynced True if totalShares matches Felix vault shares.
     * @return internalShares Internal totalShares tracking.
     * @return vaultShares Actual shares in Felix vault.
     */
    function verifyState() external view returns (bool isSynced, uint256 internalShares, uint256 vaultShares) {
        internalShares = totalShares;
        vaultShares = felixVault.balanceOf(address(this));
        isSynced = (internalShares == vaultShares);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WRAPPED ERC4626 FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get total assets for this vault based on vault's share balance.
     * @return totalManagedAssets Total assets in USDC corresponding to vault's shares.
     */
    function totalAssets() external view returns (uint256 totalManagedAssets) {
        return felixVault.convertToAssets(felixVault.balanceOf(address(this)));
    }

    /**
     * @notice Convert assets to shares for the underlying vault.
     * @param assets Amount of assets.
     * @return shares Equivalent shares.
     */
    function convertToShares(uint256 assets) external view returns (uint256 shares) {
        return felixVault.convertToShares(assets);
    }

    /**
     * @notice Convert shares to assets for the underlying vault.
     * @param shares Amount of shares.
     * @return assets Equivalent assets.
     */
    function convertToAssets(uint256 shares) external view returns (uint256 assets) {
        return felixVault.convertToAssets(shares);
    }

    /**
     * @notice Get maximum deposit amount for the underlying vault.
     * @param receiver Address of the receiver.
     * @return maxAssets Maximum assets that can be deposited.
     */
    function maxDeposit(address receiver) external view returns (uint256 maxAssets) {
        return felixVault.maxDeposit(receiver);
    }

    /**
     * @notice Preview deposit to see shares that would be minted.
     * @param assets Amount of assets to deposit.
     * @return shares Shares that would be minted.
     */
    function previewDeposit(uint256 assets) external view returns (uint256 shares) {
        return felixVault.previewDeposit(assets);
    }

    /**
     * @notice Get maximum mint amount for the underlying vault.
     * @param receiver Address of the receiver.
     * @return maxShares Maximum shares that can be minted.
     */
    function maxMint(address receiver) external view returns (uint256 maxShares) {
        return felixVault.maxMint(receiver);
    }

    /**
     * @notice Preview mint to see assets that would be deposited.
     * @param shares Amount of shares to mint.
     * @return assets Assets that would be deposited.
     */
    function previewMint(uint256 shares) external view returns (uint256 assets) {
        return felixVault.previewMint(shares);
    }

    /**
     * @notice Get maximum withdraw amount for the underlying vault.
     * @param owner Address of the owner.
     * @return maxAssets Maximum assets that can be withdrawn.
     */
    function maxWithdraw(address owner) external view returns (uint256 maxAssets) {
        return felixVault.maxWithdraw(owner);
    }

    /**
     * @notice Preview withdraw to see shares that would be burned.
     * @param assets Amount of assets to withdraw.
     * @return shares Shares that would be burned.
     */
    function previewWithdraw(uint256 assets) external view returns (uint256 shares) {
        return felixVault.previewWithdraw(assets);
    }

    /**
     * @notice Get maximum redeem amount for the underlying vault.
     * @param owner Address of the owner.
     * @return maxShares Maximum shares that can be redeemed.
     */
    function maxRedeem(address owner) external view returns (uint256 maxShares) {
        return felixVault.maxRedeem(owner);
    }

    /**
     * @notice Preview redeem to see assets that would be withdrawn.
     * @param shares Amount of shares to redeem.
     * @return assets Assets that would be withdrawn.
     */
    function previewRedeem(uint256 shares) external view returns (uint256 assets) {
        return felixVault.previewRedeem(shares);
    }

    /**
     * @notice Get the underlying asset address.
     * @return assetTokenAddress Address of the underlying asset (USDC).
     */
    function asset() external view returns (address assetTokenAddress) {
        return felixVault.asset();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update USDC address (owner only).
     * @param usdcAddress New USDC address.
     */
    function setUSDC(address usdcAddress) external onlyOwner {
        if (usdcAddress == address(0)) revert ZeroAddress();
        
        // Revoke old approval
        USDC.safeIncreaseAllowance(FELIX_VAULT, 0);
        
        USDC = IERC20(usdcAddress);
        
        // Approve new USDC
        USDC.safeIncreaseAllowance(FELIX_VAULT, type(uint256).max);
    }

    /**
     * @notice Emergency function to withdraw all tokens (owner only).
     * @param tokens Array of token addresses to withdraw.
     */
    function withdrawAllTokens(address[] calldata tokens) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 balance = IERC20(token).balanceOf(address(this));
            if (balance > 0) {
                IERC20(token).safeTransfer(msg.sender, balance);
            }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECEIVE FUNCTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Receive function to handle accidental native token transfers.
     * @dev Reverts to prevent accidental native token deposits.
     */
    receive() external payable {
        revert("HyperEVMVault: Native tokens not accepted");
    }
}

