import Head from "next/head"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import {
  CandyMachine,
  Metaplex,
  PublicKey,
  walletAdapterIdentity,
} from "@metaplex-foundation/js"

import { Keypair, Transaction } from "@solana/web3.js"
import { mintV2Instructions } from "@/utils/mintV2"

export default function Home() {
  const wallet = useWallet()
  const { publicKey } = wallet
  const { connection } = useConnection()
  const [metaplex, setMetaplex] = useState<Metaplex | null>(null)
  const [candyMachine, setCandyMachine] = useState<CandyMachine | null>(null)

  useEffect(() => {
    ;(async () => {
      if (wallet && connection) {
        if (!process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
          throw new Error("Please provide a candy machine id")
        }
        const metaplex = new Metaplex(connection).use(
          walletAdapterIdentity(wallet)
        )
        setMetaplex(metaplex)

        const candyMachine = await metaplex.candyMachines().findByAddress({
          address: new PublicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID),
        })

        setMetaplex(metaplex)
        setCandyMachine(candyMachine)
      }
    })()
  }, [wallet, connection])
  return (
    <>
      <Head>
        <title>pNFTs mint</title>
        <meta name="description" content="Mint pNFTs from the UI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 0",
        }}
      >
        <h1>pNFTs mint</h1>
        <p>mint pNFTs from the ui</p>

        <WalletMultiButton
          style={{
            backgroundColor: "#121212",
            border: "1px solid #00ffbd",
            borderColor: "#00ffbd",
            fontSize: "16px",
          }}
        />
        <button
          onClick={async () => {
            if (
              !metaplex ||
              !candyMachine ||
              !publicKey ||
              !candyMachine.candyGuard
            )
              return null

            const mint = Keypair.generate()
            const { instructions } = await mintV2Instructions(
              candyMachine.candyGuard?.address,
              candyMachine.address,
              publicKey,
              publicKey,
              mint,
              connection,
              metaplex
            )

            const tx = new Transaction().add(...instructions)

            tx.recentBlockhash = (
              await connection.getLatestBlockhash()
            ).blockhash

            const txid = await wallet.sendTransaction(tx, connection, {
              signers: [mint],
            })

            const latest = await connection.getLatestBlockhash()
            await connection.confirmTransaction({
              blockhash: latest.blockhash,
              lastValidBlockHeight: latest.lastValidBlockHeight,
              signature: txid,
            })
          }}
        >
          mint
        </button>
      </main>
    </>
  )
}
