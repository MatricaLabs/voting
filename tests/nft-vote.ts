import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import assert from "assert";
import { NftVote } from "../target/types/nft_vote";
import { createMint, createMintAndVault } from "@project-serum/common";

describe("nft-vote", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftVote as Program<NftVote>;

  // HpWLog4FwZpKcm3qR27iZXN59spcXH497SK4vD9VdwS7
  const admin = anchor.web3.Keypair.fromSecretKey(
    Uint8Array.from([
      31, 225, 56, 138, 123, 153, 16, 149, 61, 0, 3, 14, 95, 81, 153, 119, 129, 9, 132, 112, 241, 138, 177, 2, 158, 41,
      145, 43, 20, 155, 255, 255, 249, 230, 119, 32, 190, 223, 88, 19, 197, 110, 225, 71, 124, 76, 116, 162, 5, 17, 8,
      54, 156, 246, 122, 186, 159, 44, 225, 233, 253, 179, 118, 40,
    ])
  );

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "processed"
    );
  });

  it("init nft", async () => {
    const mintPubkey = await createMint(provider);
    const [nftInfoPubkey, nftInfoBump] = await anchor.web3.PublicKey.findProgramAddress(
      [mintPubkey.toBuffer()],
      program.programId
    );
    const weight = 1;

    await program.rpc.addNft(nftInfoBump, weight, {
      accounts: {
        admin: admin.publicKey,
        mint: mintPubkey,
        nftInfo: nftInfoPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [admin],
    });

    const nftInfo = await program.account.nftInfo.fetch(nftInfoPubkey);
    assert.ok(nftInfo.weight === weight);
  });

  it("propose", async () => {
    const proposer = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(proposer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "processed"
    );

    const proposal = anchor.web3.Keypair.generate();
    const title = "test title?";
    const content = "this is line1\nthis line 2";
    const options = ["option1", "option2"];

    await program.rpc.propose(title, content, options, {
      accounts: {
        proposer: proposer.publicKey,
        proposal: proposal.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [proposer, proposal],
    });
    let timeAfterProposing = new anchor.BN(new Date().getTime() / 1000);

    const proposalAccountInfo = await program.account.proposal.fetch(proposal.publicKey);
    assert.equal(proposalAccountInfo.proposer.toBase58(), proposer.publicKey.toBase58());
    assert.equal(proposalAccountInfo.title, title);
    assert.equal(proposalAccountInfo.content, content);
    assert.deepEqual(proposalAccountInfo.options, options);
    assert.deepEqual(proposalAccountInfo.votes, Array(options.length).fill(new anchor.BN(Array(8).fill(0), "le")));
    assert.ok(proposalAccountInfo.createdAt > new anchor.BN(0));
    assert.ok(
      proposalAccountInfo.createdAt <= timeAfterProposing,
      `createdAt: ${proposalAccountInfo.createdAt}, timeAfterProposing: ${timeAfterProposing}`
    );
  });

  it("vote", async () => {
    const owner = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(owner.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "processed"
    );
    const [mintPubkey, tokenAccount] = await createMintAndVault(provider, new anchor.BN(1), owner.publicKey, 0);
    const [nftInfoPubkey, nftInfoBump] = await anchor.web3.PublicKey.findProgramAddress(
      [mintPubkey.toBuffer()],
      program.programId
    );
    const weight = 1;
    await program.rpc.addNft(nftInfoBump, weight, {
      accounts: {
        admin: admin.publicKey,
        mint: mintPubkey,
        nftInfo: nftInfoPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [admin],
    });

    const proposer = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(proposer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "processed"
    );
    const proposal = anchor.web3.Keypair.generate();
    const title = "test title?";
    const content = "this is line1\nthis line 2";
    const options = ["option1", "option2"];
    await program.rpc.propose(title, content, options, {
      accounts: {
        proposer: proposer.publicKey,
        proposal: proposal.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [proposer, proposal],
    });

    const [voteRecordPubkey, voteRecordBump] = await anchor.web3.PublicKey.findProgramAddress(
      [mintPubkey.toBuffer(), proposal.publicKey.toBuffer()],
      program.programId
    );
    const optionIdx = 1;
    await program.rpc.vote(voteRecordBump, optionIdx, {
      accounts: {
        owner: owner.publicKey,
        tokenAccount: tokenAccount,
        nftInfo: nftInfoPubkey,
        proposal: proposal.publicKey,
        voteRecord: voteRecordPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [owner],
    });
    const timeAfterVoting = new anchor.BN(new Date().getTime() / 1000);

    const proposalAccountInfo = await program.account.proposal.fetch(proposal.publicKey);
    assert.equal(proposalAccountInfo.proposer.toBase58(), proposer.publicKey.toBase58());
    assert.equal(proposalAccountInfo.title, title);
    assert.equal(proposalAccountInfo.content, content);
    assert.deepEqual(proposalAccountInfo.options, options);
    assert.deepEqual(proposalAccountInfo.votes, [
      new anchor.BN(Array(8).fill(0), "le"),
      new anchor.BN([1, 0, 0, 0, 0, 0, 0, 0], "le"),
    ]);
    assert.ok(proposalAccountInfo.createdAt > new anchor.BN(0));

    const voteRecord = await program.account.voteRecord.fetch(voteRecordPubkey);
    assert.equal(voteRecord.optionIdx, optionIdx);
    assert.ok(voteRecord.createdAt > new anchor.BN(0));
    assert.ok(
      voteRecord.createdAt <= timeAfterVoting,
      `createdAt: ${voteRecord.createdAt}, timeAfterVoting: ${timeAfterVoting}`
    );
  });
});
