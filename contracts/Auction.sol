//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./NFTEscrow.sol";

contract Auction is NFTEscrow, Ownable {

    uint256 public highestBid;
    uint256 public auctionStartTime;
    uint256 public auctionEndTime;
    uint256 public valueLocked;
    uint256 public bonus;

    address public highestBidder;
    address public registryCreator;

    bool auctionStarted;
    bool auctionEnded;
    bool registered;

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

    // event CubeMinted(address minter, uint256 _amount);
    // event CubeClaimed(address minter, uint256 _amount);
    // event CubeBroken(address minter, uint256 _amount);
    // event DaoCubeCreated(address minter, uint256 [] _daoTokens, uint256 [] _amount); 
    // event AdminMinted(address [] reciever, uint256 _amount, uint256 _id);

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

       // emit CubeMinted(msg.sender, amount);
    }

    function startAuction(uint256 _time) public {
        //set a max time limit
        //time is in seconds
        require(nftauctions[msg.sender].auctionCreator == msg.sender, "Not Auction Creator.");
        require(auctionStarted == false, "Auction already started.");
        require(nftauctions[msg.sender].claimed == false, "No NFT to auction");
        auctionStarted = true;
        auctionStartTime = block.timestamp;
        auctionEndTime = (auctionStartTime + _time); 
        //minimum bid  
        //minimum increment bid
        //possible time extender
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
    }
    
}
