// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CreatorRegistry.sol";

/**
 * @title LicensingTerms
 * @dev Contract for managing AI usage licensing terms for creator content
 * Part of the CreatorClaim Protocol on BaseCAMP
 */
contract LicensingTerms is Ownable {
    // Licensing terms counter
    uint256 private _termsIds;
    
    // Reference to CreatorRegistry contract
    CreatorRegistry public creatorRegistry;
    
    // Licensing status options
    enum LicensingStatus {
        DENY,       // No licensing allowed
        ALLOW_FREE, // Free use allowed with attribution
        PAID        // Paid licensing required
    }
    
    // AI usage type categories
    enum AIUsageType {
        TRAINING,   // Use in AI model training
        FINE_TUNING, // Use in AI model fine-tuning
        INFERENCE,  // Use in AI inference/generation
        ALL         // All types of AI usage
    }
    
    // Licensing terms structure
    struct Terms {
        uint256 id;
        address creator;
        LicensingStatus status;
        uint256 price;         // Price in wei per usage unit
        uint256 usageUnit;     // e.g., 1000 tokens, defined off-chain
        uint256[] contentIds;  // Content IDs associated with these terms
        AIUsageType[] allowedUsageTypes;
        bool requireAttribution;
        string customTermsURI; // URI to additional custom terms (IPFS)
        uint256 creationTime;
        bool active;
    }
    
    // Map terms ID to Terms
    mapping(uint256 => Terms) private _idToTerms;
    
    // Map creator address to their terms IDs
    mapping(address => uint256[]) private _creatorToTermsIds;
    
    // Events
    event TermsCreated(
        uint256 indexed termsId,
        address indexed creator,
        LicensingStatus status,
        uint256 price
    );
    
    event TermsUpdated(
        uint256 indexed termsId,
        address indexed creator,
        LicensingStatus status,
        uint256 price
    );
    
    event TermsDeactivated(
        uint256 indexed termsId,
        address indexed creator
    );
    
    event ContentAddedToTerms(
        uint256 indexed termsId,
        uint256 indexed contentId
    );
    
    event ContentRemovedFromTerms(
        uint256 indexed termsId,
        uint256 indexed contentId
    );
    
    /**
     * @dev Constructor
     * @param _creatorRegistry Address of the CreatorRegistry contract
     * @param initialOwner The address that will own the contract
     */
    constructor(address _creatorRegistry, address initialOwner) Ownable(initialOwner) {
        require(_creatorRegistry != address(0), "Invalid CreatorRegistry address");
        creatorRegistry = CreatorRegistry(_creatorRegistry);
    }
    
    /**
     * @dev Create new licensing terms for content
     * @param contentId ID of the content to create terms for
     * @param status Licensing status (DENY, ALLOW_FREE, PAID)
     * @param price Price in wei per usage unit (only relevant if status is PAID)
     * @param requireAttribution Whether attribution is required
     * @param allowedUsageTypes Array of allowed AI usage types
     * @param customTermsURI URI to additional custom terms
     * @return termsId ID of the created terms
     */
    function createTerms(
        uint256 contentId,
        LicensingStatus status,
        uint256 price,
        bool requireAttribution,
        AIUsageType[] calldata allowedUsageTypes,
        string calldata customTermsURI
    ) external returns (uint256) {
        // Verify content exists and caller is the creator
        CreatorRegistry.Content memory content = creatorRegistry.getContentById(contentId);
        require(content.id == contentId, "Content does not exist");
        require(content.creator == msg.sender, "Only content creator can create terms");
        
        // Validate parameters
        if (status == LicensingStatus.PAID) {
            require(price > 0, "Price must be greater than 0 for PAID status");
        }
        require(allowedUsageTypes.length > 0, "Must specify at least one usage type");
        
        // Increment counter and get new ID
        _termsIds += 1;
        uint256 newTermsId = _termsIds;
        
        // Create content IDs array with the provided contentId
        uint256[] memory contentIds = new uint256[](1);
        contentIds[0] = contentId;
        
        // Create new terms
        Terms memory newTerms = Terms({
            id: newTermsId,
            creator: msg.sender,
            status: status,
            price: price,
            usageUnit: 1000, // Default usage unit
            contentIds: contentIds,
            allowedUsageTypes: allowedUsageTypes,
            requireAttribution: requireAttribution,
            customTermsURI: customTermsURI,
            creationTime: block.timestamp,
            active: true
        });
        
        // Store terms
        _idToTerms[newTermsId] = newTerms;
        _creatorToTermsIds[msg.sender].push(newTermsId);
        
        // Link content to terms
        creatorRegistry.setContentLicensingTerms(contentId, newTermsId);
        
        // Emit terms created event
        emit TermsCreated(
            newTermsId,
            msg.sender,
            status,
            price
        );
        
        return newTermsId;
    }
    
    /**
     * @dev Update existing licensing terms
     * @param termsId ID of the terms to update
     * @param status New licensing status
     * @param price New price in wei per usage unit
     * @param usageUnit New definition of usage unit
     * @param allowedUsageTypes New array of allowed AI usage types
     * @param requireAttribution Whether attribution is required
     * @param customTermsURI New URI to additional custom terms
     */
    function updateTerms(
        uint256 termsId,
        LicensingStatus status,
        uint256 price,
        uint256 usageUnit,
        AIUsageType[] calldata allowedUsageTypes,
        bool requireAttribution,
        string calldata customTermsURI
    ) external {
        // Validate parameters
        if (status == LicensingStatus.PAID) {
            require(price > 0, "Price must be greater than 0 for PAID status");
            require(usageUnit > 0, "Usage unit must be greater than 0");
        }
        require(allowedUsageTypes.length > 0, "Must specify at least one usage type");
        
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.creator == msg.sender, "Not terms creator");
        require(terms.active, "Terms not active");
        
        // Update terms
        terms.status = status;
        terms.price = price;
        terms.usageUnit = usageUnit;
        terms.allowedUsageTypes = allowedUsageTypes;
        terms.requireAttribution = requireAttribution;
        terms.customTermsURI = customTermsURI;
        
        // Emit terms updated event
        emit TermsUpdated(
            termsId,
            msg.sender,
            status,
            price
        );
    }
    
    /**
     * @dev Deactivate licensing terms
     * @param termsId ID of the terms to deactivate
     */
    function deactivateTerms(uint256 termsId) external {
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.creator == msg.sender, "Not terms creator");
        require(terms.active, "Terms already inactive");
        
        // Deactivate terms
        terms.active = false;
        
        // Emit deactivation event
        emit TermsDeactivated(termsId, msg.sender);
    }
    
    /**
     * @dev Add content to licensing terms
     * @param termsId ID of the terms
     * @param contentId ID of the content to add
     */
    function addContentToTerms(uint256 termsId, uint256 contentId) external {
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.creator == msg.sender, "Not terms creator");
        require(terms.active, "Terms not active");
        
        // Verify content ownership
        require(creatorRegistry.verifyContentOwnership(contentId, msg.sender), "Not content owner");
        
        // Check if content already associated with terms
        for (uint i = 0; i < terms.contentIds.length; i++) {
            if (terms.contentIds[i] == contentId) {
                revert("Content already associated with terms");
            }
        }
        
        // Add content ID to terms
        terms.contentIds.push(contentId);
        
        // Update content in registry to point to these terms
        creatorRegistry.setContentLicensingTerms(contentId, termsId);
        
        // Emit content added event
        emit ContentAddedToTerms(termsId, contentId);
    }
    
    /**
     * @dev Remove content from licensing terms
     * @param termsId ID of the terms
     * @param contentId ID of the content to remove
     */
    function removeContentFromTerms(uint256 termsId, uint256 contentId) external {
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.creator == msg.sender, "Not terms creator");
        
        // Find and remove content ID from terms
        bool found = false;
        uint256[] memory newContentIds = new uint256[](terms.contentIds.length - 1);
        uint256 newIndex = 0;
        
        for (uint i = 0; i < terms.contentIds.length; i++) {
            if (terms.contentIds[i] == contentId) {
                found = true;
                continue;
            }
            
            if (newIndex < newContentIds.length) {
                newContentIds[newIndex] = terms.contentIds[i];
                newIndex++;
            }
        }
        
        require(found, "Content not associated with terms");
        
        // Update content IDs array
        terms.contentIds = newContentIds;
        
        // Reset content's terms ID in registry
        creatorRegistry.setContentLicensingTerms(contentId, 0);
        
        // Emit content removed event
        emit ContentRemovedFromTerms(termsId, contentId);
    }
    
    /**
     * @dev Get terms by ID
     * @param termsId ID of the terms to retrieve
     * @return Terms details
     */
    function getTermsById(uint256 termsId) external view returns (Terms memory) {
        require(_idToTerms[termsId].id == termsId, "Terms do not exist");
        return _idToTerms[termsId];
    }
    
    /**
     * @dev Get all terms IDs created by a creator
     * @param creator Address of the creator
     * @return Array of terms IDs
     */
    function getCreatorTermsIds(address creator) external view returns (uint256[] memory) {
        return _creatorToTermsIds[creator];
    }
    
    /**
     * @dev Check if content is licensed for specific AI usage
     * @param contentId Content ID to check
     * @param usageType Type of AI usage to check
     * @return status Licensing status for the content
     * @return price Price for the content (0 if free or denied)
     * @return requireAttribution Whether attribution is required
     */
    function checkContentLicensing(
        uint256 contentId,
        AIUsageType usageType
    ) external view returns (
        LicensingStatus status,
        uint256 price,
        bool requireAttribution
    ) {
        // Get content from registry
        CreatorRegistry.Content memory content = creatorRegistry.getContentById(contentId);
        
        // If no licensing terms set, default to DENY
        if (content.licensingTermsId == 0) {
            return (LicensingStatus.DENY, 0, false);
        }
        
        // Get terms
        Terms memory terms = _idToTerms[content.licensingTermsId];
        
        // If terms not active, default to DENY
        if (!terms.active) {
            return (LicensingStatus.DENY, 0, false);
        }
        
        // Check if usage type is allowed
        bool usageAllowed = false;
        for (uint i = 0; i < terms.allowedUsageTypes.length; i++) {
            if (terms.allowedUsageTypes[i] == usageType || terms.allowedUsageTypes[i] == AIUsageType.ALL) {
                usageAllowed = true;
                break;
            }
        }
        
        if (!usageAllowed) {
            return (LicensingStatus.DENY, 0, false);
        }
        
        // Return licensing details
        return (terms.status, terms.price, terms.requireAttribution);
    }
    
    /**
     * @dev Get total number of terms created
     * @return Total count of terms
     */
    function getTotalTerms() external view returns (uint256) {
        return _termsIds;
    }
    
    /**
     * @dev Check if content is licensable (not DENY status)
     * @param termsId ID of the terms to check
     * @return True if content is licensable, false otherwise
     */
    function isContentLicensable(uint256 termsId) external view returns (bool) {
        require(_idToTerms[termsId].id == termsId, "Terms do not exist");
        return _idToTerms[termsId].status != LicensingStatus.DENY;
    }
    
    /**
     * @dev Check if license requires payment
     * @param termsId ID of the terms to check
     * @return True if license is paid, false otherwise
     */
    function isLicensePaid(uint256 termsId) external view returns (bool) {
        require(_idToTerms[termsId].id == termsId, "Terms do not exist");
        return _idToTerms[termsId].status == LicensingStatus.PAID;
    }
    
    /**
     * @dev Check if a specific usage type is allowed for terms
     * @param termsId ID of the terms to check
     * @param usageType Type of AI usage to check
     * @return True if usage type is allowed, false otherwise
     */
    function isUsageTypeAllowed(uint256 termsId, uint256 usageType) external view returns (bool) {
        require(_idToTerms[termsId].id == termsId, "Terms do not exist");
        
        AIUsageType usageTypeEnum = AIUsageType(usageType);
        for (uint i = 0; i < _idToTerms[termsId].allowedUsageTypes.length; i++) {
            if (_idToTerms[termsId].allowedUsageTypes[i] == usageTypeEnum || 
                _idToTerms[termsId].allowedUsageTypes[i] == AIUsageType.ALL) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Check if attribution is required
     * @param termsId ID of the terms to check
     * @return True if attribution is required, false otherwise
     */
    function isAttributionRequired(uint256 termsId) external view returns (bool) {
        require(_idToTerms[termsId].id == termsId, "Terms do not exist");
        return _idToTerms[termsId].requireAttribution;
    }
    
    /**
     * @dev Get allowed usage types for terms
     * @param termsId ID of the terms
     * @return Array of allowed usage types
     */
    function getAllowedUsageTypes(uint256 termsId) external view returns (AIUsageType[] memory) {
        require(_idToTerms[termsId].id == termsId, "Terms do not exist");
        return _idToTerms[termsId].allowedUsageTypes;
    }
    
    /**
     * @dev Update licensing status
     * @param termsId ID of the terms to update
     * @param status New licensing status
     */
    function updateLicensingStatus(uint256 termsId, LicensingStatus status) external {
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.id == termsId, "Terms do not exist");
        require(terms.creator == msg.sender, "Not terms creator");
        
        // Update status
        terms.status = status;
        
        // Emit update event
        emit TermsUpdated(termsId, msg.sender, status, terms.price);
    }
    
    /**
     * @dev Update license price
     * @param termsId ID of the terms to update
     * @param newPrice New price in wei
     */
    function updateLicensePrice(uint256 termsId, uint256 newPrice) external {
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.id == termsId, "Terms do not exist");
        require(terms.creator == msg.sender, "Not terms creator");
        
        // Validate parameters
        if (terms.status == LicensingStatus.PAID) {
            require(newPrice > 0, "Price must be greater than 0 for PAID status");
        }
        
        // Update price
        terms.price = newPrice;
        
        // Emit update event
        emit TermsUpdated(termsId, msg.sender, terms.status, newPrice);
    }
    
    /**
     * @dev Update attribution requirement
     * @param termsId ID of the terms to update
     * @param requireAttribution New attribution requirement
     */
    function updateAttributionRequirement(uint256 termsId, bool requireAttribution) external {
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.id == termsId, "Terms do not exist");
        require(terms.creator == msg.sender, "Not terms creator");
        
        // Update attribution requirement
        terms.requireAttribution = requireAttribution;
        
        // Emit update event
        emit TermsUpdated(termsId, msg.sender, terms.status, terms.price);
    }
    
    /**
     * @dev Update allowed usage types
     * @param termsId ID of the terms to update
     * @param allowedUsageTypes New array of allowed usage types
     */
    function updateAllowedUsageTypes(uint256 termsId, AIUsageType[] calldata allowedUsageTypes) external {
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.id == termsId, "Terms do not exist");
        require(terms.creator == msg.sender, "Not terms creator");
        require(allowedUsageTypes.length > 0, "Must specify at least one usage type");
        
        // Update usage types
        terms.allowedUsageTypes = allowedUsageTypes;
        
        // Emit update event
        emit TermsUpdated(termsId, msg.sender, terms.status, terms.price);
    }
    
    /**
     * @dev Update custom terms
     * @param termsId ID of the terms to update
     * @param customTermsURI New custom terms URI
     */
    function updateCustomTerms(uint256 termsId, string calldata customTermsURI) external {
        // Get terms and validate ownership
        Terms storage terms = _idToTerms[termsId];
        require(terms.id == termsId, "Terms do not exist");
        require(terms.creator == msg.sender, "Not terms creator");
        
        // Update custom terms
        terms.customTermsURI = customTermsURI;
        
        // Emit update event
        emit TermsUpdated(termsId, msg.sender, terms.status, terms.price);
    }
}
