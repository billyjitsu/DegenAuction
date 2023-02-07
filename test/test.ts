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
    const [owner, auctionCreator, bidder1, bidder2, bidder3, auctionCreator2 ] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MyToken");
    const nftContract = await NFT.deploy();

    const DEGEN = await ethers.getContractFactory("Auction");
    const degenContract = await DEGEN.deploy();

    const currentTime = await time.latest();

    return { nftContract, degenContract, owner, auctionCreator, bidder1, bidder2, bidder3, currentTime, auctionCreator2 };
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

        it("Should not allow double registration", async function () {
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

  describe("Auctions and Bids", function () { 
      it("Should allow bids", async function () {
        const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime} = await loadFixture(
          beforeEachFunction
        );
  
        await nftContract.connect(auctionCreator).safeMint();

        await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
        await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
        expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
        await degenContract.connect(auctionCreator).startAuction(60);
        
      //  console.log("Bidder1 balance before:", await ethers.provider.getBalance(bidder1.address))
        await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      //  console.log("Bidder1 balance after:", await ethers.provider.getBalance(bidder1.address))
        await time.increase(10);
        await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
        await time.increase(20);
        let bonusEth = await degenContract.bonus();
        let stringedBonus = ethers.utils.formatEther(bonusEth);
        console.log("StringedBonus:", stringedBonus);
        let bonusCalc = ethers.utils.parseEther("0.1");
       // console.log("Reward:", await degenContract.bonus())
       // console.log("Bidder1 balance outbid:", await ethers.provider.getBalance(bidder1.address))

        // await degenContract.connect(auctionCreator).withdrawAuctionFunds();
        // expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(3);
        // await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
        // expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
    });

    it("Should not allow double auctions", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();
      await nftContract.connect(auctionCreator2).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(60);

      await nftContract.connect(auctionCreator2).setApprovalForAll(degenContract.address, true);
      await expect(degenContract.connect(auctionCreator2).registerNFTAuction(nftContract.address, 1)).to.be.revertedWith("Registration is already live");
    });

    it("Should allow auctioneer to withdraw until auction finished", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();
      await nftContract.connect(auctionCreator2).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(20);
     // console.log("Auction start:", currentTime);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      await time.increase(15);
      await expect(degenContract.connect(auctionCreator).withdrawAuctionFunds()).to.be.revertedWith("Auction has not ended");
      let newTime = await time.increase(35);
     // console.log("Auction time now:", newTime);
     
      await degenContract.connect(auctionCreator).withdrawAuctionFunds()
      await expect(degenContract.connect(auctionCreator).withdrawAuctionFunds()).to.be.revertedWith("Already Claimed");
    });

    it("No bidding after auction has ended", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(20);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      await time.increase(15);
      await expect(degenContract.connect(auctionCreator).withdrawAuctionFunds()).to.be.revertedWith("Auction has not ended");
      await time.increase(35);
      await expect(degenContract.connect(bidder3).bid({value: ethers.utils.parseEther("21")})).to.be.revertedWith("Auction has already ended");
      await expect(degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("20")})).to.be.revertedWith("Auction has already ended");
     
      await degenContract.connect(auctionCreator).withdrawAuctionFunds()
      await expect(degenContract.connect(auctionCreator).withdrawAuctionFunds()).to.be.revertedWith("Already Claimed");
    });

    it("Should allow auction after finished", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();
      await nftContract.connect(auctionCreator2).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(20);
     // console.log("Auction start:", currentTime);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      let newTime = await time.increase(35);
     // console.log("Auction time now:", newTime);
     
      await degenContract.connect(auctionCreator).withdrawAuctionFunds()

      await nftContract.connect(auctionCreator2).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator2).registerNFTAuction(nftContract.address, 1);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      expect(await nftContract.ownerOf(1)).to.equal(degenContract.address);
    });

    it("Only Auctioneer Can withdraw funds", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();
      await nftContract.connect(auctionCreator2).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(20);
     // console.log("Auction start:", currentTime);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      await time.increase(35);
     // console.log("Auction time now:", newTime);
     
      await expect(degenContract.connect(bidder1).withdrawAuctionFunds()).to.be.revertedWith("Not Auctioneer");
      await expect(degenContract.connect(bidder2).withdrawAuctionFunds()).to.be.revertedWith("Not Auctioneer");
      await expect(degenContract.connect(owner).withdrawAuctionFunds()).to.be.revertedWith("Not Auctioneer");
      await degenContract.connect(auctionCreator).withdrawAuctionFunds();
    });
  });


});


