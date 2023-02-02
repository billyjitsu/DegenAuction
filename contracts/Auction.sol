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

    mapping(address => NFTAuction) public  nftauctions;

    struct NFTAuction { //fix this
        address auctionCreator;
        address nftContract;
        uint256 auctionNumber;
        uint256 nftTokenId;
        address finalBidder;
        uint256 theHighestBid;
        bool claimed;
        // mapping(address => bool) voters;
    }

    constructor () {
    }
    //step1 register
    function registerNFTAuction (address _contractAddress, uint256 tokenId) public {
        //make sure they don't have an auction already
        //make sure there isn't an auction ongoing (would erase existing) - keep mapping of auctions for future
        nftauctions[msg.sender].auctionCreator = msg.sender;
        nftauctions[msg.sender].nftContract = _contractAddress;
        // nftauctions[msg.sender].auctionNumber = 1; tbd
        nftauctions[msg.sender].nftTokenId = tokenId; //tbd best way
        nftauctions[msg.sender].claimed = false;
        registerAuction(_contractAddress, tokenId); 
        // add a register to let people know a register 

    }

    function startAuction(uint256 _time) public {  //set a time for the auction CONVERT Seconds to MINUTES 3 mins = 180
        require(nftauctions[msg.sender].auctionCreator == msg.sender, "Not Auction Creator.");
        require(auctionStarted == false, "Auction already started.");
        require(nftauctions[msg.sender].claimed = false, "No NFT to auction");
        auctionStarted = true;
        auctionStartTime = block.timestamp;
        auctionEndTime = (auctionStartTime + _time /* minutes */) ;  //base in minutes, day = 1440 minutes, 1 week = 10080
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

    function withdrawAuctionFunds( /*address _token, uint256 _tokenId*/ /*, uint256 _depositId */) public  {
        require(msg.sender == depositors[msg.sender].nftOwner, "Not Auctioneer");
        require(block.timestamp >= auctionEndTime, "Auction has not ended.");
        if(highestBidder == address(0)) {
            withdrawToken(nftauctions[msg.sender].nftContract, nftauctions[msg.sender].nftTokenId, /* _depositId, */ nftauctions[msg.sender].auctionCreator);
        }else {
        withdrawToken(nftauctions[msg.sender].nftContract, nftauctions[msg.sender].nftTokenId, /* _depositId, */ highestBidder);
        }
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Safe not sent");
        //reset auction status
        auctionStarted = false;
        // remove the registration
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


