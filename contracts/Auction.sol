//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./NFTEscrow.sol";

contract Auction is NFTEscrow, Ownable {

    address public highestBidder;
    
    bool auctionStarted;
    bool auctionEnded;

    
    uint256 public highestBid;
    uint256 public auctionStartTime;
    uint256 public auctionEndTime;
    uint256 public valueLocked;

    mapping(address => uint256) public  myAuctions;

    mapping(address => uint256) public deposits;

    struct NFTAuction { //fix this
        address auctionCreator;
        address nftContract;
        uint256 auctionNumber;
        uint256 depositId;
        address finalBidder;
        uint256 theHighestBid;
        // bool claimed;
        // mapping(address => bool) voters;
    }

    constructor () {
    }

    function startAuction(address _contractAddress, uint256 tokenId) public {  //set a time for the auction
        auctionStarted = true;
        auctionStartTime = block.timestamp;
        auctionEndTime = (auctionStartTime + 3 minutes) ;  //base in minutes, day = 1440 minutes, 1 week = 10080
        registerAuction(_contractAddress, tokenId); 
        //get the address of  who does this 
    }

    function bid(uint256 _bid) public payable {
        require(auctionStarted == true, "Auction Hasn't started.");
        require(_bid > highestBid, "Bid is not high enough.");
        require(block.timestamp < auctionEndTime, "Auction has already ended.");
        require(_bid <= msg.value, "Bid does not match deposited value.");
        // Return previous highest bidder's deposit
        if (highestBidder != address(0)) {
            //payable(highestBidder).transfer(deposits[highestBidder]);
            uint256 bonus = calculateBonus(_bid);
           // uint256 payout = (bonus + deposits[highestBidder]);
            (bool success, ) = payable(highestBidder).call{value: bonus + deposits[highestBidder]}("");
            require(success, "payment not sent");
        }

        highestBidder = msg.sender;
        highestBid = _bid;
        deposits[msg.sender] = msg.value;
    }

    function withdrawAuctionFunds(address _token, uint256 _tokenId, uint256 _depositId) public  {
        require(msg.sender == depositors[_depositId].nftOwner, "Not Auctioneer");
        require(block.timestamp >= auctionEndTime, "Auction has not ended.");
        withdrawToken(_token, _tokenId, _depositId, highestBidder);
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Safe not sent");
    }

    // allow this contract to get permission to move from another project
    // must check to make sure this is the owner of the token
    // function setBiddingAllowed(address _contract, bool _value) external override onlyTokenOwner(_contract) {
    //     collections[_contract].biddingAllowed = _value;
    // }

    function calculateBonus(uint256 _bid) public view returns(uint256) { //should be internal
        //calculate the old bid and new bid to pay the bonus
        uint256 difference = ((_bid - highestBid) * 5 / 100);
        return difference;
    }

    //remove this?
    function willFinishAt () public view returns(uint256) {
        if(auctionStartTime == 0){
            return 0;
        } else {
        uint256 time = auctionStartTime + 60 minutes;
        return time;
        }
    }
}


