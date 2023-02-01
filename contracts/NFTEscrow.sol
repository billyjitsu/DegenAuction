// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./Interfaces/IERC721.sol";
import "./Interfaces/IERC721Reciever.sol";


contract NFTEscrow is IERC721Receiver {
    using Counters for Counters.Counter;
    Counters.Counter private _depositorIdCounter;
    
    // mapping(uint256 => address) public NFTOwner;
    // mapping(uint256 => uint256) public tknIdOwner;

     struct Depositor {
        address nftOwner;
        address nftContract;
        uint256 tknIdOwner;
        uint256 depositId;
        // uint256 finalBid;
         bool claimed;
        // mapping(address => bool) voters;
    }
    
    
    uint256 public _tokenIdCounter = 1;
    uint256 public tokensRecieved = 0;

    mapping(uint256 => Depositor) public  depositors;
    //Depositor public depositor;
   // constructor(address nftContract)  {
    constructor()  {
      //  _depositorIdCounter.increment();
      //  paperNft = INFT(nftContract);
    }

    function registerAuction(address _contractAddress, uint256 tokenId) internal {
        //Have to approva externally
      //  INFT nftContractAddress = INFT(_contractAddress);
        uint256 depositId = _depositorIdCounter.current();
        _depositorIdCounter.increment();
        depositors[depositId].nftOwner = msg.sender;
        depositors[depositId].nftContract = _contractAddress;
        depositors[depositId].tknIdOwner = tokenId;
        depositors[depositId].depositId = depositId;
        depositors[depositId].claimed = false;
        IERC721(_contractAddress).safeTransferFrom(msg.sender, address(this), tokenId, "0x0");
    }

    function withdrawToken(address token, uint256 _tokenId, uint256 depositId, address _winner) public  {
       require(depositors[depositId].claimed == false, "Already Claimed");
       depositors[depositId].claimed = true;
       IERC721(token).safeTransferFrom(address(this), _winner, _tokenId, "0x0");
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public override returns (bytes4) {
       // require(paperNft.ownerOf(tokenId) == address(this), "MALICIOUS");
       // require(paperNft.ownerOf(tokenId) == from, "user must be the owner of the token");

        // depositor.nftOwner = from;
        // depositor.tknIdOwner = tokenId;
        ++_tokenIdCounter;
        ++tokensRecieved;
      
        return this.onERC721Received.selector;
    }  
}

