import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import React, { FC, useCallback, useState } from "react";
import idl from "./idl.json";
import type { NftVote } from "./nft_vote";
import { Program, Provider, web3, BN, Idl } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token, MintLayout } from "@solana/spl-token";

const programID = new web3.PublicKey(idl.metadata.address);

export const Vote: FC = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [voteMintAddress, setVoteMintAddress] = useState("");
  const [voteProposalAddress, setVoteProposalAddress] = useState("");
  const [voteOptionIdx, setVoteOptionIdx] = useState("");
  const [voteStatus, setVoteStatus] = useState("");

  const [proposalAddress, setProposalAddress] = useState("");
  const [allVotes, setAllVotes] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();
    const provider = new Provider(connection, anchorWallet, {});
    // @ts-ignore
    const program = new Program(idl as Idl, programID, provider) as Program<NftVote>;

    try {
      let mintPubkey = new web3.PublicKey(voteMintAddress);
      let proposalPubkey = new web3.PublicKey(voteProposalAddress);

      const [voteRecordPubkey] = await web3.PublicKey.findProgramAddress(
        [mintPubkey.toBuffer(), proposalPubkey.toBuffer()],
        program.programId
      );

      let tx = program.transaction.vote(parseInt(voteOptionIdx), {
        accounts: {
          owner: anchorWallet.publicKey,
          tokenAccount: await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mintPubkey,
            anchorWallet.publicKey
          ),
          proposal: proposalPubkey,
          voteRecord: voteRecordPubkey,
          systemProgram: web3.SystemProgram.programId,
        },
      });
      tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      tx.feePayer = anchorWallet.publicKey;

      let signedTx = await anchorWallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, "processed");
      setVoteStatus(signature);
    } catch (e) {
      setVoteStatus((e as Error).message);
    }
  }, [voteMintAddress, voteProposalAddress, voteOptionIdx, connection, anchorWallet]);

  const getAllVotes = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();
    const provider = new Provider(connection, anchorWallet, {});
    // @ts-ignore
    const program = new Program(idl as Idl, programID, provider) as Program<NftVote>;

    try {
      let proposal = new web3.PublicKey(proposalAddress);
      let res = await program.account.voteRecord.all([
        {
          memcmp: {
            offset: 8,
            bytes: proposal.toBase58(),
          },
        },
      ]);

      setAllVotes(JSON.stringify(res, null, 2));
    } catch (e) {
      setAllVotes((e as Error).message);
    }
  }, [proposalAddress, connection, anchorWallet]);

  return (
    <div>
      <div>
        <input
          style={{ width: "200px" }}
          type="text"
          value={voteMintAddress}
          onChange={(v) => setVoteMintAddress(v.target.value)}
          placeholder="mint address (base58)"
        ></input>
        <input
          style={{ width: "200px" }}
          type="text"
          value={voteProposalAddress}
          onChange={(v) => setVoteProposalAddress(v.target.value)}
          placeholder="proposal address (base58)"
        ></input>
        <input
          style={{ width: "200px" }}
          type="text"
          value={voteOptionIdx}
          onChange={(v) => setVoteOptionIdx(v.target.value)}
          placeholder="option idx, (0 or 1 or 2 ...)"
        ></input>
        <button onClick={onClick} disabled={!anchorWallet}>
          Vote
        </button>
        {voteStatus ? <p>{voteStatus}</p> : <></>}
      </div>
      <div>
        <input
          style={{ width: "200px" }}
          type="text"
          value={proposalAddress}
          onChange={(v) => setProposalAddress(v.target.value)}
          placeholder="proposal address (base58)"
        ></input>
        <button onClick={getAllVotes}>Get All Votes</button>
        {allVotes ? <p>{allVotes}</p> : <></>}
      </div>
    </div>
  );
};
