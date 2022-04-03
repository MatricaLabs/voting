import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import assert from "assert";
import { NftVote } from "../target/types/nft_vote";
import { createMintAndVault } from "@project-serum/common";
import { actions, programs } from "@metaplex/js";
import { Creator, MetadataDataData } from "@metaplex-foundation/mpl-token-metadata";
const {
  metadata: { Metadata },
} = programs;

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

      const clientId = 2;
      const proposal = anchor.web3.Keypair.generate();
      const title = "test title?";
      const content = "this is line1\nthis line 2";
      const options = ["option1", "option2"];
      const endedAt = new anchor.BN(new Date().getTime() / 1000 - 86400);
      const allowedCreators = [];

      await propose({
        clientId: clientId,
        proposer: proposer,
        proposal: proposal,
        title: title,
        content: content,
        options: options,
        endedAt: endedAt,
      });
      let timeAfterProposing = new anchor.BN(new Date().getTime() / 1000);

      const proposalAccountInfo = await program.account.proposal.fetch(proposal.publicKey);
      assert.equal(proposalAccountInfo.clientId, clientId);
      assert.equal(proposalAccountInfo.proposer.toBase58(), proposer.publicKey.toBase58());
      assert.equal(proposalAccountInfo.title, title);
      assert.equal(proposalAccountInfo.content, content);
      assert.deepEqual(proposalAccountInfo.options, options);
      assert.deepEqual(proposalAccountInfo.allowedCreators, allowedCreators);
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

    it("propose with one creator", async () => {
      const proposer = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(proposer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
        "processed"
      );

      const clientId = 100;
      const proposal = anchor.web3.Keypair.generate();
      const title = "test title?";
      const content = "this is line1\nthis line 2";
      const options = ["option1", "option2"];
      const endedAt = new anchor.BN(new Date().getTime() / 1000 - 86400);
      const randomCreator = anchor.web3.Keypair.generate().publicKey;
      const allowedCreators = [randomCreator];

      await propose({
        clientId: clientId,
        proposer: proposer,
        proposal: proposal,
        title: title,
        content: content,
        options: options,
        endedAt: endedAt,
        allowedCreators: allowedCreators,
      });
      let timeAfterProposing = new anchor.BN(new Date().getTime() / 1000);

      const proposalAccountInfo = await program.account.proposal.fetch(proposal.publicKey);
      assert.equal(proposalAccountInfo.clientId, clientId);
      assert.equal(proposalAccountInfo.proposer.toBase58(), proposer.publicKey.toBase58());
      assert.equal(proposalAccountInfo.title, title);
      assert.equal(proposalAccountInfo.content, content);
      assert.deepEqual(proposalAccountInfo.options, options);
      assert.deepEqual(proposalAccountInfo.allowedCreators, allowedCreators);
      assert.ok(proposalAccountInfo.createdAt > new anchor.BN(0));
      assert.ok(
        proposalAccountInfo.createdAt <= timeAfterProposing,
        `createdAt: ${proposalAccountInfo.createdAt}, timeAfterProposing: ${timeAfterProposing}`
      );
    });

    it("propose with two creator", async () => {
      const proposer = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(proposer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
        "processed"
      );

      const clientId = 1000;
      const proposal = anchor.web3.Keypair.generate();
      const title = "test title?";
      const content = "this is line1\nthis line 2";
      const options = ["option1", "option2"];
      const endedAt = new anchor.BN(new Date().getTime() / 1000 - 86400);
      const randomCreator1 = anchor.web3.Keypair.generate().publicKey;
      const randomCreator2 = anchor.web3.Keypair.generate().publicKey;
      const allowedCreators = [randomCreator1, randomCreator2];

      await propose({
        clientId: clientId,
        proposer: proposer,
        proposal: proposal,
        title: title,
        content: content,
        options: options,
        endedAt: endedAt,
        allowedCreators: allowedCreators,
      });
      let timeAfterProposing = new anchor.BN(new Date().getTime() / 1000);

      const proposalAccountInfo = await program.account.proposal.fetch(proposal.publicKey);
      assert.equal(proposalAccountInfo.clientId, clientId);
      assert.equal(proposalAccountInfo.proposer.toBase58(), proposer.publicKey.toBase58());
      assert.equal(proposalAccountInfo.title, title);
      assert.equal(proposalAccountInfo.content, content);
      assert.deepEqual(proposalAccountInfo.options, options);
      assert.deepEqual(proposalAccountInfo.allowedCreators, allowedCreators);
      assert.ok(proposalAccountInfo.createdAt > new anchor.BN(0));
      assert.ok(
        proposalAccountInfo.createdAt <= timeAfterProposing,
        `createdAt: ${proposalAccountInfo.createdAt}, timeAfterProposing: ${timeAfterProposing}`
      );
    });
  });

  describe("vote", () => {
    it("vote to a unlimited proposal with a random NFT without creators", async () => {
      const proposalPubkey = await propose();

      let owner = await newKeypairWithLamports(10 * anchor.web3.LAMPORTS_PER_SOL);
      let { mintPubkey: mintPubkey, tokenAccountPubkey: tokenAccountPubkey } = await mintNFT(owner);

      const optionIdx = 1;

      const voteRecordPubkey = await vote(proposalPubkey, optionIdx, {
        owner: owner,
        mint: mintPubkey,
        tokenAccount: tokenAccountPubkey,
      });
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

    it("vote to a unlimited proposal with a random NFT with creators", async () => {
      const proposalPubkey = await propose();

      let owner = await newKeypairWithLamports(10 * anchor.web3.LAMPORTS_PER_SOL);
      let { mintPubkey: mintPubkey, tokenAccountPubkey: tokenAccountPubkey } = await mintNFT(owner, [
        new Creator({
          address: provider.wallet.publicKey.toBase58(),
          verified: true,
          share: 100,
        }),
      ]);

      const optionIdx = 1;

      const voteRecordPubkey = await vote(proposalPubkey, optionIdx, {
        owner: owner,
        mint: mintPubkey,
        tokenAccount: tokenAccountPubkey,
      });
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

    it("vote to a limited proposal with a random NFT", async () => {
      let randomCreator = anchor.web3.Keypair.generate();
      const proposalPubkey = await propose({ allowedCreators: [randomCreator.publicKey] });

      let owner = await newKeypairWithLamports(10 * anchor.web3.LAMPORTS_PER_SOL);
      let { mintPubkey: mintPubkey, tokenAccountPubkey: tokenAccountPubkey } = await mintNFT(owner, [
        new Creator({
          address: provider.wallet.publicKey.toBase58(),
          verified: true,
          share: 100,
        }),
      ]);

      try {
        await vote(proposalPubkey, 1, {
          owner: owner,
          mint: mintPubkey,
          tokenAccount: tokenAccountPubkey,
        });
        assert.ok(false);
      } catch (err) {
        assert.equal(err.toString(), "invalid mint");
      }
    });

    it("vote to a limited proposal with a falsify NFT", async () => {
      const proposalPubkey = await propose({ allowedCreators: [provider.wallet.publicKey] });

      let owner = await newKeypairWithLamports(10 * anchor.web3.LAMPORTS_PER_SOL);
      let { mintPubkey: mintPubkey, tokenAccountPubkey: tokenAccountPubkey } = await mintNFT(owner, [
        new Creator({
          address: provider.wallet.publicKey.toBase58(),
          verified: false,
          share: 100,
        }),
      ]);

      try {
        await vote(proposalPubkey, 1, {
          owner: owner,
          mint: mintPubkey,
          tokenAccount: tokenAccountPubkey,
        });
        assert.ok(false);
      } catch (err) {
        assert.equal(err.toString(), "invalid mint");
      }
    });

    it("vote to a limited proposal with a corresponded NFT", async () => {
      const proposalPubkey = await propose({ allowedCreators: [provider.wallet.publicKey] });

      let owner = await newKeypairWithLamports(10 * anchor.web3.LAMPORTS_PER_SOL);
      let { mintPubkey: mintPubkey, tokenAccountPubkey: tokenAccountPubkey } = await mintNFT(owner, [
        new Creator({
          address: provider.wallet.publicKey.toBase58(),
          verified: true,
          share: 100,
        }),
      ]);

      const optionIdx = 1;

      const voteRecordPubkey = await vote(proposalPubkey, optionIdx, {
        owner: owner,
        mint: mintPubkey,
        tokenAccount: tokenAccountPubkey,
      });

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
        assert.ok(false);
      } catch (err) {
        //TODO check error
      }
    });

    it("vote to a closed proposal", async () => {
      const proposalPubkey = await propose({ endedAt: new anchor.BN(new Date().getTime() / 1000 - 86400) });

      let owner = await newKeypairWithLamports(10 * anchor.web3.LAMPORTS_PER_SOL);
      let { mintPubkey: mintPubkey, tokenAccountPubkey: tokenAccountPubkey } = await mintNFT(owner);

      try {
        await vote(proposalPubkey, 1, { owner: owner, mint: mintPubkey, tokenAccount: tokenAccountPubkey });
        assert.ok(false);
      } catch (err) {
        assert.equal(err.toString(), "proposal voting has closed");
      }
    });

    it("count how many instructions can pack into single transaction", async () => {
      const proposalPubkey = await propose();
      let owner = await newKeypairWithLamports(10 * anchor.web3.LAMPORTS_PER_SOL);
      const optionIdx = 1;

      let tx = new anchor.web3.Transaction();

      for (let i = 0; i < 8; i++) {
        let { mintPubkey: mintPubkey, tokenAccountPubkey: tokenAccountPubkey } = await mintNFT(owner);

        const [voteRecordPubkey] = await anchor.web3.PublicKey.findProgramAddress(
          [mintPubkey.toBuffer(), proposalPubkey.toBuffer()],
          program.programId
        );

        tx.add(
          program.instruction.vote(optionIdx, {
            accounts: {
              owner: owner.publicKey,
              tokenAccount: tokenAccountPubkey,
              metadata: await Metadata.getPDA(mintPubkey),
              proposal: proposalPubkey,
              voteRecord: voteRecordPubkey,
              systemProgram: anchor.web3.SystemProgram.programId,
            },
          })
        );
      }
      await provider.connection.sendTransaction(tx, [owner]);
    });
  });

  const vote = async (
    proposal: anchor.web3.PublicKey,
    optionIdx: number,
    param: {
      owner: anchor.web3.Keypair;
      mint: anchor.web3.PublicKey;
      tokenAccount: anchor.web3.PublicKey;
    }
  ): Promise<anchor.web3.PublicKey> => {
    const [voteRecordPubkey] = await anchor.web3.PublicKey.findProgramAddress(
      [param.mint.toBuffer(), proposal.toBuffer()],
      program.programId
    );

    await program.rpc.vote(optionIdx, {
      accounts: {
        owner: param.owner.publicKey,
        tokenAccount: param.tokenAccount,
        metadata: await Metadata.getPDA(param.mint),
        proposal: proposal,
        voteRecord: voteRecordPubkey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [param.owner],
    });

    return voteRecordPubkey;
  };

  const propose = async (param?: {
    clientId?: number;
    proposer?: anchor.web3.Keypair;
    proposal?: anchor.web3.Keypair;
    title?: string;
    content?: string;
    options?: Array<string>;
    endedAt?: anchor.BN;
    allowedCreators?: Array<anchor.web3.PublicKey>;
  }): Promise<anchor.web3.PublicKey> => {
    // prepare param
    param = param || {};
    if (!param.proposer) {
      param.proposer = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(param.proposer.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
      );
    }
    param.clientId = param.clientId || 1;
    param.proposal = param.proposal || anchor.web3.Keypair.generate();
    param.title = param.title || "test title?";
    param.content = param.content || "this is line1\nthis line 2";
    param.options = param.options || ["options1", "options2"];
    param.endedAt = param.endedAt || new anchor.BN(new Date().getTime() / 1000 + 86400);
    param.allowedCreators = param.allowedCreators || [];

    // propose
    await program.rpc.propose(
      param.clientId,
      param.title,
      param.content,
      param.options,
      param.allowedCreators,
      param.endedAt,
      {
        accounts: {
          proposer: param.proposer.publicKey,
          proposal: param.proposal.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [param.proposer, param.proposal],
      }
    );

    // return the proposal key
    return param.proposal.publicKey;
  };

  // use provider.wallet to mint nft
  // if don't give any creators, it use provider.wallet as a default creator
  const mintNFT = async (
    owner: anchor.web3.Keypair,
    creators?: Array<Creator>
  ): Promise<{
    mintPubkey: anchor.web3.PublicKey;
    tokenAccountPubkey: anchor.web3.PublicKey;
  }> => {
    const [mintPubkey, tokenAccountPubkey] = await createMintAndVault(provider, new anchor.BN(1), owner.publicKey, 0);
    const metadataData = new MetadataDataData({
      name: "Test",
      symbol: "",
      uri: "",
      sellerFeeBasisPoints: 100,
      creators: creators,
    });

    await provider.connection.confirmTransaction(
      await actions.createMetadata({
        connection: provider.connection,
        wallet: provider.wallet,
        editionMint: mintPubkey,
        metadataData: metadataData,
      })
    );

    return {
      mintPubkey,
      tokenAccountPubkey,
    };
  };

  const newKeypairWithLamports = async (lamports: number): Promise<anchor.web3.Keypair> => {
    let kp = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(kp.publicKey, lamports),
      "processed"
    );
    return kp;
  };
});
