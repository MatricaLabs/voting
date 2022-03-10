import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useState } from "react";
import { programs } from "@metaplex/js";

export default (() => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [result, setResult] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();
    try {
      let res = await programs.metadata.Metadata.findDataByOwner(connection, anchorWallet.publicKey);
      setResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setResult((e as Error).message);
    }
  }, [connection, anchorWallet]);

  return (
    <div>
      <button onClick={onClick}>Get All NFTs</button>
      {result ? <p>{result}</p> : <></>}
    </div>
  );
}) as FC;
