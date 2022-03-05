import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useState } from "react";
import { web3 } from "@project-serum/anchor";
import { getProgram } from "../anchor";

export default (() => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [proposalAddress, setProposalAddress] = useState("");
  const [result, setResult] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();

    const program = getProgram(connection, anchorWallet);

    try {
      if (!anchorWallet) throw new WalletNotConnectedError();

      try {
        let proposalPubkey = new web3.PublicKey(proposalAddress);
        const proposalAccountInfo = await program.account.proposal.fetch(proposalPubkey);
        setResult(JSON.stringify(proposalAccountInfo, null, 2));
      } catch (e) {
        setResult((e as Error).message);
      }
    } catch (e) {
      setResult((e as Error).message);
    }
  }, [connection, anchorWallet, proposalAddress]);

  return (
    <div>
      <input
        style={{ width: "200px" }}
        type="text"
        value={proposalAddress}
        onChange={(v) => setProposalAddress(v.target.value)}
        placeholder="proposal pubkey"
      ></input>
      <button onClick={onClick}>Get Proposal</button>
      {result ? <p>{result}</p> : <></>}
    </div>
  );
}) as FC;
