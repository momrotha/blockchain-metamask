// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PaymentProcessor {
    address public owner;

    event PaymentReceived(address indexed from, uint256 amount, string orderId);

    constructor() {
        owner = msg.sender;
    }

    // Pay for an order using ETH
    function pay(string memory orderId) public payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        // Emit an event that the backend can listen to or verify
        emit PaymentReceived(msg.sender, msg.value, orderId);
    }

    // Owner can withdraw the funds
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
}
