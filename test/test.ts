import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Degen Auction", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function beforeEachFunction() {
    // Contracts are deployed using the first signer/account by default
    const [owner, auctionCreator, bidder1, bidder2, bidder3 ] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MyToken");
    const nftContract = await NFT.deploy();

    const DEGEN = await ethers.getContractFactory("Auction");
    const degenContract = await DEGEN.deploy();

    return { nftContract, degenContract, owner, auctionCreator, bidder1, bidder2, bidder3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { nftContract, degenContract, owner } = await loadFixture(beforeEachFunction);
    
    //   console.log("owner: " , owner.address)
    //   console.log("nftContract: " , nftContract.address)
    //   console.log("degenContract: " , degenContract.address)
      expect(await nftContract.owner()).to.equal(owner.address);
      expect(await degenContract.owner()).to.equal(owner.address);
    });


    
    });

    describe("Mint and Register", function () {
        it("Should mint NFT", async function () {
            const { nftContract, degenContract, owner, auctionCreator } = await loadFixture(
              beforeEachFunction
            );
      
            for (let i = 0; i < 3; i++) {
              await nftContract.connect(auctionCreator).safeMint();
            }
            // console.log("Balance of auctionCreator:", await nftContract.balanceOf(auctionCreator.address))
            expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(3);

            // expect(await ethers.provider.getBalance(lock.address)).to.equal(
            //   lockedAmount
            // );
        });

        it("Should register NFT", async function () {
            const { nftContract, degenContract, owner, auctionCreator } = await loadFixture(
              beforeEachFunction
            );
      
            for (let i = 0; i < 3; i++) {
              await nftContract.connect(auctionCreator).safeMint();
            }

            await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);

            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);

            // console.log("Balance of auctionCreator:", await nftContract.balanceOf(auctionCreator.address))
            // expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(3);

            // expect(await ethers.provider.getBalance(lock.address)).to.equal(
            //   lockedAmount
            // );
        });

        it("Should allow Withdrawal after Registering", async function () {
            const { nftContract, degenContract, owner, auctionCreator } = await loadFixture(
              beforeEachFunction
            );
      
            for (let i = 0; i < 3; i++) {
              await nftContract.connect(auctionCreator).safeMint();
            }

            await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
            await degenContract.connect(auctionCreator).withdrawAuctionFunds();

            expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(3);
        });

        it("Should allow re-registering", async function () {
            const { nftContract, degenContract, owner, auctionCreator } = await loadFixture(
              beforeEachFunction
            );
      
            for (let i = 0; i < 3; i++) {
              await nftContract.connect(auctionCreator).safeMint();
            }

            await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
            await degenContract.connect(auctionCreator).withdrawAuctionFunds();
            expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(3);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
        });

        it("Should not allow doulbe registration", async function () {
            const { nftContract, degenContract, owner, auctionCreator } = await loadFixture(
              beforeEachFunction
            );
      
            await nftContract.connect(auctionCreator).safeMint();
            await nftContract.safeMint();
            
            await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
            await nftContract.setApprovalForAll(degenContract.address, true);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
            await expect(degenContract.registerNFTAuction(nftContract.address, 1)).to.be.revertedWith("Registration is already live");
            // await degenContract.connect(auctionCreator).withdrawAuctionFunds();
            // expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(1);
            // await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
            // expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
        });

    });


});


