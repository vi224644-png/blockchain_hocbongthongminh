// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "/Users/wocten/Documents/blockchain_hocbongthongminh/project-root/contracts/node_modules/@openzeppelin/contracts/access/Ownable.sol";

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

    // --- SỬA LỖI CONSTRUCTOR ---
    // Nếu dùng OpenZeppelin v5.0+: Phải truyền msg.sender vào Ownable
    constructor() Ownable(msg.sender) {}
    
    // LƯU Ý: Nếu bạn dùng OpenZeppelin v4.x (báo lỗi "Wrong argument count"), 
    // hãy đổi dòng trên thành:
    // constructor() Ownable() {}

    // Create scholarship
    function createScholarship(
        string memory title,
        uint256 amount,
        uint256 slots,
        uint256 deadline
    ) external payable onlyOwner {
        require(deadline > block.timestamp, "deadline must be future");
        
        // --- SỬA LỖI LOGIC ---
        // Bạn PHẢI mở dòng này ra, nếu không contract không có tiền để trả sau này.
        // Hoặc bạn phải chắc chắn gửi ETH vào khi gọi hàm này.
        require(msg.value >= amount * slots, "Must fund the scholarship");

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

    // Apply for a scholarship
    function applyForScholarship(uint256 scholarshipId, string memory metadata) external {
        Scholarship storage s = scholarships[scholarshipId];
        // Sửa: Kiểm tra deadline != 0 để đảm bảo học bổng tồn tại hợp lệ hơn
        require(s.deadline > 0, "Scholarship does not exist");
        require(block.timestamp <= s.deadline, "deadline passed");

        // Kiểm tra xem slot đã full chưa (Optional nhưng nên có)
        // require(s.totalApplicants < s.slots, "Slots full");

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

    // Approve applicant
    function approveApplicant(uint256 scholarshipId, uint256 index) external onlyOwner {
        require(index < applications[scholarshipId].length, "invalid index");

        Application storage a = applications[scholarshipId][index];
        require(a.status == Status.Applied, "not applied or already processed");

        a.status = Status.Approved;

        emit ApplicationApproved(scholarshipId, index, a.applicant);
    }

    // Pay scholarship
    function payApplicant(uint256 scholarshipId, uint256 index) external payable onlyOwner {
        require(index < applications[scholarshipId].length, "invalid index");

        Application storage a = applications[scholarshipId][index];
        Scholarship storage s = scholarships[scholarshipId];

        require(a.status == Status.Approved, "not approved");
        
        // Kiểm tra số dư thực tế của contract
        require(address(this).balance >= s.amount, "Contract insufficient funds");

        a.status = Status.Paid;

        // Chuyển tiền
        (bool ok, ) = payable(a.applicant).call{value: s.amount}("");
        require(ok, "payment failed");

        emit Paid(scholarshipId, index, a.applicant, s.amount);
    }

    function emergencyWithdraw() external onlyOwner {
        (bool ok, ) = payable(owner()).call{value: address(this).balance}("");
        require(ok, "withdrawal failed");
    }

    receive() external payable {}
}