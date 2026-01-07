// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ScholarshipSystem {
    // Structs
    struct Scholarship {
        uint256 id;
        string name;
        string description;
        uint256 amount;
        address provider;
        string criteria;
        uint256 deadline;
        bool isActive;
        uint256 maxRecipients;
        uint256 currentRecipients;
        string category;
        string[] requiredDocuments;
        uint256 createdAt;
    }
    
    struct Application {
        uint256 id;
        uint256 scholarshipId;
        address student;
        string documentHash;
        string transcriptHash;
        string status;
        uint256 score;
        string reviewNotes;
        uint256 appliedAt;
        uint256 reviewedAt;
    }
    
    struct Sponsor {
        address sponsorAddress;
        string companyName;
        string email;
        uint256 totalFunded;
        uint256 activeScholarships;
        bool isVerified;
        uint256 joinedAt;
    }
    
    // State variables
    mapping(uint256 => Scholarship) public scholarships;
    mapping(uint256 => Application) public applications;
    mapping(address => Sponsor) public sponsors;
    mapping(uint256 => uint256[]) public scholarshipApplications;
    mapping(address => uint256[]) public studentApplications;
    mapping(address => bool) public authorizedVerifiers;
    mapping(string => bool) public documentHashExists;
    
    uint256 public scholarshipCounter;
    uint256 public applicationCounter;
    address public owner;
    
    // Events
    event ScholarshipCreated(uint256 indexed id, string name, uint256 amount, address provider);
    event ApplicationSubmitted(uint256 indexed id, uint256 scholarshipId, address student);
    event ApplicationReviewed(uint256 indexed id, string status, uint256 score);
    event SponsorRegistered(address indexed sponsor, string companyName);
    event FundsDisbursed(uint256 scholarshipId, address student, uint256 amount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    modifier onlyActiveScholarship(uint256 _scholarshipId) {
        require(scholarships[_scholarshipId].isActive, "Scholarship not active");
        require(block.timestamp < scholarships[_scholarshipId].deadline, "Deadline passed");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedVerifiers[msg.sender] = true;
    }
    
    // Sponsor registration
    function registerSponsor(
        string memory _companyName,
        string memory _email
    ) public {
        require(bytes(_companyName).length > 0, "Company name required");
        
        sponsors[msg.sender] = Sponsor({
            sponsorAddress: msg.sender,
            companyName: _companyName,
            email: _email,
            totalFunded: 0,
            activeScholarships: 0,
            isVerified: false,
            joinedAt: block.timestamp
        });
        
        emit SponsorRegistered(msg.sender, _companyName);
    }
    
    // Create scholarship
    function createScholarship(
        string memory _name,
        string memory _description,
        uint256 _amount,
        string memory _criteria,
        uint256 _deadline,
        uint256 _maxRecipients,
        string memory _category,
        string[] memory _requiredDocuments
    ) public payable returns (uint256) {
        require(bytes(_name).length > 0, "Name required");
        require(_amount > 0, "Amount must be greater than 0");
        require(_deadline > block.timestamp, "Invalid deadline");
        require(_maxRecipients > 0, "Max recipients must be greater than 0");
        require(msg.value >= _amount * _maxRecipients, "Insufficient funds");
        
        scholarshipCounter++;
        
        scholarships[scholarshipCounter] = Scholarship({
            id: scholarshipCounter,
            name: _name,
            description: _description,
            amount: _amount,
            provider: msg.sender,
            criteria: _criteria,
            deadline: _deadline,
            isActive: true,
            maxRecipients: _maxRecipients,
            currentRecipients: 0,
            category: _category,
            requiredDocuments: _requiredDocuments,
            createdAt: block.timestamp
        });
        
        // Update sponsor stats
        if (bytes(sponsors[msg.sender].companyName).length > 0) {
            sponsors[msg.sender].totalFunded += msg.value;
            sponsors[msg.sender].activeScholarships++;
        }
        
        emit ScholarshipCreated(scholarshipCounter, _name, _amount, msg.sender);
        return scholarshipCounter;
    }
    
    // Apply for scholarship
    function applyForScholarship(
        uint256 _scholarshipId,
        string memory _documentHash,
        string memory _transcriptHash
    ) public onlyActiveScholarship(_scholarshipId) returns (uint256) {
        require(bytes(_documentHash).length > 0, "Document hash required");
        require(!documentHashExists[_documentHash], "Document already used");
        
        // Check if student already applied
        uint256[] memory studentApps = studentApplications[msg.sender];
        for (uint i = 0; i < studentApps.length; i++) {
            Application memory app = applications[studentApps[i]];
            if (app.scholarshipId == _scholarshipId) {
                revert("Already applied for this scholarship");
            }
        }
        
        applicationCounter++;
        
        applications[applicationCounter] = Application({
            id: applicationCounter,
            scholarshipId: _scholarshipId,
            student: msg.sender,
            documentHash: _documentHash,
            transcriptHash: _transcriptHash,
            status: "pending",
            score: 0,
            reviewNotes: "",
            appliedAt: block.timestamp,
            reviewedAt: 0
        });
        
        scholarshipApplications[_scholarshipId].push(applicationCounter);
        studentApplications[msg.sender].push(applicationCounter);
        documentHashExists[_documentHash] = true;
        
        emit ApplicationSubmitted(applicationCounter, _scholarshipId, msg.sender);
        return applicationCounter;
    }
    
    // Review application
    function reviewApplication(
        uint256 _applicationId,
        uint256 _score,
        string memory _status,
        string memory _reviewNotes
    ) public onlyAuthorized {
        require(_score <= 100, "Invalid score");
        require(
            keccak256(bytes(_status)) == keccak256(bytes("approved")) ||
            keccak256(bytes(_status)) == keccak256(bytes("rejected")) ||
            keccak256(bytes(_status)) == keccak256(bytes("pending")),
            "Invalid status"
        );
        
        Application storage application = applications[_applicationId];
        require(keccak256(bytes(application.status)) == keccak256(bytes("pending")), "Already reviewed");
        
        application.score = _score;
        application.status = _status;
        application.reviewNotes = _reviewNotes;
        application.reviewedAt = block.timestamp;
        
        Scholarship storage scholarship = scholarships[application.scholarshipId];
        
        if (keccak256(bytes(_status)) == keccak256(bytes("approved"))) {
            require(scholarship.currentRecipients < scholarship.maxRecipients, "Max recipients reached");
            scholarship.currentRecipients++;
            
            // Disburse funds
            payable(application.student).transfer(scholarship.amount);
            emit FundsDisbursed(application.scholarshipId, application.student, scholarship.amount);
        }
        
        emit ApplicationReviewed(_applicationId, _status, _score);
    }
    
    // Get functions
    function getScholarshipApplications(uint256 _scholarshipId) public view returns (uint256[] memory) {
        return scholarshipApplications[_scholarshipId];
    }
    
    function getStudentApplications(address _student) public view returns (uint256[] memory) {
        return studentApplications[_student];
    }
    
    function getApplicationsByStatus(string memory _status) public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](applicationCounter);
        uint256 counter = 0;
        
        for (uint256 i = 1; i <= applicationCounter; i++) {
            if (keccak256(bytes(applications[i].status)) == keccak256(bytes(_status))) {
                result[counter] = i;
                counter++;
            }
        }
        
        uint256[] memory filtered = new uint256[](counter);
        for (uint256 i = 0; i < counter; i++) {
            filtered[i] = result[i];
        }
        
        return filtered;
    }
    
    // Admin functions
    function addAuthorizedVerifier(address _verifier) public onlyOwner {
        authorizedVerifiers[_verifier] = true;
    }
    
    function removeAuthorizedVerifier(address _verifier) public onlyOwner {
        authorizedVerifiers[_verifier] = false;
    }
    
    function deactivateScholarship(uint256 _scholarshipId) public {
        require(msg.sender == scholarships[_scholarshipId].provider || msg.sender == owner, "Not authorized");
        scholarships[_scholarshipId].isActive = false;
    }
    
    // Fallback function
    receive() external payable {}
}