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

  const [mintAddressesInput, setMintAddressesInput] = useState("");
  const [proposalAddress, setProposalAddress] = useState("");
  const [optionIdx, setOptionIdx] = useState("");

  const [result, setResult] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();

    const program = getProgram(connection, anchorWallet);

    try {
      let max = 7; // a tx can include 7 NFTs vote (approx.)
      let mintAddresses = mintAddressesInput.split(",");
      console.log(mintAddresses)

      let txs: Array<web3.Transaction> = [];

      for (let txIdx = 0; txIdx < Math.ceil(mintAddresses.length / max); txIdx++) {
        let tx = new web3.Transaction();

        for (
          let mintAddressIdx = txIdx * max;
          mintAddressIdx < Math.min((txIdx + 1) * max, mintAddresses.length);
          mintAddressIdx++
        ) {
          let mintAddress = mintAddresses[mintAddressIdx];
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

          tx.add(
            program.instruction.vote(parseInt(optionIdx), {
              accounts: {
                owner: anchorWallet.publicKey,
                tokenAccount: tokenAccountPubkey,
                metadata: await Metadata.getPDA(mintPubkey),
                proposal: proposalPubkey,
                voteRecord: voteRecordPubkey,
                systemProgram: web3.SystemProgram.programId,
              },
            })
          );
        }

        tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        tx.feePayer = anchorWallet.publicKey;

        txs.push(tx);
      }

      let signedTxs = await anchorWallet.signAllTransactions(txs);

      let signatures = [];
      for (let i = 0; i < signedTxs.length; i++) {
        let signedTx = signedTxs[i];
        signatures.push(await connection.sendRawTransaction(signedTx.serialize()));
      }

      setResult(JSON.stringify(signatures, null, 2));
    } catch (e) {
      setResult((e as Error).message);
    }
  }, [connection, anchorWallet, mintAddressesInput, proposalAddress, optionIdx]);

  return (
    <div>
      <input
        style={{ width: "200px" }}
        type="text"
        value={mintAddressesInput}
        onChange={(v) => setMintAddressesInput(v.target.value)}
        placeholder="mint address, use , for multiple NFTs"
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
