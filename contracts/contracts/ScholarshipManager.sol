// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ScholarshipManager is Ownable { 
    enum Status { Created, Applied, Approved, Paid }

    struct Scholarship {
        uint256 id;
        string title;
        uint256 amount; 
        uint256 slots;
        uint256 deadline; 
        uint256 totalApplicants;
    }

    struct Application {
        address applicant;
        string metadata; 
        Status status;
    }

    uint256 public nextScholarshipId;
    mapping(uint256 => Scholarship) public scholarships;
    mapping(uint256 => Application[]) public applications;

    event ScholarshipCreated(uint256 indexed id, string title, uint256 amount, uint256 slots, uint256 deadline);
    event Applied(uint256 indexed id, address indexed applicant, uint256 index);
    event ApplicationApproved(uint256 indexed id, uint256 index, address applicant);
    event Paid(uint256 indexed id, uint256 index, address to, uint256 amount);

    // Constructor chuẩn cho OpenZeppelin v5.x (cần truyền msg.sender)
    constructor() Ownable(msg.sender) {}

    // 1. Tạo học bổng (Yêu cầu nạp ETH vào contract luôn để đảm bảo có tiền trả sau này)
    function createScholarship(
        string memory title,
        uint256 amount,
        uint256 slots,
        uint256 deadline
    ) external payable onlyOwner {
        require(deadline > block.timestamp, "Deadline must be in the future");
        
        // Bắt buộc người tạo phải gửi đủ tiền (amount * slots) vào contract
        require(msg.value >= amount * slots, "Must fund the scholarship (msg.value < total amount)");

        scholarships[nextScholarshipId] = Scholarship({
            id: nextScholarshipId,
            title: title,
            amount: amount,
            slots: slots,
            deadline: deadline,
            totalApplicants: 0
        });

        emit ScholarshipCreated(nextScholarshipId, title, amount, slots, deadline);

        nextScholarshipId++;
    }

    // 2. Nộp đơn xin học bổng
    function applyForScholarship(uint256 scholarshipId, string memory metadata) external {
        Scholarship storage s = scholarships[scholarshipId];
        require(s.deadline > 0, "Scholarship does not exist");
        require(block.timestamp <= s.deadline, "Deadline passed");

        applications[scholarshipId].push(
            Application({
                applicant: msg.sender,
                metadata: metadata,
                status: Status.Applied
            })
        );

        s.totalApplicants++;

        emit Applied(scholarshipId, msg.sender, s.totalApplicants - 1);
    }

    // 3. Duyệt hồ sơ (Chỉ Owner)
    function approveApplicant(uint256 scholarshipId, uint256 index) external onlyOwner {
        require(index < applications[scholarshipId].length, "Invalid application index");

        Application storage a = applications[scholarshipId][index];
        require(a.status == Status.Applied, "Application not in Applied status");

        a.status = Status.Approved;

        emit ApplicationApproved(scholarshipId, index, a.applicant);
    }

    // 4. Giải ngân (Trả tiền cho sinh viên đã được duyệt)
    function payApplicant(uint256 scholarshipId, uint256 index) external onlyOwner {
        require(index < applications[scholarshipId].length, "Invalid application index");

        Application storage a = applications[scholarshipId][index];
        Scholarship storage s = scholarships[scholarshipId];

        require(a.status == Status.Approved, "Application not approved yet");
        require(address(this).balance >= s.amount, "Contract insufficient funds");

        a.status = Status.Paid;

        // Chuyển tiền cho sinh viên
        (bool success, ) = payable(a.applicant).call{value: s.amount}("");
        require(success, "Transfer failed");

        emit Paid(scholarshipId, index, a.applicant, s.amount);
    }

    // Rút tiền khẩn cấp (Chỉ Owner)
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    // Nhận ETH tự do (nếu có ai gửi nhầm hoặc donate)
    receive() external payable {}
}