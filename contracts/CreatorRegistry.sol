// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreatorRegistry
 * @dev Smart contract for registering creative content ownership and managing AI usage rights
 * Core component of the CreatorClaim Protocol on BaseCAMP
 */
contract CreatorRegistry is Ownable {
    // Content registration counter
    uint256 private _contentIds;
    
    // Content structure
    struct Content {
        uint256 id;
        address creator;
        string contentFingerprint;
        string metadataURI;
        uint256 registrationTime;
        bool active;
        uint256 licensingTermsId; // ID reference to licensing terms
    }
    
    // Map content fingerprint to content ID
    mapping(string => uint256) private fingerprintToId;
    
    // Map ID to content
    mapping(uint256 => Content) private idToContent;
    
    // Map creator address to their content IDs
    mapping(address => uint256[]) private creatorToContentIds;
    
    // LicensingTerms contract address
    address public licensingTermsContract;
    
    // Events
    event ContentRegistered(
        uint256 indexed contentId,
        address indexed creator,
        string contentFingerprint,
        string metadataURI
    );
    
    event ContentUpdated(
        uint256 indexed contentId,
        address indexed creator,
        string metadataURI
    );
    
    event ContentDeactivated(
        uint256 indexed contentId,
        address indexed creator
    );
    
    event ContentStatusChanged(
        uint256 indexed contentId,
        address indexed creator,
        bool active
    );
    
    event LicensingTermsUpdated(
        uint256 indexed contentId,
        uint256 licensingTermsId
    );
    
    // Event for setting LicensingTerms contract
    event LicensingTermsContractSet(address indexed licensingTermsContract);

    /**
     * @dev Constructor
     * @param initialOwner The address that will own the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Register new content with a unique fingerprint
     * @param contentFingerprint Cryptographic fingerprint of the content (from Camp Origin SDK)
     * @param metadataURI URI pointing to content metadata (IPFS recommended)
     * @return contentId The ID assigned to the registered content
     */
    function registerContent(
        string calldata contentFingerprint,
        string calldata metadataURI
    ) external returns (uint256) {
        // Validate parameters
        require(bytes(contentFingerprint).length > 0, "Fingerprint cannot be empty");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        require(fingerprintToId[contentFingerprint] == 0, "Content already registered");
        
        // Increment counter and get new ID
        _contentIds += 1;
        uint256 newContentId = _contentIds;
        
        // Create new content record
        Content memory newContent = Content({
            id: newContentId,
            creator: msg.sender,
            contentFingerprint: contentFingerprint,
            metadataURI: metadataURI,
            registrationTime: block.timestamp,
            active: true,
            licensingTermsId: 0 // No licensing terms initially
        });
        
        // Store content
        idToContent[newContentId] = newContent;
        fingerprintToId[contentFingerprint] = newContentId;
        creatorToContentIds[msg.sender].push(newContentId);
        
        // Emit registration event
        emit ContentRegistered(
            newContentId,
            msg.sender,
            contentFingerprint,
            metadataURI
        );
        
        return newContentId;
    }
    
    /**
     * @dev Update content metadata
     * @param contentId ID of the content to update
     * @param metadataURI New metadata URI
     */
    function updateContentMetadata(
        uint256 contentId,
        string calldata metadataURI
    ) external {
        // Validate parameters
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        
        // Get content and validate ownership
        Content storage content = idToContent[contentId];
        require(content.id == contentId, "Content does not exist");
        require(content.creator == msg.sender, "Only content creator can update");
        require(content.active, "Content not active");
        
        // Update metadata
        content.metadataURI = metadataURI;
        
        // Emit update event
        emit ContentUpdated(
            contentId,
            msg.sender,
            metadataURI
        );
    }
    
    /**
     * @dev Set content active status
     * @param contentId ID of the content to update
     * @param active New active status
     */
    function setContentActive(uint256 contentId, bool active) external {
        // Get content and validate ownership
        Content storage content = idToContent[contentId];
        require(content.id == contentId, "Content does not exist");
        require(content.creator == msg.sender, "Only content creator can update");
        
        // Skip if already set to requested status
        if (content.active == active) return;
        
        // Update active status
        content.active = active;
        
        // Emit appropriate event
        if (!active) {
            emit ContentDeactivated(contentId, msg.sender);
        }
        
        emit ContentStatusChanged(contentId, msg.sender, active);
    }
    
    /**
     * @dev Deactivate content (remove from active registry)
     * @param contentId ID of the content to deactivate
     */
    function deactivateContent(uint256 contentId) external {
        // Get content and validate ownership
        Content storage content = idToContent[contentId];
        require(content.creator == msg.sender, "Only content creator can update");
        require(content.active, "Content already inactive");
        
        // Deactivate content
        content.active = false;
        
        // Emit deactivation event
        emit ContentDeactivated(contentId, msg.sender);
    }
    
    /**
     * @dev Link content to specific licensing terms
     * @param contentId ID of the content
     * @param licensingTermsId ID of the licensing terms
     */
    function setContentLicensingTerms(
        uint256 contentId,
        uint256 licensingTermsId
    ) external {
        // Check that licensing terms contract is set
        require(licensingTermsContract != address(0), "Licensing terms contract not set");
        
        // Get content and validate ownership
        Content storage content = idToContent[contentId];
        require(content.id == contentId, "Content does not exist");
        
        // Allow both content creator and LicensingTerms contract to update
        require(
            content.creator == msg.sender || msg.sender == licensingTermsContract,
            "Unauthorized: neither creator nor licensing contract"
        );
        require(content.active, "Content not active");
        
        // Update licensing terms
        content.licensingTermsId = licensingTermsId;
        
        // Emit licensing terms updated event
        emit LicensingTermsUpdated(contentId, licensingTermsId);
    }
    
    /**
     * @dev Get content by ID
     * @param contentId ID of the content to retrieve
     * @return Content details
     */
    function getContentById(uint256 contentId) external view returns (Content memory) {
        require(idToContent[contentId].id == contentId, "Content does not exist");
        return idToContent[contentId];
    }
    
    /**
     * @dev Get content by fingerprint
     * @param contentFingerprint Fingerprint of the content
     * @return Content details
     */
    function getContentByFingerprint(string calldata contentFingerprint) external view returns (Content memory) {
        uint256 contentId = fingerprintToId[contentFingerprint];
        require(contentId > 0, "Content does not exist");
        return idToContent[contentId];
    }
    
    /**
     * @dev Get all content IDs owned by a creator
     * @param creator Address of the creator
     * @return Array of content IDs
     */
    function getCreatorContentIds(address creator) external view returns (uint256[] memory) {
        return creatorToContentIds[creator];
    }
    
    /**
     * @dev Check if content with given fingerprint exists
     * @param contentFingerprint Fingerprint to check
     * @return True if content exists, false otherwise
     */
    function contentExists(string calldata contentFingerprint) external view returns (bool) {
        return fingerprintToId[contentFingerprint] > 0;
    }
    
    /**
     * @dev Get total number of registered content
     * @return Total count of content
     */
    function getTotalContent() external view returns (uint256) {
        return _contentIds;
    }
    
    /**
     * @dev Verify content ownership
     * @param contentId ID of the content
     * @param creator Address to verify as owner
     * @return True if creator owns the content, false otherwise
     */
    function verifyContentOwnership(uint256 contentId, address creator) external view returns (bool) {
        return idToContent[contentId].creator == creator;
    }
    
    /**
     * @dev Get content ID by fingerprint
     * @param contentFingerprint The fingerprint to lookup
     * @return Content ID associated with the fingerprint
     */
    function getContentIdByFingerprint(string calldata contentFingerprint) external view returns (uint256) {
        uint256 contentId = fingerprintToId[contentFingerprint];
        require(contentId > 0, "Content does not exist");
        return contentId;
    }
    
    /**
     * @dev Get all content IDs owned by a specific creator
     * @param creator Address of the creator
     * @return Array of content IDs
     */
    function getContentIdsByCreator(address creator) external view returns (uint256[] memory) {
        return creatorToContentIds[creator];
    }
    
    /**
     * @dev Set the address of the LicensingTerms contract
     * @param _licensingTermsContract Address of the LicensingTerms contract
     */
    function setLicensingTermsContract(address _licensingTermsContract) external onlyOwner {
        require(_licensingTermsContract != address(0), "Invalid LicensingTerms address");
        licensingTermsContract = _licensingTermsContract;
        emit LicensingTermsContractSet(_licensingTermsContract);
    }
}
