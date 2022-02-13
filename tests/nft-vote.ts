import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import assert from "assert";
import { NftVote } from "../target/types/nft_vote";
import { createMint, createMintAndVault } from "@project-serum/common";

describe("nft-vote", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftVote as Program<NftVote>;

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

    const [mintPubkey, tokenAccount] = await createMintAndVault(provider, new anchor.BN(1), owner.publicKey, 0);
    const [voteRecordPubkey, voteRecordBump] = await anchor.web3.PublicKey.findProgramAddress(
      [mintPubkey.toBuffer(), proposal.publicKey.toBuffer()],
      program.programId
    );
    const optionIdx = 1;
    await program.rpc.vote(voteRecordBump, optionIdx, {
      accounts: {
        owner: owner.publicKey,
        tokenAccount: tokenAccount,
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
    assert.ok(proposalAccountInfo.createdAt > new anchor.BN(0));

    const voteRecord = await program.account.voteRecord.fetch(voteRecordPubkey);
    assert.equal(voteRecord.proposal.toBase58(), proposal.publicKey.toBase58());
    assert.equal(voteRecord.mint.toBase58(), mintPubkey.toBase58());
    assert.equal(voteRecord.optionIdx, optionIdx);
    assert.ok(voteRecord.createdAt > new anchor.BN(0));
    assert.ok(
      voteRecord.createdAt <= timeAfterVoting,
      `createdAt: ${voteRecord.createdAt}, timeAfterVoting: ${timeAfterVoting}`
    );
  });
});
