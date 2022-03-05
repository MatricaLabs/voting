import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useState } from "react";
import { getProgram } from "../anchor";

export default (() => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [result, setResult] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();

    const program = getProgram(connection, anchorWallet);

    try {
      if (!anchorWallet) throw new WalletNotConnectedError();

      try {
        const res = await program.account.voteRecord.all();
        setResult(JSON.stringify(res, null, 2));
      } catch (e) {
        setResult((e as Error).message);
      }
    } catch (e) {
      setResult((e as Error).message);
    }
  }, [connection, anchorWallet]);

  return (
    <div>
      <button onClick={onClick}>Get All Votes</button>
      {result ? <p>{result}</p> : <></>}
    </div>
  );
}) as FC;
