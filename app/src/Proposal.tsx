import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import React, { FC, useCallback, useState } from "react";
import idl from "./idl.json";
import type { NftVote } from "./nft_vote";
import { Program, Provider, web3, BN, Idl } from "@project-serum/anchor";

const programID = new web3.PublicKey(idl.metadata.address);

export const Proposal: FC = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [newProposalAddress, setNewProposalAddress] = useState("");
  const [proposalAddress, setProposalAddress] = useState("");
  const [proposalDetail, setProposalDetail] = useState("");
  const [allProposals, setAllProposals] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();
    const provider = new Provider(connection, anchorWallet, {});
    // @ts-ignore
    const program = new Program(idl as Idl, programID, provider) as Program<NftVote>;

    try {
      const proposal = web3.Keypair.generate();
      const title = "test title?";
      const content = "this is line1\nthis line 2";
      const options = ["option1", "option2"];
      const endedAt = new BN(new Date().getTime() / 1000 + 86400);

      let tx = await program.transaction.propose(title, content, options, endedAt, {
        accounts: {
          proposer: anchorWallet.publicKey,
          proposal: proposal.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
      });
      tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      tx.feePayer = anchorWallet.publicKey;
      tx.partialSign(proposal);

      let signedTx = await anchorWallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, "processed");
      setNewProposalAddress(proposal.publicKey.toBase58());
    } catch (e) {
      console.log(e);
    }
  }, [connection, anchorWallet]);

  const queryForProposalDetail = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();
    const provider = new Provider(connection, anchorWallet, {});
    // @ts-ignore
    const program = new Program(idl as Idl, programID, provider) as Program<NftVote>;

    try {
      const proposalAccountInfo = await program.account.proposal.fetch(proposalAddress);
      setProposalDetail(JSON.stringify(proposalAccountInfo, null, 2));
    } catch (e) {
      setProposalDetail((e as Error).message);
    }
  }, [proposalAddress, connection, anchorWallet]);

  const getAllProposals = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();
    const provider = new Provider(connection, anchorWallet, {});
    // @ts-ignore
    const program = new Program(idl as Idl, programID, provider) as Program<NftVote>;

    try {
      let res = await program.account.proposal.all();

      setAllProposals(JSON.stringify(res, null, 2));
    } catch (e) {
      setAllProposals((e as Error).message);
    }
  }, [connection, anchorWallet]);

  return (
    <div>
      <div>
        <button onClick={onClick} disabled={!anchorWallet}>
          Create New Proposal
        </button>
        {newProposalAddress ? <p>proposal: {newProposalAddress}</p> : <></>}
      </div>
      <div>
        <button onClick={getAllProposals}>Get All Proposals</button>
        {allProposals ? <p>{allProposals}</p> : <></>}
      </div>
      <div>
        <input
          style={{ width: "200px" }}
          type="text"
          value={proposalAddress}
          onChange={(v) => setProposalAddress(v.target.value)}
          placeholder="proposal address (base58)"
        ></input>
        <button onClick={queryForProposalDetail}>Proposal Detail</button>
        {proposalDetail ? <p>{proposalDetail}</p> : <></>}
      </div>
    </div>
  );
};
