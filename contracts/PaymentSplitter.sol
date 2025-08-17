// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CreatorRegistry.sol";
import "./LicensingTerms.sol";

/**
 * @title PaymentSplitter
 * @dev Contract for handling automated royalty distribution for AI usage licensing
 * Part of the CreatorClaim Protocol on BaseCAMP
 */
contract PaymentSplitter is Ownable, ReentrancyGuard {
    // Payment ID counter
    uint256 private _paymentIds;
    
    // Reference to CreatorRegistry contract
    CreatorRegistry public creatorRegistry;
    
    // Reference to LicensingTerms contract
    LicensingTerms public licensingTerms;
    
    // Protocol fee percentage (in basis points, e.g. 500 = 5%)
    uint256 public protocolFeeRate;
    
    // Max protocol fee rate (10%)
    uint256 public constant MAX_PROTOCOL_FEE = 1000;
    
    // Payment structure
    struct Payment {
        uint256 id;
        address payer;
        uint256[] contentIds;
        uint256[] contentAmounts;
        uint256 totalAmount;
        uint256 protocolFee;
        uint256 timestamp;
        string notes;
        bool processed;
    }
    
    // Map payment ID to Payment
    mapping(uint256 => Payment) private _idToPayment;
    
    // Map address to earned amounts available for withdrawal
    mapping(address => uint256) private _creatorEarnings;
    
    // Map address to payment IDs (for both payers and creators)
    mapping(address => uint256[]) private _addressToPaymentIds;
    
    // Events
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed payer,
        uint256[] contentIds,
        uint256 totalAmount
    );
    
    event PaymentProcessed(
        uint256 indexed paymentId,
        address indexed payer,
        uint256 protocolFee
    );
    
    event CreatorPaid(
        address indexed creator,
        uint256 indexed paymentId,
        uint256 amount
    );
    
    event CreatorWithdrawal(
        address indexed creator,
        uint256 amount
    );
    
    event ProtocolFeeWithdrawn(
        address indexed receiver,
        uint256 amount
    );
    
    event ProtocolFeeRateUpdated(
        uint256 oldRate,
        uint256 newRate
    );
    
    /**
     * @dev Constructor
     * @param _creatorRegistry Address of the CreatorRegistry contract
     * @param _licensingTerms Address of the LicensingTerms contract
     * @param _initialProtocolFee Initial protocol fee in basis points (e.g., 500 = 5%)
     * @param initialOwner The address that will own the contract
     */
    constructor(
        address _creatorRegistry,
        address _licensingTerms,
        uint256 _initialProtocolFee,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_creatorRegistry != address(0), "Invalid CreatorRegistry address");
        require(_licensingTerms != address(0), "Invalid LicensingTerms address");
        require(_initialProtocolFee <= MAX_PROTOCOL_FEE, "Protocol fee exceeds maximum");
        
        creatorRegistry = CreatorRegistry(_creatorRegistry);
        licensingTerms = LicensingTerms(_licensingTerms);
        protocolFeeRate = _initialProtocolFee;
    }
    
    /**
     * @dev Process a payment for using creator content
     * @param contentIds Array of content IDs being licensed
     * @param contentAmounts Array of payment amounts for each content ID
     * @param notes Description of the content usage
     */
    function processPayment(
        uint256[] calldata contentIds,
        uint256[] calldata contentAmounts,
        string calldata notes
    ) external payable nonReentrant returns (uint256) {
        // Validate parameters
        require(contentIds.length > 0, "No content IDs provided");
        require(contentIds.length == contentAmounts.length, "Array length mismatch");
        
        // Calculate total amount
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < contentAmounts.length; i++) {
            totalAmount += contentAmounts[i];
        }
        
        // Verify sent amount matches total
        require(msg.value == totalAmount, "Incorrect payment amount");
        
        // Increment counter and get new ID
        _paymentIds += 1;
        uint256 newPaymentId = _paymentIds;
        
        // Calculate protocol fee (e.g., 5% of total)
        uint256 protocolFee = (totalAmount * protocolFeeRate) / 10000;
        
        // Create new payment
        Payment memory newPayment = Payment({
            id: newPaymentId,
            payer: msg.sender,
            contentIds: contentIds,
            contentAmounts: contentAmounts,
            totalAmount: totalAmount,
            protocolFee: protocolFee,
            timestamp: block.timestamp,
            notes: notes,
            processed: false
        });
        
        // Store payment
        _idToPayment[newPaymentId] = newPayment;
        _addressToPaymentIds[msg.sender].push(newPaymentId);
        
        // Emit payment created event
        emit PaymentCreated(
            newPaymentId,
            msg.sender,
            contentIds,
            totalAmount
        );
        
        // Process payment immediately
        _processPayment(newPaymentId);
        
        return newPaymentId;
    }
    
    /**
     * @dev Create and process a payment for using creator content
     * @param contentIds Array of content IDs being licensed
     * @param contentAmounts Array of payment amounts for each content ID
     * @param notes Description of the content usage
     */
    function createPayment(
        uint256[] calldata contentIds,
        uint256[] calldata contentAmounts,
        string calldata notes
    ) external payable nonReentrant returns (uint256) {
        // Validate parameters
        require(contentIds.length > 0, "No content IDs provided");
        require(contentIds.length == contentAmounts.length, "Array lengths mismatch");
        
        // Calculate total amount
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < contentAmounts.length; i++) {
            totalAmount += contentAmounts[i];
        }
        
        // Verify payment amount
        require(msg.value == totalAmount, "Payment amount mismatch");
        
        // Calculate protocol fee
        uint256 protocolFee = (totalAmount * protocolFeeRate) / 10000;
        
        // Increment counter and get new payment ID
        _paymentIds += 1;
        uint256 newPaymentId = _paymentIds;
        
        // Create new payment record
        Payment memory newPayment = Payment({
            id: newPaymentId,
            payer: msg.sender,
            contentIds: contentIds,
            contentAmounts: contentAmounts,
            totalAmount: totalAmount,
            protocolFee: protocolFee,
            timestamp: block.timestamp,
            notes: notes,
            processed: false
        });
        
        // Store payment
        _idToPayment[newPaymentId] = newPayment;
        _addressToPaymentIds[msg.sender].push(newPaymentId);
        
        // Emit payment created event
        emit PaymentCreated(
            newPaymentId,
            msg.sender,
            contentIds,
            totalAmount
        );
        
        // Process payment immediately
        _processPayment(newPaymentId);
        
        return newPaymentId;
    }
    
    /**
     * @dev Process payment and distribute funds to creators
     * @param paymentId ID of the payment to process
     */
    function _processPayment(uint256 paymentId) internal {
        // Get payment
        Payment storage payment = _idToPayment[paymentId];
        
        // Validate payment
        require(!payment.processed, "Payment already processed");
        
        // Mark as processed
        payment.processed = true;
        
        // Distribute funds to creators
        for (uint256 i = 0; i < payment.contentIds.length; i++) {
            uint256 contentId = payment.contentIds[i];
            uint256 amount = payment.contentAmounts[i];
            
            // Get content creator
            CreatorRegistry.Content memory content = creatorRegistry.getContentById(contentId);
            address creator = content.creator;
            
            // Calculate creator's share after protocol fee
            uint256 protocolFeeShare = (amount * protocolFeeRate) / 10000;
            uint256 creatorShare = amount - protocolFeeShare;
            
            // Add to creator earnings
            _creatorEarnings[creator] += creatorShare;
            
            // Add payment ID to creator's payment IDs
            _addressToPaymentIds[creator].push(paymentId);
            
            // Emit creator paid event
            emit CreatorPaid(creator, paymentId, creatorShare);
        }
        
        // Emit payment processed event
        emit PaymentProcessed(paymentId, payment.payer, payment.protocolFee);
    }
    
    /**
     * @dev Allow creator to withdraw their earned funds
     */
    function withdrawCreatorEarnings() external nonReentrant {
        uint256 amount = _creatorEarnings[msg.sender];
        
        // Validate amount
        require(amount > 0, "No earnings to withdraw");
        
        // Reset earnings
        _creatorEarnings[msg.sender] = 0;
        
        // Transfer funds to creator
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        // Emit withdrawal event
        emit CreatorWithdrawal(msg.sender, amount);
    }
    
    /**
     * @dev Allow owner to withdraw protocol fees
     */
    function withdrawProtocolFees() external onlyOwner nonReentrant {
        // Calculate protocol fees
        uint256 contractBalance = address(this).balance;
        uint256 creatorEarningsTotal = 0;
        
        // Sum up all creator earnings
        for (uint i = 1; i <= _paymentIds; i++) {
            Payment storage payment = _idToPayment[i];
            if (payment.processed) {
                for (uint j = 0; j < payment.contentIds.length; j++) {
                    creatorEarningsTotal += payment.contentAmounts[j] - ((payment.contentAmounts[j] * protocolFeeRate) / 10000);
                }
            }
        }
        
        // Calculate protocol fees
        uint256 protocolFees = contractBalance - creatorEarningsTotal;
        require(protocolFees > 0, "No protocol fees to withdraw");
        
        // Transfer protocol fees to owner
        (bool success, ) = payable(owner()).call{value: protocolFees}("");
        require(success, "Transfer failed");
        
        // Emit withdrawal event
        emit ProtocolFeeWithdrawn(owner(), protocolFees);
    }
    
    /**
     * @dev Update protocol fee rate
     * @param newProtocolFeeRate New protocol fee rate in basis points
     */
    function updateProtocolFeeRate(uint256 newProtocolFeeRate) external onlyOwner {
        require(newProtocolFeeRate <= MAX_PROTOCOL_FEE, "Protocol fee exceeds maximum");
        
        uint256 oldRate = protocolFeeRate;
        protocolFeeRate = newProtocolFeeRate;
        
        // Emit protocol fee updated event
        emit ProtocolFeeRateUpdated(oldRate, newProtocolFeeRate);
    }
    
    /**
     * @dev Get payment by ID
     * @param paymentId ID of the payment to retrieve
     * @return Payment details
     */
    function getPaymentById(uint256 paymentId) external view returns (Payment memory) {
        require(_idToPayment[paymentId].id == paymentId, "Payment does not exist");
        return _idToPayment[paymentId];
    }
    
    /**
     * @dev Get all payment IDs for an address (as payer or creator)
     * @param userAddress Address to get payment IDs for
     * @return Array of payment IDs
     */
    function getUserPaymentIds(address userAddress) external view returns (uint256[] memory) {
        return _addressToPaymentIds[userAddress];
    }
    
    /**
     * @dev Get creator's available earnings
     * @param creator Address of the creator
     * @return Available earnings amount
     */
    function getCreatorEarnings(address creator) external view returns (uint256) {
        return _creatorEarnings[creator];
    }
    
    /**
     * @dev Get total number of payments
     * @return Total count of payments
     */
    function getTotalPayments() external view returns (uint256) {
        return _paymentIds;
    }
    
    /**
     * @dev Get contract balance
     * @return Contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get total protocol fees available for withdrawal
     * @return Total protocol fees
     */
    function totalProtocolFees() external view returns (uint256) {
        // Calculate protocol fees as difference between contract balance and creator earnings
        uint256 contractBalance = address(this).balance;
        uint256 creatorEarningsTotal = 0;
        
        // Sum up all creator earnings
        for (uint i = 1; i <= _paymentIds; i++) {
            Payment storage payment = _idToPayment[i];
            if (payment.processed) {
                for (uint j = 0; j < payment.contentIds.length; j++) {
                    creatorEarningsTotal += payment.contentAmounts[j] - ((payment.contentAmounts[j] * protocolFeeRate) / 10000);
                }
            }
        }
        
        // Protocol fees are what's left after creator earnings
        if (contractBalance > creatorEarningsTotal) {
            return contractBalance - creatorEarningsTotal;
        } else {
            return 0; // Avoid underflow
        }
    }
}
