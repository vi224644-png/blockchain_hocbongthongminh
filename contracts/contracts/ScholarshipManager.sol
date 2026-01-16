// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ScholarshipManager is Ownable { 
    IERC20 public paymentToken; // Biến lưu địa chỉ đồng WCT

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

    enum Status { Created, Applied, Approved, Paid }

    uint256 public nextScholarshipId;
    mapping(uint256 => Scholarship) public scholarships;
    mapping(uint256 => Application[]) public applications;

    event ScholarshipCreated(uint256 indexed id, string title, uint256 amount, uint256 slots, uint256 deadline);
    event Applied(uint256 indexed id, address indexed applicant, uint256 index);
    event ApplicationApproved(uint256 indexed id, uint256 index, address applicant);
    event Paid(uint256 indexed id, uint256 index, address to, uint256 amount);

    // Constructor nhận địa chỉ WCT
    constructor(address _tokenAddress) Ownable(msg.sender) {
        require(_tokenAddress != address(0), "Dia chi Token khong hop le");
        paymentToken = IERC20(_tokenAddress);
    }

    // 1. Tạo học bổng (Admin cần Approve WCT trước ở Frontend)
    function createScholarship(
        string memory title,
        uint256 amount,
        uint256 slots,
        uint256 deadline
    ) external onlyOwner {
        require(deadline > block.timestamp, "Deadline phai o tuong lai");
        
        uint256 totalRequired = amount * slots;
        
        // Rút WCT từ ví Admin vào Contract
        bool success = paymentToken.transferFrom(msg.sender, address(this), totalRequired);
        require(success, "Khong the rut Token. Vui long kiem tra Approve!");

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

    // 2. Nộp hồ sơ
    function applyForScholarship(uint256 scholarshipId, string memory metadata) external {
        Scholarship storage s = scholarships[scholarshipId];
        require(s.deadline > block.timestamp, "Da qua han nop ho so");

        applications[scholarshipId].push(Application(msg.sender, metadata, Status.Applied));
        s.totalApplicants++;
        emit Applied(scholarshipId, msg.sender, s.totalApplicants - 1);
    }

    // 3. Duyệt hồ sơ
    function approveApplicant(uint256 scholarshipId, uint256 index) external onlyOwner {
        require(applications[scholarshipId][index].status == Status.Applied, "Trang thai khong hop le");
        applications[scholarshipId][index].status = Status.Approved;
        emit ApplicationApproved(scholarshipId, index, applications[scholarshipId][index].applicant);
    }

    // 4. Trả thưởng (Chuyển WCT cho sinh viên)
    function payApplicant(uint256 scholarshipId, uint256 index) external onlyOwner {
        Application storage a = applications[scholarshipId][index];
        Scholarship storage s = scholarships[scholarshipId];

        require(a.status == Status.Approved, "Ho so chua duoc duyet");
        require(paymentToken.balanceOf(address(this)) >= s.amount, "Contract het tien");

        a.status = Status.Paid;
        require(paymentToken.transfer(a.applicant, s.amount), "Chuyen tien that bai");

        emit Paid(scholarshipId, index, a.applicant, s.amount);
    }
}