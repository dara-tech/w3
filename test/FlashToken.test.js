const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FlashToken (Production)", function () {
  let token;
  let owner;
  let faucet;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    // Deploy FlashToken
    const FlashToken = await ethers.getContractFactory("contracts/FlashToken.sol:FlashToken");
    token = await FlashToken.deploy("Flash USDT", "FUSDT");
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
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should set the right name, symbol, and decimals", async function () {
      expect(await token.name()).to.equal("Flash USDT");
      expect(await token.symbol()).to.equal("FUSDT");
      expect(await token.decimals()).to.equal(6);
    });

    it("Should have max supply set", async function () {
      const maxSupply = await token.MAX_SUPPLY();
      expect(maxSupply).to.equal(ethers.parseUnits("1000000000", 6));
    });

    it("Should start with zero total supply", async function () {
      expect(await token.totalSupply()).to.equal(0);
    });

    it("Should set faucet contract", async function () {
      expect(await token.faucetContract()).to.equal(await faucet.getAddress());
    });
  });

  describe("Minting", function () {
    it("Should allow faucet to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.connect(user1).requestFlash(amount);
      
      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(amount);
    });

    it("Should revert when non-faucet tries to mint", async function () {
      const amount = ethers.parseUnits("100", 6);
      await expect(token.mint(user1.address, amount)).to.be.revertedWith(
        "FlashToken: only faucet can mint"
      );
    });

    it("Should enforce max supply", async function () {
      const maxSupply = await token.MAX_SUPPLY();
      const exceedAmount = maxSupply + ethers.parseUnits("1", 6);
      
      await expect(faucet.requestFlash(exceedAmount)).to.be.reverted;
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      await token.pause();
      expect(await token.paused()).to.equal(true);
    });

    it("Should prevent transfers when paused", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.requestFlash(amount);
      await token.pause();
      
      await expect(
        token.transfer(user1.address, amount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should allow owner to unpause", async function () {
      await token.pause();
      await token.unpause();
      expect(await token.paused()).to.equal(false);
    });
  });

  describe("Burn", function () {
    it("Should allow user to burn their tokens", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.requestFlash(amount);
      
      await token.burn(amount);
      const balance = await token.balanceOf(user1.address);
      expect(balance).to.equal(0);
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens normally", async function () {
      const amount = ethers.parseUnits("100", 6);
      await faucet.connect(user1).requestFlash(amount);
      
      const [, , receiver] = await ethers.getSigners();
      await token.connect(user1).transfer(receiver.address, amount);
      
      const balance = await token.balanceOf(receiver.address);
      expect(balance).to.equal(amount);
    });
  });
});

