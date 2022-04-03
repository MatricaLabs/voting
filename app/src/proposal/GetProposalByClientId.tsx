import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useState } from "react";
import { getProgram } from "../anchor";

export default (() => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [clientIdInput, setClientIdInput] = useState("");
  const [result, setResult] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();
    const program = getProgram(connection, anchorWallet);

    try {
      let buf = Buffer.alloc(2);
      buf.writeUInt16LE(parseInt(clientIdInput));
      console.log(buf)

      const res = await program.account.proposal.all([
        {
          memcmp: {
            offset: 8,
            bytes: bs58.encode(buf),
          },
        },
      ]);
      setResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setResult((e as Error).message);
    }
  }, [connection, anchorWallet, clientIdInput]);

  return (
    <div>
      <input
        style={{ width: "200px" }}
        type="text"
        value={clientIdInput}
        onChange={(v) => setClientIdInput(v.target.value)}
        placeholder="client id"
      ></input>
      <button onClick={onClick}>Get Proposals By Client Id</button>
      {result ? <p>{result}</p> : <></>}
    </div>
  );
}) as FC;
