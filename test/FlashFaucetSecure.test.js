const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlashFaucetSecure (Production)", function () {
  let token;
  let faucet;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy FlashToken
    const FlashToken = await ethers.getContractFactory("contracts/FlashToken.sol:FlashToken");
    token = await FlashToken.deploy("Tether USD", "USDT");
    await token.waitForDeployment();

    // Deploy FlashFaucetSecure
    const FlashFaucetSecure = await ethers.getContractFactory("contracts/FlashFaucetSecure.sol:FlashFaucetSecure");
    faucet = await FlashFaucetSecure.deploy(await token.getAddress());
    await faucet.waitForDeployment();

    // Link faucet to token
    await token.setFaucetContract(await faucet.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await faucet.owner()).to.equal(owner.address);
    });

    it("Should set correct token address", async function () {
      expect(await faucet.token()).to.equal(await token.getAddress());
    });

    it("Should set initial configuration", async function () {
      expect(await faucet.requestCooldown()).to.equal(300); // 5 minutes
      expect(await faucet.maxRequestAmount()).to.equal(ethers.parseUnits("1000", 6));
      expect(await faucet.dailyCapPerUser()).to.equal(ethers.parseUnits("5000", 6));
    });
  });

  describe("Request Flash", function () {
    it("Should mint tokens to requester", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.connect(user1).requestFlash(amount);
      
      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(amount);
    });

    it("Should enforce cooldown period", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.connect(user1).requestFlash(amount);
      
      await expect(
        faucet.connect(user1).requestFlash(amount)
      ).to.be.revertedWith("FlashFaucetSecure: request too soon");
    });

    it("Should enforce daily cap", async function () {
      const dailyCap = await faucet.dailyCapPerUser();
      const maxRequest = await faucet.maxRequestAmount();
      
      // Request up to daily cap (5 requests of 1000 each = 5000)
      for (let i = 0; i < 5; i++) {
        await faucet.connect(user1).requestFlash(maxRequest);
        if (i < 4) {
          // Advance time past cooldown (except after last request)
          await ethers.provider.send("evm_increaseTime", [301]);
          await ethers.provider.send("evm_mine", []);
        }
      }
      
      // Now try another request (would exceed daily cap of 5000)
      await ethers.provider.send("evm_increaseTime", [301]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(
        faucet.connect(user1).requestFlash(maxRequest)
      ).to.be.revertedWith("FlashFaucetSecure: exceeds daily cap");
    });

    it("Should reject blacklisted addresses", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.setBlacklist(user1.address, true);
      
      await expect(
        faucet.connect(user1).requestFlash(amount)
      ).to.be.revertedWith("FlashFaucetSecure: address is blacklisted");
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      await faucet.pause();
      expect(await faucet.paused()).to.equal(true);
    });

    it("Should prevent requests when paused", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.pause();
      
      await expect(
        faucet.connect(user1).requestFlash(amount)
      ).to.be.revertedWithCustomError(faucet, "EnforcedPause");
    });
  });

  describe("User Info", function () {
    it("Should return correct user info", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.connect(user1).requestFlash(amount);
      
      const [timeUntilNext, claimedToday, remainingCap, requestCount] = 
        await faucet.getUserInfo(user1.address);
      
      expect(requestCount).to.equal(1);
      expect(claimedToday).to.equal(amount);
    });
  });

  describe("Configuration", function () {
    it("Should update configuration by owner", async function () {
      const newCooldown = 600;
      const newMaxAmount = ethers.parseUnits("2000", 6);
      const newDailyCap = ethers.parseUnits("10000", 6);
      
      await faucet.updateConfiguration(newCooldown, newMaxAmount, newDailyCap);
      
      expect(await faucet.requestCooldown()).to.equal(newCooldown);
      expect(await faucet.maxRequestAmount()).to.equal(newMaxAmount);
      expect(await faucet.dailyCapPerUser()).to.equal(newDailyCap);
    });
  });

  describe("Blacklist", function () {
    it("Should allow owner to blacklist addresses", async function () {
      await faucet.setBlacklist(user1.address, true);
      expect(await faucet.isBlacklisted(user1.address)).to.equal(true);
    });

    it("Should allow owner to unblacklist addresses", async function () {
      await faucet.setBlacklist(user1.address, true);
      await faucet.setBlacklist(user1.address, false);
      expect(await faucet.isBlacklisted(user1.address)).to.equal(false);
    });
  });
});

