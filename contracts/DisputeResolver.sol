// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CreatorRegistry.sol";

/**
 * @title DisputeResolver
 * @dev Contract for handling violation reports and dispute resolution
 * Part of the CreatorClaim Protocol on BaseCAMP
 */
contract DisputeResolver is Ownable, ReentrancyGuard {
    // Dispute ID counter
    uint256 private _disputeIds;
    
    // Reference to CreatorRegistry contract
    CreatorRegistry public creatorRegistry;
    
    // Dispute status options
    enum DisputeStatus {
        REPORTED,       // Initial state when reported
        UNDER_REVIEW,   // Being reviewed by arbiters
        RESOLVED_VALID, // Resolved as valid violation
        RESOLVED_INVALID, // Resolved as invalid claim
        SETTLED         // Settled between parties
    }
    
    // Dispute resolution structure
    struct Dispute {
        uint256 id;
        address reporter;         // Person who reported the violation
        address defendant;        // Person/entity accused of violation
        uint256[] contentIds;     // Content IDs involved in dispute
        string evidenceURI;       // URI to evidence package (IPFS)
        string violationDetails;  // Description of the violation
        DisputeStatus status;
        string resolutionNotes;   // Notes on resolution
        uint256 reportTime;
        uint256 resolutionTime;
        address[] arbiters;       // Addresses of arbiters reviewing the case
        mapping(address => bool) arbiterVotes; // Mapping of arbiter to vote (true = valid violation)
        uint256 validVotes;       // Number of arbiters who voted valid
        uint256 invalidVotes;     // Number of arbiters who voted invalid
    }
    
    // Map dispute ID to Dispute
    mapping(uint256 => Dispute) private _disputes;
    
    // Map reporter address to their dispute IDs
    mapping(address => uint256[]) private _reporterToDisputeIds;
    
    // Map defendant address to their dispute IDs
    mapping(address => uint256[]) private _defendantToDisputeIds;
    
    // Map content ID to dispute IDs
    mapping(uint256 => uint256[]) private _contentToDisputeIds;
    
    // Set of arbiters
    mapping(address => bool) private _arbiters;
    
    // Array to track all arbiter addresses
    address[] private _arbitersArray;
    
    // Count of active arbiters
    uint256 private _arbiterCount;
    
    // Required votes to resolve a dispute
    uint256 public requiredVotes;
    
    // Events
    event DisputeReported(
        uint256 indexed disputeId,
        address indexed reporter,
        address indexed defendant
    );
    
    event DisputeStatusUpdated(
        uint256 indexed disputeId,
        DisputeStatus status
    );
    
    event ArbiterVoted(
        uint256 indexed disputeId,
        address indexed arbiter,
        bool voteValid
    );
    
    event ArbiterAdded(
        address indexed arbiter
    );
    
    event ArbiterRemoved(
        address indexed arbiter
    );
    
    event RequiredVotesUpdated(
        uint256 oldValue,
        uint256 newValue
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        bool isValid
    );
    
    event DisputeVoteCast(
        uint256 indexed disputeId,
        address indexed arbiter,
        bool isValid
    );
    
    /**
     * @dev Constructor
     * @param _creatorRegistry Address of the CreatorRegistry contract
     * @param _requiredVotes Number of arbiter votes required to resolve a dispute
     * @param initialOwner The address that will own the contract
     */
    constructor(
        address _creatorRegistry,
        uint256 _requiredVotes,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_creatorRegistry != address(0), "Invalid CreatorRegistry address");
        require(_requiredVotes > 0, "Required votes must be greater than 0");
        
        creatorRegistry = CreatorRegistry(_creatorRegistry);
        requiredVotes = _requiredVotes;
    }
    
    /**
     * @dev Report a new dispute/violation
     * @param defendant Address of the defendant
     * @param contentIds Array of content IDs involved in the dispute
     * @param evidenceURI URI pointing to evidence package
     * @param violationDetails Description of the violation
     * @return disputeId ID of the created dispute
     */
    function reportDispute(
        address defendant,
        uint256[] calldata contentIds,
        string calldata evidenceURI,
        string calldata violationDetails
    ) external returns (uint256) {
        // Validate parameters
        require(defendant != address(0), "Invalid defendant address");
        require(contentIds.length > 0, "No content IDs provided");
        
        // Verify at least one of the content IDs exists
        bool contentExists = false;
        for (uint i = 0; i < contentIds.length; i++) {
            // Use getContentById to check if content exists
            try creatorRegistry.getContentById(contentIds[i]) {
                contentExists = true;
                break;
            } catch {
                // Content doesn't exist, continue checking
            }
        }
        require(contentExists, "Content does not exist");
        
        // Increment counter and get new ID
        _disputeIds += 1;
        uint256 newDisputeId = _disputeIds;
        
        // Create new dispute
        Dispute storage newDispute = _disputes[newDisputeId];
        newDispute.id = newDisputeId;
        newDispute.reporter = msg.sender;
        newDispute.defendant = defendant;
        newDispute.contentIds = contentIds;
        newDispute.evidenceURI = evidenceURI;
        newDispute.violationDetails = violationDetails;
        newDispute.status = DisputeStatus.REPORTED;
        newDispute.reportTime = block.timestamp;
        newDispute.resolutionTime = 0;
        newDispute.arbiters = new address[](0);
        newDispute.validVotes = 0;
        newDispute.invalidVotes = 0;
        
        // Store dispute references
        _reporterToDisputeIds[msg.sender].push(newDisputeId);
        _defendantToDisputeIds[defendant].push(newDisputeId);
        
        // Link content IDs to dispute
        for (uint i = 0; i < contentIds.length; i++) {
            _contentToDisputeIds[contentIds[i]].push(newDisputeId);
        }
        
        // Emit dispute reported event
        emit DisputeReported(
            newDisputeId,
            msg.sender,
            defendant
        );
        
        return newDisputeId;
    }
    
    /**
     * @dev Add arbiter to dispute
     * @param disputeId ID of the dispute
     * @param arbiterAddress Address of the arbiter to add
     */
    function assignArbiter(uint256 disputeId, address arbiterAddress) external onlyOwner {
        // Validate parameters
        require(_arbiters[arbiterAddress], "Not a registered arbiter");
        
        // Get dispute
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.id == disputeId, "Dispute does not exist");
        require(dispute.status == DisputeStatus.REPORTED || 
                dispute.status == DisputeStatus.UNDER_REVIEW, 
                "Dispute not in reviewable state");
        
        // Check if arbiter already assigned
        for (uint i = 0; i < dispute.arbiters.length; i++) {
            require(dispute.arbiters[i] != arbiterAddress, "Arbiter already assigned");
        }
        
        // Add arbiter to dispute
        dispute.arbiters.push(arbiterAddress);
        
        // Update dispute status
        if (dispute.status == DisputeStatus.REPORTED) {
            dispute.status = DisputeStatus.UNDER_REVIEW;
            emit DisputeStatusUpdated(disputeId, DisputeStatus.UNDER_REVIEW);
        }
    }
    
    /**
     * @dev Arbiter votes on dispute validity
     * @param disputeId ID of the dispute
     * @param voteValid True if arbiter thinks the violation is valid, false otherwise
     */
    function voteOnDispute(uint256 disputeId, bool voteValid) external {
        // Validate caller is an arbiter
        require(_arbiters[msg.sender], "Only arbiters can vote");
        
        // Get dispute
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.id == disputeId, "Dispute does not exist");
        
        // Check dispute status
        require(
            dispute.status == DisputeStatus.REPORTED || 
            dispute.status == DisputeStatus.UNDER_REVIEW,
            "Dispute not in reviewable status"
        );
        
        // Check if arbiter has already voted
        require(!dispute.arbiterVotes[msg.sender], "Already voted");
        
        // Record vote
        dispute.arbiterVotes[msg.sender] = true;
        dispute.arbiters.push(msg.sender);
        
        if (voteValid) {
            dispute.validVotes++;
        } else {
            dispute.invalidVotes++;
        }
        
        // Emit the DisputeVoteCast event
        emit DisputeVoteCast(disputeId, msg.sender, voteValid);
        emit ArbiterVoted(disputeId, msg.sender, voteValid);
        
        // Update status if under review
        if (dispute.status == DisputeStatus.REPORTED) {
            dispute.status = DisputeStatus.UNDER_REVIEW;
            emit DisputeStatusUpdated(disputeId, DisputeStatus.UNDER_REVIEW);
        }
        
        // Auto-resolve if we have enough votes
        if (dispute.validVotes >= requiredVotes) {
            dispute.status = DisputeStatus.RESOLVED_VALID;
            dispute.resolutionTime = block.timestamp;
            emit DisputeStatusUpdated(disputeId, DisputeStatus.RESOLVED_VALID);
            emit DisputeResolved(disputeId, true);
        } else if (dispute.invalidVotes >= requiredVotes) {
            dispute.status = DisputeStatus.RESOLVED_INVALID;
            dispute.resolutionTime = block.timestamp;
            emit DisputeStatusUpdated(disputeId, DisputeStatus.RESOLVED_INVALID);
            emit DisputeResolved(disputeId, false);
        }
    }
    
    /**
     * @dev Manually resolve a dispute (owner only)
     * @param disputeId ID of the dispute
     * @param isValid Whether the dispute is considered valid
     * @param resolutionNotes Notes on resolution
     */
    function resolveDispute(uint256 disputeId, bool isValid, string calldata resolutionNotes) external onlyOwner {
        // Get dispute
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.id == disputeId, "Dispute does not exist");
        require(dispute.status != DisputeStatus.RESOLVED_VALID && 
                dispute.status != DisputeStatus.RESOLVED_INVALID, 
                "Dispute already resolved");
        
        // Set resolution status
        dispute.status = isValid ? DisputeStatus.RESOLVED_VALID : DisputeStatus.RESOLVED_INVALID;
        dispute.resolutionNotes = resolutionNotes;
        dispute.resolutionTime = block.timestamp;
        
        // Emit events
        emit DisputeStatusUpdated(disputeId, dispute.status);
        emit DisputeResolved(disputeId, isValid);
    }
    
    /**
     * @dev Mark dispute as settled
     * @param disputeId ID of the dispute
     * @param resolutionNotes Notes on how the dispute was settled
     */
    function settleDispute(uint256 disputeId, string calldata resolutionNotes) external {
        // Get dispute
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.id == disputeId, "Dispute does not exist");
        
        // Validate caller is reporter or defendant
        require(msg.sender == dispute.reporter || msg.sender == dispute.defendant || owner() == msg.sender,
            "Not authorized to settle");
        
        // Update dispute status
        dispute.status = DisputeStatus.SETTLED;
        dispute.resolutionNotes = resolutionNotes;
        dispute.resolutionTime = block.timestamp;
        
        // Emit dispute status updated event
        emit DisputeStatusUpdated(disputeId, DisputeStatus.SETTLED);
    }
    
    /**
     * @dev Add a new arbiter
     * @param arbiterAddress Address of the new arbiter
     */
    function addArbiter(address arbiterAddress) external onlyOwner {
        require(arbiterAddress != address(0), "Invalid arbiter address");
        require(!_arbiters[arbiterAddress], "Already an arbiter");
        
        _arbiters[arbiterAddress] = true;
        _arbitersArray.push(arbiterAddress);
        _arbiterCount++;
        
        // Emit arbiter added event
        emit ArbiterAdded(arbiterAddress);
    }
    
    /**
     * @dev Remove an arbiter
     * @param arbiterAddress Address of the arbiter to remove
     */
    function removeArbiter(address arbiterAddress) external onlyOwner {
        require(_arbiters[arbiterAddress], "Not an arbiter");
        
        _arbiters[arbiterAddress] = false;
        _arbiterCount--;
        
        // Emit arbiter removed event
        emit ArbiterRemoved(arbiterAddress);
    }
    
    /**
     * @dev Update required votes to resolve disputes
     * @param _requiredVotes New required votes value
     */
    function updateRequiredVotes(uint256 _requiredVotes) external onlyOwner {
        require(_requiredVotes > 0, "Required votes must be greater than 0");
        
        // Get count of arbiters
        uint256 arbiterCount = 0;
        address[] memory arbiterAddresses = getArbiters();
        arbiterCount = arbiterAddresses.length;
        
        require(_requiredVotes <= arbiterCount, "Required votes cannot exceed arbiter count");
        
        uint256 oldValue = requiredVotes;
        requiredVotes = _requiredVotes;
        
        emit RequiredVotesUpdated(oldValue, _requiredVotes);
    }
    
    /**
     * @dev Check if an address is a registered arbiter
     * @param arbiterAddress Address to check
     * @return True if address is an arbiter, false otherwise
     */
    function isArbiter(address arbiterAddress) external view returns (bool) {
        return _arbiters[arbiterAddress];
    }
    
    /**
     * @dev Get dispute basic info by ID
     * @param disputeId ID of the dispute to retrieve
     * @return id Dispute ID
     * @return reporter Reporter address
     * @return defendant Defendant address
     * @return status Dispute status
     * @return reportTime Report timestamp
     * @return resolutionTime Resolution timestamp
     */
    function getDisputeBasicInfo(uint256 disputeId) external view returns (
        uint256 id,
        address reporter,
        address defendant,
        DisputeStatus status,
        uint256 reportTime,
        uint256 resolutionTime
    ) {
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.id == disputeId, "Dispute does not exist");
        
        return (
            dispute.id,
            dispute.reporter,
            dispute.defendant,
            dispute.status,
            dispute.reportTime,
            dispute.resolutionTime
        );
    }
    
    /**
     * @dev Get dispute content info by ID
     * @param disputeId ID of the dispute to retrieve
     * @return contentIds Content IDs involved
     * @return evidenceURI Evidence URI
     * @return violationDetails Violation details
     * @return resolutionNotes Resolution notes
     */
    function getDisputeContentInfo(uint256 disputeId) external view returns (
        uint256[] memory contentIds,
        string memory evidenceURI,
        string memory violationDetails,
        string memory resolutionNotes
    ) {
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.id == disputeId, "Dispute does not exist");
        
        return (
            dispute.contentIds,
            dispute.evidenceURI,
            dispute.violationDetails,
            dispute.resolutionNotes
        );
    }
    
    /**
     * @dev Get dispute voting info by ID
     * @param disputeId ID of the dispute to retrieve
     * @return arbiters Array of arbiters
     * @return validVotes Number of valid votes
     * @return invalidVotes Number of invalid votes
     */
    function getDisputeVotingInfo(uint256 disputeId) external view returns (
        address[] memory arbiters,
        uint256 validVotes,
        uint256 invalidVotes
    ) {
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.id == disputeId, "Dispute does not exist");
        
        return (
            dispute.arbiters,
            dispute.validVotes,
            dispute.invalidVotes
        );
    }
    
    /**
     * @dev Get all dispute IDs reported by an address
     * @param reporter Reporter address
     * @return Array of dispute IDs
     */
    function getReporterDisputeIds(address reporter) external view returns (uint256[] memory) {
        return _reporterToDisputeIds[reporter];
    }
    
    /**
     * @dev Get all dispute IDs where an address is the defendant
     * @param defendant Defendant address
     * @return Array of dispute IDs
     */
    function getDefendantDisputeIds(address defendant) external view returns (uint256[] memory) {
        return _defendantToDisputeIds[defendant];
    }
    
    /**
     * @dev Get all dispute IDs involving a specific content
     * @param contentId Content ID
     * @return Array of dispute IDs
     */
    function getContentDisputeIds(uint256 contentId) external view returns (uint256[] memory) {
        return _contentToDisputeIds[contentId];
    }
    
    /**
     * @dev Get total number of disputes
     * @return Total count of disputes
     */
    function getTotalDisputes() external view returns (uint256) {
        return _disputeIds;
    }
    
    /**
     * @dev Get all arbiters
     * @return Array of arbiters
     */
    function getArbitersCount() external view returns (uint256) {
        return _arbiterCount;
    }
    
    /**
     * @dev Get all arbiter addresses
     * @return Array of arbiter addresses
     */
    function getArbiters() public view returns (address[] memory) {
        address[] memory arbiters = new address[](_arbiterCount);
        uint256 index = 0;
        
        // Iterate through all arbiter addresses and return only active ones
        for (uint256 i = 0; i < _arbitersArray.length; i++) {
            address arbiter = _arbitersArray[i];
            if (_arbiters[arbiter]) {
                arbiters[index] = arbiter;
                index++;
            }
        }
        
        return arbiters;
    }
    
    /**
     * @dev Check if arbiter has voted on a dispute
     * @param disputeId Dispute ID
     * @param arbiterAddress Arbiter address
     * @return True if arbiter has voted, false otherwise
     */
    function hasArbiterVoted(uint256 disputeId, address arbiterAddress) external view returns (bool) {
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.id == disputeId, "Dispute does not exist");
        
        return dispute.arbiterVotes[arbiterAddress];
    }
}
