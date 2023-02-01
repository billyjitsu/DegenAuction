// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Interfaces/IERC1155.sol";
import "./Interfaces/IERC1155Reciever.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT1155Escrow is IERC1155Receiver {
    using Counters for Counters.Counter;
    Counters.Counter private _depositorIdCounter;
    
    // mapping(uint256 => address) public NFTOwner;
    // mapping(uint256 => uint256) public tknIdOwner;

     struct Depositor {
        address nftOwner;
        address nftContract;
        uint256 tknIdOwner;
        uint256 depositId;
        uint256 amount;
        // uint256 finalBid;
         bool claimed;
        // mapping(address => bool) voters;
    }
    
    
    uint256 public _tokenIdCounter = 1;
    uint256 public tokensRecieved = 0;
    // INFT paperNft;

    mapping(uint256 => Depositor) public  depositors;
  
    constructor()  {
      //  _depositorIdCounter.increment();
      //  paperNft = INFT(nftContract);
    }

    function registerAuction(address _contractAddress, uint256 tokenId, uint256 _amount) internal {
        //Have to approva externally
       // INFT nftContractAddress = INFT(_contractAddress);
        uint256 depositId = _depositorIdCounter.current();
        _depositorIdCounter.increment();
        depositors[depositId].nftOwner = msg.sender;
        depositors[depositId].nftContract = _contractAddress;
        depositors[depositId].tknIdOwner = tokenId;
        depositors[depositId].depositId = depositId;
        depositors[depositId].amount = _amount;
        depositors[depositId].claimed = false;
        IERC1155(_contractAddress).safeTransferFrom(msg.sender, address(this), tokenId, _amount, "0x0");
    }

    function withdrawToken(address token, uint256 _tokenId, uint256 depositId, address _winner) public  {
       require(depositors[depositId].claimed == false, "Already Claimed");
       depositors[depositId].claimed = true;
       IERC1155(token).safeTransferFrom(address(this), _winner, _tokenId, 1, "0x0"); //hardcoded to 1 token for now
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4){
        return bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
    }
}

