const {expect, use} = require('chai');
const {accounts, contract} = require('@openzeppelin/test-environment');
const {constants, BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const FootballCard = contract.fromArtifact('FootballCard');
const {keccak256} = require('web3-utils')

describe('Contract operation', function(){
    
    const [owner, user1, user2] = accounts;
    const nftName = 'Football';
    const symbol = 'FB';
    const baseUrl = 'https://olivex.ai/';

    beforeEach(async function(){
        this.contract = await FootballCard.new(nftName, symbol, baseUrl, {from: owner});
    });

    const tokenId1 = 123;
    const tokenId2 = 234;
    const tokenId3 = 345;
    const zeroAddress = constants.ZERO_ADDRESS;
    const emptyAdminRole = constants.ZERO_BYTES32;

    const MINTER_ROLE = keccak256("MINTER_ROLE");
    const PAUSER_ROLE = keccak256("PAUSER_ROLE");    
    const DEFAULT_ADMIN_ROLE = '0x00';

    
    describe('General',  function(){
        it('get correct name', async function(){
            expect(this.contract.name() == nftName);
        });
        it('get correct symbol', async function(){
            expect(this.contract.symbol() == symbol);
        });
        it('get correct token url', async function(){
            await this.contract.mint(owner, tokenId1, {from: owner});
            expect((await this.contract.tokenURI(tokenId1)).toString()).to.equal(baseUrl + tokenId1);
        });
        it('get correct owner of token', async function(){
            await this.contract.mint(user1, tokenId1, {from: owner});
            expect((await this.contract.ownerOf(tokenId1)).toString()).to.equal(user1);
        });
        it('cannot get owner of token by nonexistent tokenId', async function(){
            await this.contract.mint(user1, tokenId1, {from: owner});
            await expectRevert(this.contract.ownerOf(tokenId2), 'ERC721: owner query for nonexistent token');
        });
        it('get correct balance of token for owner', async function(){
            await this.contract.batchMint([user1, user1], [tokenId1, tokenId2], {from: owner});
            expect((await this.contract.balanceOf(user1)).toString()).to.equal('2');
        });
        it('get correct balance of token for owner own 0 token', async function(){
            expect(await this.contract.balanceOf(user1)).to.be.bignumber.equal(new BN(0));
        });
        it('get correct balance of token for zero address', async function(){
            await this.contract.batchMint([user1, user1], [tokenId1, tokenId2], {from: owner});
            await expectRevert(this.contract.balanceOf(zeroAddress), 'ERC721: balance query for the zero address');
        });
        it('get correct total supply', async function(){
            await this.contract.batchMint([user1, user2, user1], [tokenId1, tokenId2, tokenId3], {from: owner});
            expect((await this.contract.totalSupply()).toString()).to.equal('3');
        });
        it('get correct token id by index', async function(){
            await this.contract.batchMint([user1, user2, user1], [tokenId1, tokenId2, tokenId3], {from: owner});
            expect(await this.contract.tokenByIndex(0)).to.be.bignumber.equal(new BN(tokenId1));
        });
        it('cannot use index which out of range for tokenByIndex', async function(){
            await this.contract.batchMint([user1, user2, user1], [tokenId1, tokenId2, tokenId3], {from: owner});
            await expectRevert(this.contract.tokenByIndex(10), 'ERC721Enumerable: global index out of bounds');
        });
        it('cannot use negative index for tokenByIndex', async function(){
            await this.contract.batchMint([user1, user2, user1], [tokenId1, tokenId2, tokenId3], {from: owner});
            await expectRevert(this.contract.tokenByIndex(-2), 'value out-of-bounds');
        });
        it('get tokenId of owner by index', async function(){
            await this.contract.batchMint([user1, user1, user1], [tokenId1, tokenId2, tokenId3], {from: owner});
            expect(await this.contract.tokenOfOwnerByIndex(user1, 1)).to.be.bignumber.equal(new BN(tokenId2));
        });
        it('cannot get tokenId of owner by index which out of range', async function(){
            await this.contract.batchMint([user1, user1, user1], [tokenId1, tokenId2, tokenId3], {from: owner});
            await expectRevert(this.contract.tokenOfOwnerByIndex(user1, 4), 'ERC721Enumerable: owner index out of bounds');
        });
        it('cannot get tokenId of owner by index which is negative', async function(){
            await this.contract.batchMint([user1, user1, user1], [tokenId1, tokenId2, tokenId3], {from: owner});
            await expectRevert(this.contract.tokenOfOwnerByIndex(user1, -1), 'value out-of-bounds');
        });
        it('cannot get tokenId of zeroAddress', async function(){
            await expectRevert(this.contract.tokenOfOwnerByIndex(zeroAddress, 0), 'ERC721: balance query for the zero address');
        });
        it('set base url', async function(){
            await this.contract.mint(owner, tokenId1, {from: owner});
            const url = 'http://olivex.ai/other/';
            await this.contract.setBaseTokenURI(url, {from: owner});
            expect((await this.contract.tokenURI(tokenId1)).toString()).to.equal(url + tokenId1);
        });
        it('support ERC721', async function(){
            expect(await this.contract.supportsInterface('0x80ac58cd')).to.be.true;
        });
        it('support ERC721Enumerable', async function(){
            expect(await this.contract.supportsInterface('0x780e9d63')).to.be.true;
        });
        it('support ERC721Metadata', async function(){
            expect(await this.contract.supportsInterface('0x5b5e139f')).to.be.true;
        });
    });
    describe('Mint token', function(){
        it('invork Transfer event when mint token', async function () {
            const receipt =  await this.contract.mint(user1, tokenId3, { from: owner });
            expectEvent(receipt, 'Transfer');
        });
        it('mint nft to minter', async function () {
            await this.contract.mint(owner, tokenId1, { from: owner });
            expect((await this.contract.ownerOf(tokenId1)).toString()).to.equal(owner);
        });
        it('mint nft to user1', async function () {
            await this.contract.mint(user1, tokenId1, { from: owner });
            expect((await this.contract.ownerOf(tokenId1)).toString()).to.equal(user1);
        });
        it('mint multiple nft to user1', async function () {
            await this.contract.batchMint([user1, user1, user1, user1, user1, user1, user1, user1, user1, user1], [1,2,3,4,5,6,7,8,9,10], { from: owner });
            expect((await this.contract.balanceOf(user1)).toString()).to.equal('10');
        });
        it('cannot mint multiple nft if number of user not equal to token', async function () {
            await expectRevert(this.contract.batchMint([user1], [1,2], {from: owner }),'FootballCard: must have same length for user and token');
        });
        it('cannot mint multiple nft if contains same token', async function () {
            await expectRevert(this.contract.batchMint([user1, user1], [1,1], {from: owner }),'ERC721: token already minted');
        });
        it('cannot mint multiple nft if contains exist token', async function () {
            await this.contract.mint(user1, 1, { from: owner });
            await expectRevert(this.contract.batchMint([user1, user1], [1, 2], {from: owner }),'ERC721: token already minted');
        });
        it('cannot mint same token', async function () {
            await this.contract.mint(user1, tokenId1, {from: owner});
            await expectRevert(this.contract.mint(user1, tokenId1, {from: owner}), 'ERC721: token already minted');
        });
        it('cannot mint without minter role', async function () {
            await expectRevert(this.contract.mint(user1, tokenId2, {from: user1}), 'FootballCard: must have minter role to mint.');
        });
        it('cannot mint multiple token without minter role', async function () {
            await expectRevert(this.contract.batchMint([user1, user1], [tokenId2, tokenId3], {from: user1}), 'FootballCard: must have minter role to mint.');
        });
        it('cannot mint to zore address', async function () {
            await expectRevert(this.contract.mint(zeroAddress, tokenId2, {from: owner}), 'ERC721: mint to the zero address');
        });
        it('cannot mint multiple token to zore address', async function () {
            await expectRevert(this.contract.batchMint([zeroAddress], [tokenId2], {from: owner}), 'ERC721: mint to the zero address');
        });
    });
    describe('Transfer token',  function(){
        beforeEach(async function(){
            await this.contract.mint(owner, tokenId1, {from: owner});
            await this.contract.mint(user1, tokenId2, {from: owner});
        });
        it('invork Transfer event when transfer token', async function () {
            const receipt =  await this.contract.transferFrom(owner, user1, tokenId1, { from: owner });
            expectEvent(receipt, 'Transfer');
        });
        it('tranfer token from token owner', async function(){
            await this.contract.transferFrom(user1, user2, tokenId2, {from: user1});
            expect((await this.contract.ownerOf(tokenId2)).toString()).to.equal(user2);
        });
        it('safe transfer token from token owner', async function(){
            await this.contract.safeTransferFrom(user1, user2, tokenId2, {from: user1});
            expect((await this.contract.ownerOf(tokenId2)).toString()).to.equal(user2);
        });
        it('transfer token from approved user', async function(){
            await this.contract.approve(user1, tokenId1, {from: owner});
            await this.contract.transferFrom(owner, user2, tokenId1, {from: user1});
            expect((await this.contract.ownerOf(tokenId1)).toString()).to.equal(user2);
        });
        it('transfer token from operator', async function(){
            await this.contract.setApprovalForAll(user1, true, {from: owner});
            await this.contract.transferFrom(owner, user2, tokenId1, {from: user1});
            expect((await this.contract.ownerOf(tokenId1)).toString()).to.equal(user2);
        });
        it('cannot transfer token from non token owner nor approved', async function(){
            await expectRevert(this.contract.transferFrom(user1, user2, tokenId2, {from: owner}), 'ERC721: transfer caller is not owner nor approved');
        });
        it('cannot transfer token from token owner to zero address', async function(){
            await expectRevert(this.contract.transferFrom(owner, zeroAddress, tokenId1, {from: owner}), 'ERC721: transfer to the zero address');
        });
        it('cannot transfer non-existed token', async function(){
            await expectRevert(this.contract.transferFrom(owner, user1, tokenId3, {from: owner}), 'ERC721: operator query for nonexistent token.')
        });
        //TODO: safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)
    });
    describe('Approve token',  function(){
        beforeEach(async function(){
            await this.contract.mint(owner, tokenId1, {from: owner});
            await this.contract.mint(owner, tokenId2, {from: owner});
        });
        it('invork Approval event when approve token', async function () {
            const receipt =  await this.contract.approve(user1, tokenId1, { from: owner });
            expectEvent(receipt, 'Approval');
        });
        it('approve token from token owner', async function(){
            await this.contract.approve(user1, tokenId1, {from: owner});
            expect((await this.contract.getApproved(tokenId1)).toString()).to.equal(user1);
        });
        it('cannot approve token to self', async function(){
            await expectRevert(this.contract.approve(owner, tokenId1, {from: owner}), "ERC721: approval to current owner");
        });
        it('cannot approve token from token approved user', async function(){
            await this.contract.approve(user1, tokenId1, {from: owner});
            await expectRevert(this.contract.approve(user2, tokenId1, {from: user1}), 'ERC721: approve caller is not owner nor approved for all');
        });
        it('approve token from token operator', async function(){
            await this.contract.setApprovalForAll(user1, true, {from: owner});
            await this.contract.approve(user2, tokenId1, {from: user1});
            expect((await this.contract.getApproved(tokenId1)).toString()).to.equal(user2);
        });
        it('approve token to token operator from token operator', async function(){
            await this.contract.setApprovalForAll(user1, true, {from: owner});
            await this.contract.approve(user1, tokenId1, {from: user1});
            expect((await this.contract.getApproved(tokenId1)).toString()).to.equal(user1);
        });
        it('cannot approve non-existed token', async function(){
            await expectRevert(this.contract.approve(user1, tokenId3, {from: owner}), 'ERC721: owner query for nonexistent token.')
        });
        it('approved user equal to last approved user', async function(){
            await this.contract.approve(user1, tokenId1, {from: owner});
            await this.contract.approve(user2, tokenId1, {from: owner});
            expect((await this.contract.getApproved(tokenId1)).toString()).to.equal(user2);
        });
        it('approval reset after transfer token', async function(){
            await this.contract.approve(user1, tokenId1, {from: owner});
            await this.contract.transferFrom(owner, user2, tokenId1, {from: owner});
            expect((await this.contract.getApproved(tokenId1)).toString()).to.equal(zeroAddress);
        });
    });
    describe('Operator (setApprovalForAll as true)', async function(){
        it('invork ApprovalForAll event when approve operator', async function () {
            const receipt =  await this.contract.setApprovalForAll(user1, true, { from: owner });
            expectEvent(receipt, 'ApprovalForAll');
        });
        it('setApprovalForAll true by caller', async function(){
            await this.contract.setApprovalForAll(user1, true, {from: user2});
            expect(await this.contract.isApprovedForAll(user2, user1)).to.be.true;
        });
        it('setApprovalForAll false by caller', async function(){
            await this.contract.setApprovalForAll(user1, false, {from: user2});
            expect(await this.contract.isApprovedForAll(user2, user1)).to.be.false;
        });
        it('can have multiple operators', async function(){
            await this.contract.setApprovalForAll(user1, true, {from: owner});
            await this.contract.setApprovalForAll(user2, true, {from: owner});
            expect(await this.contract.isApprovedForAll(owner, user1)).to.be.true &&
            expect(await this.contract.isApprovedForAll(owner, user2)).to.be.true;
        });
        it('cannot setApprovalForAll to caller', async function(){
            await expectRevert(this.contract.setApprovalForAll(user1, true, {from: user1}), 'ERC721: approve to caller')
        });
    });
    describe('AccessControl', async function(){
        it('get corrent role member count', async function (){
            await this.contract.grantRole(MINTER_ROLE, user1, {from: owner});
            expect((await this.contract.getRoleMemberCount(MINTER_ROLE)).toString()).to.equal('2');
        });
        it('get corrent role member', async function (){
            expect((await this.contract.getRoleMember(MINTER_ROLE, 0, {from: owner})).toString()).to.equal(owner);
        });
        it('invork RoleGranted event when role granted', async function () {
            const receipt = await this.contract.grantRole(MINTER_ROLE, user1, { from: owner });
            expectEvent(receipt, 'RoleGranted');
        });
        it('invork RoleRevoked event when role revoked', async function () {
            await this.contract.grantRole(MINTER_ROLE, user1, { from: owner });
            const receipt = await this.contract.revokeRole(MINTER_ROLE, user1, { from: owner });
            expectEvent(receipt, 'RoleRevoked');
        });
        it('invork RoleRevoked event when role renounce', async function () {
            await this.contract.grantRole(MINTER_ROLE, user1, { from: owner });
            const receipt = await this.contract.renounceRole(MINTER_ROLE, user1, { from: user1 });
            expectEvent(receipt, 'RoleRevoked');
        });
        it('no minter admin role', async function(){
            expect((await this.contract.getRoleAdmin(MINTER_ROLE)).toString()).to.equal(emptyAdminRole);
        });
        it('no pauser admin role', async function(){
            expect((await this.contract.getRoleAdmin(PAUSER_ROLE)).toString()).to.equal(emptyAdminRole);
        });
        it('no default admin admin role', async function(){
            expect((await this.contract.getRoleAdmin(DEFAULT_ADMIN_ROLE)).toString()).to.equal(emptyAdminRole);
        });
        it('deployer is default minter role', async function(){
            expect(await this.contract.hasRole(MINTER_ROLE, owner)).to.be.true;
        });
        it('deployer is default pauser role', async function(){
            expect(await this.contract.hasRole(PAUSER_ROLE, owner)).to.be.true;
        });
        it('deployer is default default admin role', async function(){
            expect(await this.contract.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.true;
        });
        it('admin role can grant admin role', async function(){
            await this.contract.grantRole(DEFAULT_ADMIN_ROLE, user1, {from: owner});
            expect(await this.contract.hasRole(DEFAULT_ADMIN_ROLE, user1)).to.be.true;
        });
        it('admin role can grant minter role', async function(){
            await this.contract.grantRole(DEFAULT_ADMIN_ROLE, user1, {from: owner});
            await this.contract.grantRole(MINTER_ROLE, user2, {from: user1});
            expect(await this.contract.hasRole(MINTER_ROLE, user2)).to.be.true;
        });
        it('admin role can grant pauser role', async function(){
            await this.contract.grantRole(DEFAULT_ADMIN_ROLE, user1, {from: owner});
            await this.contract.grantRole(PAUSER_ROLE, user2, {from: user1});
            expect(await this.contract.hasRole(PAUSER_ROLE, user2)).to.be.true;
        });
        it('admin role can revoke pauser role', async function(){
            await this.contract.grantRole(DEFAULT_ADMIN_ROLE, user1, {from: owner});
            await this.contract.revokeRole(PAUSER_ROLE, owner, {from: user1});
            expect(await this.contract.hasRole(PAUSER_ROLE, owner)).to.be.false;
        });
        it('admin role can revoke minter role', async function(){
            await this.contract.grantRole(DEFAULT_ADMIN_ROLE, user1, {from: owner});
            await this.contract.revokeRole(MINTER_ROLE, owner, {from: user1});
            expect(await this.contract.hasRole(MINTER_ROLE, owner)).to.be.false;
        });
        it('admin role can revoke other admin role', async function(){
            await this.contract.grantRole(DEFAULT_ADMIN_ROLE, user1, {from: owner});
            await this.contract.revokeRole(DEFAULT_ADMIN_ROLE, owner, {from: user1});
            expect(await this.contract.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.false;
        });
        it('admin role can revoke self admin role', async function(){
            await this.contract.revokeRole(DEFAULT_ADMIN_ROLE, owner, {from: owner});
            expect(await this.contract.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.false;
        });
        it('renounce admin role by self', async function(){
            await this.contract.renounceRole(DEFAULT_ADMIN_ROLE, owner, {from: owner});
            expect(await this.contract.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.be.false;
        });
        it('renounce minter role by self', async function(){
            await this.contract.grantRole(MINTER_ROLE, user1, {from: owner});
            await this.contract.renounceRole(MINTER_ROLE, user1, {from: user1});
            expect(await this.contract.hasRole(MINTER_ROLE, user1)).to.be.false;
        });
        it('renounce pauser role by self', async function(){
            await this.contract.grantRole(PAUSER_ROLE, user1, {from: owner});
            await this.contract.renounceRole(PAUSER_ROLE, user1, {from: user1});
            expect(await this.contract.hasRole(PAUSER_ROLE, user1)).to.be.false;
        });
        it('cannot renounce role by others even admin', async function(){
            await this.contract.grantRole(DEFAULT_ADMIN_ROLE, user1, {from: owner});
            await expectRevert(this.contract.renounceRole(DEFAULT_ADMIN_ROLE, user1, {from: owner}),'AccessControl: can only renounce roles for self');
        });
        it('cannot set base url without admin role', async function(){
            const url = 'http://olivex.ai/other/';
            expectRevert(await this.contract.setBaseTokenURI(url, {from: owner}), 'FootballCard: must have admin role to change base url');
        });
    });
    describe('Pauser role', async function(){
        beforeEach(async function(){
            await this.contract.mint(owner, tokenId1, {from: owner});
            await this.contract.mint(owner, tokenId2, {from: owner});
        });
        it('invork Paused event when pause', async function () {
            const receipt =  await this.contract.pause({ from: owner });
            expectEvent(receipt, 'Paused');
        });
        it('invoke Unpaused event when unpause', async function () {
            await this.contract.pause({ from: owner });
            const receipt =  await this.contract.unpause({ from: owner });
            expectEvent(receipt, 'Unpaused');
        });
        it('pauser role can pause', async function (){
            await this.contract.grantRole(PAUSER_ROLE, user1, {from: owner});
            const receipt = await this.contract.pause({from: user1});
            expectEvent(receipt, 'Paused');
        });
        it('cannot pause without pauser role', async function (){
            await expectRevert(this.contract.pause({from: user1}), 'FootballCard: must have pauser role to pause');
        });
        it('cannot transfer token during contract paused', async function () {
            await this.contract.pause({from: owner });
            await expectRevert(this.contract.transferFrom(owner, user1, tokenId1, {from: owner}), 'ERC721Pausable: token transfer while paused');
        });
        it('cannot mint token during contract paused', async function () { 
            await this.contract.pause({from: owner });
            await expectRevert(this.contract.mint(owner, tokenId3, {from: owner}), 'ERC721Pausable: token transfer while paused');
        });
        it('pauser role can unpause', async function (){
            await this.contract.grantRole(PAUSER_ROLE, user1, {from: owner});
            await this.contract.pause({from:owner});
            const receipt = await this.contract.unpause({from: user1});
            expectEvent(receipt, 'Unpaused');
        });
        it('cannot unpause without pauser role', async function (){
            await this.contract.pause({from:owner});
            await expectRevert(this.contract.unpause({from: user1}), 'FootballCard: must have pauser role to unpause');
        });
        it('cannot pause when paused', async function (){
            await this.contract.pause({from:owner});
            await expectRevert(this.contract.pause({from:owner}), 'Pausable: paused');
        });
        it('cannot unpause when contract not paused', async function (){
            await expectRevert(this.contract.unpause({from:owner}), 'Pausable: not paused');
        });
    });
    describe('Minter role', async function(){
        it('minter role can mint', async function (){
            await this.contract.grantRole(MINTER_ROLE, user1, {from: owner});
            await this.contract.mint(user1, tokenId1, {from:user1});
            expect((await this.contract.ownerOf(tokenId1)).toString()).to.equal(user1);
        });
        it( 'cannot mint without minter role', async function (){
            await expectRevert(this.contract.mint(user1, tokenId1, {from: user1}), 'FootballCard: must have minter role to mint');
        });
    });
});