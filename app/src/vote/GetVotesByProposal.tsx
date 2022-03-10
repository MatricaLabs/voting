import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useState } from "react";
import { getProgram } from "../anchor";

export default (() => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [proposal, setProposal] = useState("");
  const [result, setResult] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();
    const program = getProgram(connection, anchorWallet);

    try {
      try {
        const res = await program.account.voteRecord.all([
          {
            memcmp: {
              offset: 8,
              bytes: proposal,
            },
          },
        ]);
        setResult(JSON.stringify(res, null, 2));
      } catch (e) {
        setResult((e as Error).message);
      }
    } catch (e) {
      setResult((e as Error).message);
    }
  }, [connection, anchorWallet, proposal]);

  return (
    <div>
      <input
        style={{ width: "200px" }}
        type="text"
        value={proposal}
        onChange={(v) => setProposal(v.target.value)}
        placeholder="proposal"
      ></input>
      <button onClick={onClick}>Get All Votes By Proposal</button>
      {result ? <p>{result}</p> : <></>}
    </div>
  );
}) as FC;
