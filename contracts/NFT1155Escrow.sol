// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
// import "@openzeppelin/contracts/utils/Counters.sol";

// interface INFT {
//     function setApprovalForAll(address operator, bool approved) external;
//     function balanceOf(address owner) external view returns (uint256);
//     function balanceOfBatch(
//         address[] calldata accounts,
//         uint256[] calldata ids
//     ) external view returns (uint256[] memory);
//     function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
//     function safeBatchTransferFrom(
//         address from,
//         address to,
//         uint256[] calldata ids,
//         uint256[] calldata amounts,
//         bytes calldata data
//     ) external;
//     function ownerOf(uint256 tokenId) external view returns (address owner);
// }

// contract NFT1155Escrow is IERC1155Receiver {
//     using Counters for Counters.Counter;
//     Counters.Counter private _depositorIdCounter;
    
//     // mapping(uint256 => address) public NFTOwner;
//     // mapping(uint256 => uint256) public tknIdOwner;

//      struct Depositor {
//         address nftOwner;
//         address nftContract;
//         uint256 tknIdOwner;
//         uint256 depositId;
//         uint256 amount;
//         // uint256 finalBid;
//          bool claimed;
//         // mapping(address => bool) voters;
//     }
    
    
//     uint256 public _tokenIdCounter = 1;
//     uint256 public tokensRecieved = 0;
//     INFT paperNft;

//     mapping(uint256 => Depositor) public  depositors;
//     //Depositor public depositor;
//    // constructor(address nftContract)  {
//     constructor()  {
//       //  _depositorIdCounter.increment();
//       //  paperNft = INFT(nftContract);
//     }

//     function registerAuction(address _contractAddress, uint256 tokenId, uint256 _amount) internal {
//         //Have to approva externally
//         INFT nftContractAddress = INFT(_contractAddress);
//         uint256 depositId = _depositorIdCounter.current();
//         _depositorIdCounter.increment();
//         depositors[depositId].nftOwner = msg.sender;
//         depositors[depositId].nftContract = _contractAddress;
//         depositors[depositId].tknIdOwner = tokenId;
//         depositors[depositId].depositId = depositId;
//         depositors[depositId].amount = _amount;
//         depositors[depositId].claimed = false;
//         nftContractAddress.safeTransferFrom(msg.sender, address(this), tokenId, _amount, "0x0");
//     }

//     function withdrawToken(INFT token, uint256 _tokenId, uint256 depositId, address _winner) public  {
//        require(depositors[depositId].claimed == false, "Already Claimed");
//        depositors[depositId].claimed = true;
//        token.safeTransferFrom(address(this), _winner, _tokenId, 1, "0x0"); //hardcoded to 1 token for now
//     }

//     function supportsInterface(bytes4 interfaceId)
//         public
//         view
//         virtual
//         override(IERC1155Receiver)
//         returns (bool)
//     {
        
//         return IERC1155Receiver.supportsInterface(interfaceId);
//     }

//     function onERC1155Received(
//         address operator,
//         address from,
//         uint256 id,
//         uint256 value,
//         bytes calldata data
//     ) external returns (bytes4) {
//         return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
//     }

//     function onERC1155BatchReceived(
//         address operator,
//         address from,
//         uint256[] calldata ids,
//         uint256[] calldata values,
//         bytes calldata data
//     ) external returns (bytes4){
//         return bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
//     }
// }

