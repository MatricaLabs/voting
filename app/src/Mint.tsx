import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import React, { FC, useCallback, useState } from "react";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, Token, MintLayout } from "@solana/spl-token";

export const Mint: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const [mintAddress, setMintAddress] = useState("");

  const onClick = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    try {
      let mint = Keypair.generate();
      let ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        publicKey
      );

      let tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: await Token.getMinBalanceRentForExemptMint(connection),
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitMintInstruction(TOKEN_PROGRAM_ID, mint.publicKey, 0, publicKey, null),
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          ata,
          publicKey,
          publicKey
        ),
        Token.createMintToInstruction(TOKEN_PROGRAM_ID, mint.publicKey, ata, publicKey, [], 1)
      );
      tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      tx.feePayer = publicKey;
      tx.partialSign(mint);

      if (!signTransaction) {
        throw new Error("signTransaction is not a function");
      }
      let signedTx = await signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, "processed");

      setMintAddress(mint.publicKey.toBase58());
    } catch (e) {
      console.log(e);
    }
  }, [publicKey, signTransaction, connection]);

  return (
    <div>
      <button onClick={onClick} disabled={!publicKey}>
        create a new mint to vote
      </button>
      {mintAddress ? <p>mint: {mintAddress}</p> : <></>}
    </div>
  );
};
