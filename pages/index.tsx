import Head from "next/head"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"

export default function Home() {
  const { publicKey } = useWallet()
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
        <button>mint</button>
      </main>
    </>
  )
}
