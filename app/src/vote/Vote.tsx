import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useState } from "react";
import { web3 } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { getProgram } from "../anchor";

import { programs } from "@metaplex/js";
const {
  metadata: { Metadata },
} = programs;

export default (() => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [mintAddress, setMintAddress] = useState("");
  const [proposalAddress, setProposalAddress] = useState("");
  const [optionIdx, setOptionIdx] = useState("");

  const [result, setResult] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();

    const program = getProgram(connection, anchorWallet);

    try {
      let mintPubkey = new web3.PublicKey(mintAddress);
      let tokenAccountPubkey = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mintPubkey,
        anchorWallet.publicKey
      );
      let proposalPubkey = new web3.PublicKey(proposalAddress);

      const [voteRecordPubkey] = await web3.PublicKey.findProgramAddress(
        [mintPubkey.toBuffer(), proposalPubkey.toBuffer()],
        program.programId
      );

      let tx = program.transaction.vote(parseInt(optionIdx), {
        accounts: {
          owner: anchorWallet.publicKey,
          tokenAccount: tokenAccountPubkey,
          metadata: await Metadata.getPDA(mintPubkey),
          proposal: proposalPubkey,
          voteRecord: voteRecordPubkey,
          systemProgram: web3.SystemProgram.programId,
        },
      });
      tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      tx.feePayer = anchorWallet.publicKey;

      let signedTx = await anchorWallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);
      setResult(signature);
    } catch (e) {
      setResult((e as Error).message);
    }
  }, [connection, anchorWallet, mintAddress, proposalAddress, optionIdx]);

  return (
    <div>
      <input
        style={{ width: "200px" }}
        type="text"
        value={mintAddress}
        onChange={(v) => setMintAddress(v.target.value)}
        placeholder="mint address (base58)"
      ></input>
      <input
        style={{ width: "200px" }}
        type="text"
        value={proposalAddress}
        onChange={(v) => setProposalAddress(v.target.value)}
        placeholder="proposal address (base58)"
      ></input>
      <input
        style={{ width: "200px" }}
        type="text"
        value={optionIdx}
        onChange={(v) => setOptionIdx(v.target.value)}
        placeholder="option idx, (0 or 1 or 2 ...)"
      ></input>
      <button onClick={onClick} disabled={!anchorWallet}>
        Vote
      </button>
      {result ? <p>{result}</p> : <></>}
    </div>
  );
}) as FC;
