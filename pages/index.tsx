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
import { Keypair, Transaction, AccountMeta } from "@solana/web3.js"

import {
  getRemainingAccountsByGuardType,
  mintV2Instruction,
} from "@/utils/mintV2"
import { fromTxError } from "@/utils/errors"
export default function Home() {
  const wallet = useWallet()
  const { publicKey } = wallet
  const { connection } = useConnection()
  const [metaplex, setMetaplex] = useState<Metaplex | null>(null)
  const [candyMachine, setCandyMachine] = useState<CandyMachine | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)

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

  /** Mints NFTs through a Candy Machine using Candy Guards */
  const handleMintV2 = async () => {
    if (!metaplex || !candyMachine || !publicKey || !candyMachine.candyGuard)
      return null

    if (!candyMachine.candyGuard)
      throw new Error(
        "This app only works with Candy Guards. Please setup your Guards through Sugar."
      )

    try {
      const { guards } = candyMachine.candyGuard

      /** Filter only enabled Guards */
      const enabledGuards =
        guards && Object.keys(guards).filter((guardKey) => guards[guardKey])

      let remainingAccounts: AccountMeta[] = []
      if (enabledGuards.length) {
        /** Map all Guards and grab their remaining accounts */
        enabledGuards.forEach((guard) => {
          const candyGuard = candyMachine.candyGuard?.guards[guard]

          if (!candyGuard) return null
          const remaining = getRemainingAccountsByGuardType(candyGuard, guard)

          /** Push to the accounts array */
          if (remaining.length) {
            remainingAccounts.push(...remaining)
          }
        })
      }

      const mint = Keypair.generate()
      const { instructions } = await mintV2Instruction(
        candyMachine.candyGuard?.address,
        candyMachine.address,
        publicKey,
        publicKey,
        mint,
        connection,
        metaplex,
        remainingAccounts
      )

      const tx = new Transaction().add(...instructions)

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

      const txid = await wallet.sendTransaction(tx, connection, {
        signers: [mint],
      })

      const latest = await connection.getLatestBlockhash()
      await connection.confirmTransaction({
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
        signature: txid,
      })
    } catch (e) {
      console.log(e)
      const msg = fromTxError(e)

      if (msg) {
        setFormMessage(msg.message)
      }
    }
  }

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
        <button onClick={handleMintV2}>mint</button>
        {formMessage}
      </main>
    </>
  )
}
