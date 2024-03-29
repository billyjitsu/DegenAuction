//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/utils/Strings.sol";
import "./NFTEscrow.sol";

contract Auction is NFTEscrow, Ownable {

    uint256 public highestBid;
    uint256 public auctionStartTime;
    uint256 public auctionEndTime;
    uint256 public auctionGracePeriod;
    uint256 public bonus;

    uint256 public minBid;
    uint256 public minIncrementBid;

    address public highestBidder;
    address public registryCreator;

    bool public auctionStarted;
    bool public auctionEnded;
    bool public registered;

    mapping(address => uint256) public deposits;
    //Need to tie the address to the NFT Auctions and an Id to the auctions
    mapping(address => NFTAuction) public nftauctions;
    // mapping(address => uint256) public myAuctions;  // Possible to have multiple auctions

    struct NFTAuction {
        //fix this
        address auctionCreator;
        address nftContract;
        uint256 nftTokenId;
        bool claimed;
     //  uint256 auctionNumber;
     //  address highestBidder;
     //  uint256 theHighestBid;
        
    }

     event AuctionRegistered(address creator, address _contractAddress, uint256 _tokenID, uint256 _minimumBid, uint256 _minimumIncrementBid);
     event AuctionStarted(address creator, uint256 _time);
     event NewBid(address minter, uint256 _amount, uint256 _bonus);
     event AuctionCompleted(address _winner, uint256 _amount, address _nftContract, uint256 _tokenID, address _auctioner, uint256 _payout);
     event AuctionCompletedByCommunity(address _winner, uint256 _amount, address _nftContract, uint256 _tokenID, address _auctioner, uint256 _payout, address _bountyHunter, uint256 _bounty);

    constructor() {}

    //step1 register
    function registerNFTAuction(address _contractAddress, uint256 _tokenId, uint256 _minBid, uint256 _minIncrement) public {
        //possibly make payable to stop trolling
        require(registered == false, "Registration is already live");
        nftauctions[msg.sender].auctionCreator = msg.sender;
        nftauctions[msg.sender].nftContract = _contractAddress;
        nftauctions[msg.sender].nftTokenId = _tokenId;
        nftauctions[msg.sender].claimed = false;
        // nftauctions[msg.sender].auctionNumber = 1; tbd //using counters
        
        registerAuction(_contractAddress, _tokenId);
        registryCreator = msg.sender;
        highestBidder = address(0);
        registered = true;
        minBid = _minBid;
        minIncrementBid = _minIncrement;
        auctionGracePeriod = block.timestamp + 300;

        //need timer to override this is they slacking

        emit AuctionRegistered(msg.sender, _contractAddress, _tokenId, minBid, minIncrementBid);
    }

    function startAuction(uint256 _time) public {
        //set a max time limit
        //time is in seconds
        require(nftauctions[msg.sender].auctionCreator == msg.sender, "Not Auction Creator.");
        require(auctionStarted == false, "Auction already started.");
        require(nftauctions[msg.sender].claimed == false, "No NFT to auction");
        require(_time >= 300 && _time <= 600, "Time must be between 5 and 10 minutes");
        auctionStarted = true;
        auctionStartTime = block.timestamp;
        auctionEndTime = (auctionStartTime + _time); 
        //possible time extender

        emit AuctionStarted(msg.sender, _time);
    }

    function bid() public payable {
        if(highestBidder == address(0)){
            require(msg.value >= minBid, "Bid is not high enough");
        }
        require(auctionStarted == true, "Auction Hasn't started.");
        require(block.timestamp < auctionEndTime, "Auction has already ended");
        require(msg.value >= highestBid + minIncrementBid, "New Bid is not high enough");   // possibly check for minimum increment bid and lowest bid

        // Return previous highest bidder's deposit
        if (highestBidder != address(0)) {
            bonus = calculateBonus(msg.value);
            (bool success, ) = payable(highestBidder).call{ value: bonus + deposits[highestBidder] }("");
            require(success, "payment not sent");
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        deposits[msg.sender] = msg.value;

        //last minute bids adds another minute to auction
        if(block.timestamp >= auctionEndTime - 60) { 
            auctionEndTime = (auctionEndTime + 60); 
        }

        emit NewBid(msg.sender, msg.value, bonus);
    }

    function calculateBonus(uint256 _bid) internal view returns (uint256) {
        // 5% bonus
        uint256 difference = (((_bid - highestBid) * 5) / 100);
        return difference;
    }

    function calculateNewMinBid() external view returns (uint256) {
        uint256 nextMinBid = (highestBid + minIncrementBid);
        return nextMinBid;
    }

    function willFinishAt() public view returns (uint256) {
        if (auctionStartTime == 0) {
            return 0;
        } else {
            return auctionEndTime;
        }
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdrawAuctionFunds() external {
        require(msg.sender == depositors[msg.sender].nftOwner, "Not Auctioneer");
        require(block.timestamp >= auctionEndTime, "Auction has not ended");
        if (highestBidder == address(0)) {
            withdrawToken(nftauctions[msg.sender].nftContract, nftauctions[msg.sender].nftTokenId,/* _depositId, */ nftauctions[msg.sender].auctionCreator);
            nftauctions[msg.sender].claimed = true;
        } else {
            withdrawToken(nftauctions[msg.sender].nftContract, nftauctions[msg.sender].nftTokenId,/* _depositId, */ highestBidder);
            nftauctions[msg.sender].claimed = true;
        }
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Payment not sent");

        //reset auction status
        auctionStarted = false;
        registered = false;
        registryCreator = address(0);
        auctionEndTime = 0;

        emit AuctionCompleted(highestBidder, highestBid, nftauctions[msg.sender].nftContract, nftauctions[msg.sender].nftTokenId, registryCreator, address(this).balance);
    }

    function communityAssistance() external { 
        require(block.timestamp >= auctionGracePeriod, "Auction in grace period");
        require(block.timestamp >= (auctionEndTime + 1 minutes), "Must wait to assist");
        if (highestBidder == address(0)) {
            withdrawToken(nftauctions[registryCreator].nftContract, nftauctions[registryCreator].nftTokenId,/* _depositId, */ nftauctions[registryCreator].auctionCreator);
            nftauctions[registryCreator].claimed = true;
        } else {
            withdrawToken(nftauctions[registryCreator].nftContract, nftauctions[registryCreator].nftTokenId,/* _depositId, */ highestBidder);
            nftauctions[registryCreator].claimed = true;
        }

        uint256 withdrawAmount_10 = (address(this).balance) * 10/100;  //10% tax
        //check if statment if there is balance in the contract
         if(address(this).balance > 0) {
            (bool complete, ) = payable(msg.sender).call{value: withdrawAmount_10}("");
            require(complete, "bounty funds not sent");
            (bool success, ) = payable(registryCreator).call{value: address(this).balance}("");
            require(success, "funds not sent");
         }

        //reset auction status
        auctionStarted = false;
        registered = false;
        registryCreator = address(0);
        auctionEndTime = 0;
        // timeout user?

        emit AuctionCompletedByCommunity(highestBidder, highestBid, nftauctions[registryCreator].nftContract, nftauctions[registryCreator].nftTokenId, registryCreator, address(this).balance, msg.sender, withdrawAmount_10);
    }
    
}
