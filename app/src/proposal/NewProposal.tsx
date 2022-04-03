import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { FC, useCallback, useState } from "react";
import { web3, BN } from "@project-serum/anchor";
import { getProgram } from "../anchor";

export default (() => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [clientIdInput, setClientIdInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [optionsInput, setOptionsInput] = useState("");
  const [allowedCreatorsInput, setAllowedCreatorsInput] = useState("");
  const [endedAtInput, setEndedAtInput] = useState("");
  const [result, setResult] = useState("");

  const onClick = useCallback(async () => {
    if (!anchorWallet) throw new WalletNotConnectedError();

    const program = getProgram(connection, anchorWallet);

    try {
      let clientId = clientIdInput
      let title = titleInput;
      let contect = contentInput;
      let allowedCreators: Array<web3.PublicKey> = [];
      if (allowedCreatorsInput.length !== 0) {
        allowedCreators = [new web3.PublicKey(allowedCreatorsInput)];
      }

      let options = optionsInput.split(",");
      let endedAt = new BN(Date.parse(endedAtInput) / 1000);

      const proposal = web3.Keypair.generate();

      let tx = await program.transaction.propose(clientId, title, contect, options, allowedCreators, endedAt, {
        accounts: {
          proposer: anchorWallet.publicKey,
          proposal: proposal.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
      });
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = anchorWallet.publicKey;
      tx.partialSign(proposal);

      let signedTx = await anchorWallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);

      setResult(`proposal: ${proposal.publicKey.toBase58()}`);
    } catch (e) {
      setResult((e as Error).message);
    }
  }, [
    connection,
    anchorWallet,
    clientIdInput,
    titleInput,
    contentInput,
    optionsInput,
    allowedCreatorsInput,
    endedAtInput,
  ]);

  return (
    <div>
      <input
        style={{ width: "200px" }}
        type="text"
        value={clientIdInput}
        onChange={(v) => setClientIdInput(v.target.value)}
        placeholder="client id (u16, 0~65535)"
      ></input>
      <input
        style={{ width: "200px" }}
        type="text"
        value={titleInput}
        onChange={(v) => setTitleInput(v.target.value)}
        placeholder="title"
      ></input>
      <textarea
        style={{ width: "200px" }}
        value={contentInput}
        onChange={(v) => setContentInput(v.target.value)}
        placeholder="content"
      ></textarea>
      <input
        style={{ width: "200px" }}
        type="text"
        value={optionsInput}
        onChange={(v) => setOptionsInput(v.target.value)}
        placeholder="options1,options2,... (use , as a delimiter)"
      ></input>
      <input
        style={{ width: "200px" }}
        type="text"
        value={allowedCreatorsInput}
        onChange={(v) => setAllowedCreatorsInput(v.target.value)}
        placeholder="allow creator"
      ></input>
      <input
        style={{ width: "200px" }}
        type="date"
        value={endedAtInput}
        onChange={(v) => setEndedAtInput(v.target.value)}
        placeholder="end at"
      ></input>
      <button onClick={onClick}>New Proposal</button>
      {result ? <p>{result}</p> : <></>}
    </div>
  );
}) as FC;
