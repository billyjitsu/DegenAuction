//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./NFTEscrow.sol";

contract Auction is NFTEscrow, Ownable {

    uint256 public highestBid;
    uint256 public auctionStartTime;
    uint256 public auctionEndTime;
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
     //   address highestBidder;
     //   uint256 theHighestBid;
        
    }

     event AuctionRegistered(address creator, address _contractAddress, uint256 _amount);
     event AuctionStarted(address creator, uint256 _time);
     event NewBid(address minter, uint256 _amount, uint256 _bonus);
     event AuctionCompleted(address _winner, uint256 _amount, address _nftContract, uint256 _tokenID, address _auctioner, uint256 _payout);
     event AuctionCompletedByCommunity(address _winner, uint256 _amount, address _nftContract, uint256 _tokenID, address _auctioner, uint256 _payout, address _bountyHunter, uint256 _bounty);

    constructor() {}

    //step1 register
    function registerNFTAuction(address _contractAddress, uint256 _tokenId) public {
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

        //need timer to override this is they slacking

        emit AuctionRegistered(msg.sender, _contractAddress, _tokenId);
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
        //minimum bid  
        //minimum increment bid
        //possible time extender

        emit AuctionStarted(msg.sender, _time);
    }

    function bid() public payable {
        require(auctionStarted == true, "Auction Hasn't started.");
        require(block.timestamp < auctionEndTime, "Auction has already ended");
        require(msg.value > highestBid, "Bid is not high enough");   // possibly check for minimum increment bid and lowest bid
        // Return previous highest bidder's deposit
        if (highestBidder != address(0)) {
            bonus = calculateBonus(msg.value);
            (bool success, ) = payable(highestBidder).call{ value: bonus + deposits[highestBidder] }("");
            require(success, "payment not sent");
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        deposits[msg.sender] = msg.value;

        emit NewBid(msg.sender, msg.value, bonus);
    }

    function calculateBonus(uint256 _bid) internal view returns (uint256) {
        // 5% bonus
        uint256 difference = (((_bid - highestBid) * 5) / 100);
        return difference;
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

    function withdrawAuctionFunds() public{
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

        emit AuctionCompleted(highestBidder, highestBid, nftauctions[msg.sender].nftContract, nftauctions[msg.sender].nftTokenId, registryCreator, address(this).balance);
    }

    function adminAssistance() external onlyOwner {  //change to the community and incentivise
        // need to get the address of the auctioner without message sender
      // require(msg.sender == depositors[msg.sender].nftOwner, "Not Auctioneer");
        require(block.timestamp >= (auctionEndTime + 1 minutes), "Admin must wait to assist");
        if (highestBidder == address(0)) {
            withdrawToken(nftauctions[registryCreator].nftContract, nftauctions[registryCreator].nftTokenId,/* _depositId, */ nftauctions[registryCreator].auctionCreator);
            nftauctions[registryCreator].claimed = true;
        } else {
            withdrawToken(nftauctions[registryCreator].nftContract, nftauctions[registryCreator].nftTokenId,/* _depositId, */ highestBidder);
            nftauctions[registryCreator].claimed = true;
        }
        //tax fee for running the transaction for auctioneer
         uint256 withdrawAmount_10 = (address(this).balance) * 10/100;
         (bool complete, ) = payable(msg.sender).call{value: withdrawAmount_10}("");

        (bool success, ) = payable(registryCreator).call{value: address(this).balance}("");
        require(success, "funds not sent");
        //reset auction status
        auctionStarted = false;
        registered = false;
        registryCreator = address(0);

        emit AuctionCompletedByCommunity(highestBidder, highestBid, nftauctions[registryCreator].nftContract, nftauctions[registryCreator].nftTokenId, registryCreator, address(this).balance, msg.sender, withdrawAmount_10);
    }
    
}
