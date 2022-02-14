import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import assert from "assert";
import { NftVote } from "../target/types/nft_vote";
import { createMintAndVault } from "@project-serum/common";

describe("nft-vote", () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftVote as Program<NftVote>;

  describe("propose", () => {
    it("a normal proposal", async () => {
      const proposer = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(proposer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
        "processed"
      );

      const proposal = anchor.web3.Keypair.generate();
      const title = "test title?";
      const content = "this is line1\nthis line 2";
      const options = ["option1", "option2"];
      const endedAt = new anchor.BN(new Date().getTime() / 1000 - 86400);

      await propose({
        proposer: proposer,
        proposal: proposal,
        title: title,
        content: content,
        options: options,
        endedAt: endedAt,
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

    it("a proposal which title is too long", async () => {
      try {
        await propose({
          title: `${"a too long title".repeat(20) + "!"}`,
        });
        assert.ok(false);
      } catch (err) {
        assert.equal(err.toString(), "title should less than or equals to 100");
      }
    });
  });

  describe("vote", () => {
    it("a normal vote", async () => {
      const proposalPubkey = await propose();

      const optionIdx = 1;
      const { mintPubkey, voteRecordPubkey } = await vote(proposalPubkey, optionIdx);
      const timeAfterVoting = new anchor.BN(new Date().getTime() / 1000);

      const voteRecord = await program.account.voteRecord.fetch(voteRecordPubkey);
      assert.equal(voteRecord.proposal.toBase58(), proposalPubkey.toBase58());
      assert.equal(voteRecord.mint.toBase58(), mintPubkey.toBase58());
      assert.equal(voteRecord.optionIdx, optionIdx);
      assert.ok(voteRecord.createdAt > new anchor.BN(0));
      assert.ok(
        voteRecord.createdAt <= timeAfterVoting,
        `createdAt: ${voteRecord.createdAt}, timeAfterVoting: ${timeAfterVoting}`
      );
    });

    it("use same mint to vote twice", async () => {
      const proposalPubkey = await propose();

      const owner = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(owner.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
        "processed"
      );
      const [mintPubkey, tokenAccount] = await createMintAndVault(provider, new anchor.BN(1), owner.publicKey, 0);

      try {
        await vote(proposalPubkey, 1, { owner: owner, mint: mintPubkey, tokenAccount: tokenAccount });
        await vote(proposalPubkey, 1, { owner: owner, mint: mintPubkey, tokenAccount: tokenAccount });
        assert.ok(false);
      } catch (err) {
        //TODO check error
      }
    });

    it("vote to a closed proposal", async () => {
      const proposalPubkey = await propose({ endedAt: new anchor.BN(new Date().getTime() / 1000 - 86400) });

      try {
        await vote(proposalPubkey, 1);
        assert.ok(false);
      } catch (err) {
        assert.equal(err.toString(), "proposal voting has closed");
      }
    });
  });

  const vote = async (
    proposal: anchor.web3.PublicKey,
    optionIdx: number,
    param?: {
      owner: anchor.web3.Keypair;
      mint: anchor.web3.PublicKey;
      tokenAccount: anchor.web3.PublicKey;
    }
  ): Promise<{ voteRecordPubkey: anchor.web3.PublicKey; mintPubkey: anchor.web3.PublicKey }> => {
    // prepare param
    if (!param) {
      const owner = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(owner.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
        "processed"
      );
      const [mintPubkey, tokenAccount] = await createMintAndVault(provider, new anchor.BN(1), owner.publicKey, 0);
      param = { owner: owner, mint: mintPubkey, tokenAccount: tokenAccount };
    }

    const [voteRecordPubkey] = await anchor.web3.PublicKey.findProgramAddress(
      [param.mint.toBuffer(), proposal.toBuffer()],
      program.programId
    );
    await program.rpc.vote(optionIdx, {
      accounts: {
        owner: param.owner.publicKey,
        tokenAccount: param.tokenAccount,
        proposal: proposal,
        voteRecord: voteRecordPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [param.owner],
    });

    return { voteRecordPubkey: voteRecordPubkey, mintPubkey: param.mint };
  };

  const propose = async (param?: {
    proposer?: anchor.web3.Keypair;
    proposal?: anchor.web3.Keypair;
    title?: string;
    content?: string;
    options?: Array<string>;
    endedAt?: anchor.BN;
  }): Promise<anchor.web3.PublicKey> => {
    // prepare param
    param = param || {};
    if (!param.proposer) {
      param.proposer = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(param.proposer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
        "processed"
      );
    }
    param.proposal = param.proposal || anchor.web3.Keypair.generate();
    param.title = param.title || "test title?";
    param.content = param.content || "this is line1\nthis line 2";
    param.options = param.options || ["options1", "options2"];
    param.endedAt = param.endedAt || new anchor.BN(new Date().getTime() / 1000 + 86400);

    // propose
    await program.rpc.propose(param.title, param.content, param.options, param.endedAt, {
      accounts: {
        proposer: param.proposer.publicKey,
        proposal: param.proposal.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [param.proposer, param.proposal],
    });

    // return the proposal key
    return param.proposal.publicKey;
  };
});
