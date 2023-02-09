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
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    const minBid = ethers.utils.parseEther("1");
    const minIncBid = ethers.utils.parseEther("0.5");


    return { nftContract, degenContract, owner, auctionCreator, bidder1, bidder2, bidder3, currentTime, auctionCreator2, zeroAddress, minBid, minIncBid };
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
            const { nftContract, degenContract, owner, auctionCreator, minBid, minIncBid } = await loadFixture(
              beforeEachFunction
            );
      
            for (let i = 0; i < 3; i++) {
              await nftContract.connect(auctionCreator).safeMint();
            }

            await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);

            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
            expect(await degenContract.registryCreator()).to.equal(auctionCreator.address);

            
        });

        it("Should allow Withdrawal after Registering", async function () {
            const { nftContract, degenContract, owner, auctionCreator, zeroAddress, minBid, minIncBid } = await loadFixture(
              beforeEachFunction
            );
      
            for (let i = 0; i < 3; i++) {
              await nftContract.connect(auctionCreator).safeMint();
            }

          

            await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
            await degenContract.connect(auctionCreator).withdrawAuctionFunds();

            expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(3);
            expect(await degenContract.registryCreator()).to.equal(zeroAddress);
            
        });

        it("Should allow re-registering", async function () {
            const { nftContract, degenContract, owner, auctionCreator, zeroAddress, minBid, minIncBid } = await loadFixture(
              beforeEachFunction
            );
      
            for (let i = 0; i < 3; i++) {
              await nftContract.connect(auctionCreator).safeMint();
            }

            await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
            expect(await degenContract.registryCreator()).to.equal(auctionCreator.address);
            await degenContract.connect(auctionCreator).withdrawAuctionFunds();
            expect(await degenContract.registryCreator()).to.equal(zeroAddress);
            expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(3);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
            expect(await degenContract.registryCreator()).to.equal(auctionCreator.address);
            await degenContract.connect(auctionCreator).withdrawAuctionFunds();
            expect(await degenContract.registryCreator()).to.equal(zeroAddress);
        });

        it("Should not allow double registration", async function () {
            const { nftContract, degenContract, owner, auctionCreator, minBid, minIncBid } = await loadFixture(
              beforeEachFunction
            );
      
            await nftContract.connect(auctionCreator).safeMint();
            await nftContract.safeMint();
            
            await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
            await nftContract.setApprovalForAll(degenContract.address, true);
            await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
            expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
            await expect(degenContract.registerNFTAuction(nftContract.address, 1, minBid, minIncBid)).to.be.revertedWith("Registration is already live");
        });

        it("Should allow Community to force return on a stalled registration", async function () {
          const { nftContract, degenContract, owner, bidder3, auctionCreator, zeroAddress, minBid, minIncBid } = await loadFixture(
            beforeEachFunction
          );
    
          for (let i = 0; i < 3; i++) {
            await nftContract.connect(auctionCreator).safeMint();
          }

          await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
          await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
          expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
    
          await time.increase(61);
          await expect(degenContract.connect(bidder3).communityAssistance()).to.be.revertedWith("Auction in grace period");

          await time.increase(290);
          await degenContract.connect(bidder3).communityAssistance()

          expect(await nftContract.balanceOf(auctionCreator.address)).to.equal(3);
          expect(await degenContract.registryCreator()).to.equal(zeroAddress);
          
      });

  });

  describe("Auctions and Bids when live", function () { 

    it("Should not allow low or high auction times", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, minBid, minIncBid} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await expect(degenContract.connect(auctionCreator).startAuction(30)).to.be.revertedWith("Time must be between 5 and 10 minutes");
      await expect(degenContract.connect(auctionCreator).startAuction(700)).to.be.revertedWith("Time must be between 5 and 10 minutes");
      degenContract.connect(auctionCreator).startAuction(400)  
  });

    it("Should allow bids", async function () {
        const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, minBid, minIncBid} = await loadFixture(
          beforeEachFunction
        );
  
        await nftContract.connect(auctionCreator).safeMint();

        await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
        await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
        expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
        await degenContract.connect(auctionCreator).startAuction(300);
        
      //  console.log("Balance of auctioneer before:", await ethers.provider.getBalance(auctionCreator.address))
        await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
        //console.log("Bidder1 balance after:", await ethers.provider.getBalance(bidder1.address))
        await time.increase(100);
        await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
        await time.increase(200);
        let bonusEth = await degenContract.bonus();
        let stringedBonus = ethers.utils.formatEther(bonusEth);
       // console.log("StringedBonus:", stringedBonus);
        let bonusCalc = ethers.utils.parseEther("0.1");
        let contractBalance = await ethers.provider.getBalance(degenContract.address);
//        console.log("Contract Balance:", ethers.utils.formatEther(contractBalance));
        await time.increase(60);
        await degenContract.connect(auctionCreator).withdrawAuctionFunds();
    //    contractBalance = await ethers.provider.getBalance(degenContract.address);
    //    console.log("Contract Balance after:", ethers.utils.formatEther(contractBalance));
   //     console.log("Balance of auctioneer after:", await ethers.provider.getBalance(auctionCreator.address))

    });

    it("Should not allow low bids or below min bids", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, minBid, minIncBid} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(300);
      
   
      await expect(degenContract.connect(bidder1).bid({value: ethers.utils.parseEther(".5")})).to.be.revertedWith("Bid is not high enough");
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("20")}); 
      // let nextBid = await degenContract.calculateNewMinBid();
      // console.log("Next Min Bid Should be:", ethers.utils.formatEther(nextBid)); 
      await expect(degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20.2")})).to.be.revertedWith("New Bid is not high enough");
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20.5")});
      // nextBid = await degenContract.calculateNewMinBid();
      // console.log("Next Min Bid Should be:", ethers.utils.formatEther(nextBid)); 
      await expect(degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("20.5")})).to.be.revertedWith("New Bid is not high enough")
      await expect(degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("20.9")})).to.be.revertedWith("New Bid is not high enough")
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("25")});
      // nextBid = await degenContract.calculateNewMinBid();
      // console.log("Next Min Bid Should be:", ethers.utils.formatEther(nextBid)); 
      await expect(degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("2")})).to.be.revertedWith("New Bid is not high enough")
      await expect(degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("25.4")})).to.be.revertedWith("New Bid is not high enough")
      await degenContract.connect(bidder3).bid({value: ethers.utils.parseEther("28")});
      // nextBid = await degenContract.calculateNewMinBid();
      // console.log("Next Min Bid Should be:", ethers.utils.formatEther(nextBid)); 

      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("29")});
      await time.increase(600);
      await degenContract.connect(auctionCreator).withdrawAuctionFunds();

    });

    it("Should not allow double auctions", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2, minBid, minIncBid} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();
      await nftContract.connect(auctionCreator2).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(300);

      await nftContract.connect(auctionCreator2).setApprovalForAll(degenContract.address, true);
      await expect(degenContract.connect(auctionCreator2).registerNFTAuction(nftContract.address, 1, minBid, minIncBid)).to.be.revertedWith("Registration is already live");
    });

    it("Should not allow auctioneer to withdraw until auction finished", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2, minBid, minIncBid} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();
      await nftContract.connect(auctionCreator2).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(300);
     // console.log("Auction start:", currentTime);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      await time.increase(150);
      await expect(degenContract.connect(auctionCreator).withdrawAuctionFunds()).to.be.revertedWith("Auction has not ended");
      let newTime = await time.increase(350);
     // console.log("Auction time now:", newTime);
     
      await degenContract.connect(auctionCreator).withdrawAuctionFunds()
      await expect(degenContract.connect(auctionCreator).withdrawAuctionFunds()).to.be.revertedWith("Already Claimed");
    });

    it("No bidding after auction has ended", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2, minBid, minIncBid} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(300);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      await time.increase(150);
      await expect(degenContract.connect(auctionCreator).withdrawAuctionFunds()).to.be.revertedWith("Auction has not ended");
      await time.increase(350);
      await expect(degenContract.connect(bidder3).bid({value: ethers.utils.parseEther("21")})).to.be.revertedWith("Auction has already ended");
      await expect(degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("20")})).to.be.revertedWith("Auction has already ended");
     
      await degenContract.connect(auctionCreator).withdrawAuctionFunds()
      await expect(degenContract.connect(auctionCreator).withdrawAuctionFunds()).to.be.revertedWith("Already Claimed");
    });

    it("Should allow new auction after finished", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2, minBid, minIncBid} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();
      await nftContract.connect(auctionCreator2).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(300);
     // console.log("Auction start:", currentTime);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      let newTime = await time.increase(350);
     // console.log("Auction time now:", newTime);
     
      await degenContract.connect(auctionCreator).withdrawAuctionFunds()

      await nftContract.connect(auctionCreator2).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator2).registerNFTAuction(nftContract.address, 1, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      expect(await nftContract.ownerOf(1)).to.equal(degenContract.address);
    });

    it("Only Auctioneer Can withdraw funds", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2, minBid, minIncBid} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();
      await nftContract.connect(auctionCreator2).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(300);
     // console.log("Auction start:", currentTime);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      await time.increase(350);
     // console.log("Auction time now:", newTime);
     
      await expect(degenContract.connect(bidder1).withdrawAuctionFunds()).to.be.revertedWith("Not Auctioneer");
      await expect(degenContract.connect(bidder2).withdrawAuctionFunds()).to.be.revertedWith("Not Auctioneer");
      await expect(degenContract.connect(owner).withdrawAuctionFunds()).to.be.revertedWith("Not Auctioneer");
      await degenContract.connect(auctionCreator).withdrawAuctionFunds();
    });

    it("Only admin can help after time limit", async function () {
      const { nftContract, degenContract, owner, auctionCreator,  bidder1, bidder2, bidder3, currentTime, auctionCreator2, minBid, minIncBid} = await loadFixture(
        beforeEachFunction
      );

      await nftContract.connect(auctionCreator).safeMint();

      await nftContract.connect(auctionCreator).setApprovalForAll(degenContract.address, true);
      await degenContract.connect(auctionCreator).registerNFTAuction(nftContract.address, 0, minBid, minIncBid);
      expect(await nftContract.balanceOf(degenContract.address)).to.equal(1);
      await degenContract.connect(auctionCreator).startAuction(300);
     // console.log("Auction start:", currentTime);
      await degenContract.connect(bidder1).bid({value: ethers.utils.parseEther("1")});
      await degenContract.connect(bidder2).bid({value: ethers.utils.parseEther("20")});
      await time.increase(300);
     // console.log("Auction time now:", newTime);
      await expect(degenContract.communityAssistance()).to.be.revertedWith("Must wait to assist");
      await time.increase(60);
      await degenContract.communityAssistance();
      expect(await nftContract.balanceOf(bidder2.address)).to.equal(1);
      expect(await nftContract.ownerOf(0)).to.equal(bidder2.address);

      //console.log("Balance of auctioneer after:", await ethers.provider.getBalance(auctionCreator.address))
      //console.log("Balance of owner after:", await ethers.provider.getBalance(owner.address))
      // await expect(degenContract.connect(owner).withdrawAuctionFunds()).to.be.revertedWith("Not Auctioneer");
      // await degenContract.connect(auctionCreator).withdrawAuctionFunds();
    });
  });


});


