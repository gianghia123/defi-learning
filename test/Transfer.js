import { expect } from 'chai';
import hre from 'hardhat';

const { ethers, networkHelpers } = await hre.network.connect();

describe('HUSTToken Transfer test', () => {
    async function loadContractAndActor() {
        const contract = await ethers.deployContract("HustToken");
        const addressA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const addressB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        await networkHelpers.impersonateAccount(addressA);
        await networkHelpers.setBalance(addressA, ethers.parseEther("1.0"));
        const addressASigner = await ethers.getSigner(addressA);

        await networkHelpers.impersonateAccount(addressB);
        await networkHelpers.setBalance(addressB, ethers.parseEther("1.0"));
        const addressBSigner = await ethers.getSigner(addressB);

        return { contract, addressA, addressASigner, addressB, addressBSigner };
    }

    it("Should implement ERC20's transfer function correctly.", async function() {
        const { contract, addressA, addressASigner, addressB, addressBSigner } = await networkHelpers.loadFixture(loadContractAndActor);

        // Using transfer to transfer 5 gwei from A to B.
        expect(await contract.mint(addressA, ethers.parseUnits("10", "gwei"))).to.emit(contract, "Transfer");
        expect(await contract.balanceOf(addressA)).to.equal(ethers.parseUnits("10", "gwei"));
        expect(await contract.connect(addressASigner).transfer(addressB, ethers.parseUnits("5", "gwei"))).to.emit(contract, "Transfer");
        expect(await contract.balanceOf(addressA)).to.equal(ethers.parseUnits("5", "gwei"));
        expect(await contract.balanceOf(addressB)).to.equal(ethers.parseUnits("5", "gwei"));
    });

    it("Should implement ERC20's transferFrom and approve correctly.", async function() {
        const { contract, addressA, addressASigner, addressB, addressBSigner } = await networkHelpers.loadFixture(loadContractAndActor);

        await contract.mint(addressA, ethers.parseUnits("5", "gwei"));
        await contract.mint(addressB, ethers.parseUnits("5", "gwei"));
        // Using approve to approve up to 2.5 gwei transfer, and transferFrom to transfer 1.5 gwei from B to A.
        expect(await contract.connect(addressBSigner).approve(addressA, ethers.parseUnits("2.5", "gwei"))).to.emit(contract, "Approval");
        expect(await contract.allowance(addressB, addressA)).to.equal(ethers.parseUnits("2.5", "gwei"));
        expect(await contract.transferFrom(addressB, addressA, ethers.parseUnits("1.5", "gwei"))).to.emit(contract, "Transfer");
        expect(await contract.allowance(addressB, addressA)).to.equal(ethers.parseUnits("1.0", "gwei"));
        expect(await contract.balanceOf(addressA)).to.equal(ethers.parseUnits("6.5", "gwei"));
        expect(await contract.balanceOf(addressB)).to.equal(ethers.parseUnits("3.5", "gwei"));
    });

    it("Should burn all tokens in both A and B.", async function() {
        const { contract, addressA, addressASigner, addressB, addressBSigner } = await networkHelpers.loadFixture(loadContractAndActor);

        await contract.mint(addressA, ethers.parseUnits("6.5", "gwei"));
        await contract.mint(addressB, ethers.parseUnits("3.5", "gwei"));
        // Burn all the tokens.
        expect(await contract.connect(addressASigner).burn(ethers.parseUnits("6.5", "gwei"))).to.emit(contract, "Transfer");
        expect(await contract.connect(addressBSigner).burn(ethers.parseUnits("3.5", "gwei"))).to.emit(contract, "Transfer");
        expect(await contract.balanceOf(addressA)).to.equal(0);
        expect(await contract.balanceOf(addressB)).to.equal(0);
    });
})
