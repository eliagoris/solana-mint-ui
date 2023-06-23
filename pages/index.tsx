import Head from "next/head"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import {
  CandyMachine,
  Metaplex,
  Nft,
  NftWithToken,
  PublicKey,
  Sft,
  SftWithToken,
  walletAdapterIdentity,
} from "@metaplex-foundation/js"
import { Connection, Keypair, Transaction } from "@solana/web3.js"

import {
  getRemainingAccountsForCandyGuard,
  mintV2Instruction,
} from "@/utils/mintV2"
import { fromTxError } from "@/utils/errors"
export default function Home() {
  const wallet = useWallet()
  const { publicKey } = wallet
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC as string)
  const [metaplex, setMetaplex] = useState<Metaplex | null>(null)
  const [candyMachine, setCandyMachine] = useState<CandyMachine | null>(null)
  const [collection, setCollection] = useState<
    Sft | SftWithToken | Nft | NftWithToken | null
  >(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [liveCounter, setLiveCounter] = useState(0); 
  const [all_items, setallitems] = useState(0); 
  // Initial value of the live counter
  
  const decrementLiveCounter = () => {
    if (liveCounter > 0) {
      setLiveCounter((prevCounter) => prevCounter + 1);
    }
  };

  var remaining_items:number = 0;
  var available_items:number = 0;

  useEffect(() => {
    ;(async () => {
      if (wallet && connection && !collection && !candyMachine) {
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

        setCandyMachine(candyMachine)

        remaining_items = (candyMachine.itemsRemaining.toNumber());
        available_items = (candyMachine.itemsAvailable.toNumber());

        setallitems(available_items);
        setLiveCounter(remaining_items);

        const collection = await metaplex
          .nfts()
          .findByMint({ mintAddress: candyMachine.collectionMintAddress })

        setCollection(collection)
      }
    })()
  }, [wallet])

  /** Mints NFTs through a Candy Machine using Candy Guards */
  const handleMintV2 = async () => {
    if (!metaplex || !candyMachine || !publicKey || !candyMachine.candyGuard) {
      if (!candyMachine?.candyGuard)
        throw new Error(
          "This app only works with Candy Guards. Please setup your Guards through Sugar."
        )

      throw new Error(
        "Couldn't find the Candy Machine or the connection is not defined."
      )
    }


    if (candyMachine.itemsRemaining.toNumber() == 0){
      setFormMessage('No Items Remainig');
    }


    try {
      const { remainingAccounts, additionalIxs } =
        getRemainingAccountsForCandyGuard(candyMachine, publicKey)
      console.log(remainingAccounts)

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

      const tx = new Transaction()
      console.log(tx)

      if (additionalIxs?.length) {
        tx.add(...additionalIxs)
      }

      tx.add(...instructions)

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    
    var txid:string;
    
    try{
      txid = await wallet.sendTransaction(tx, connection, {
        signers: [mint],
      })    
    }
    catch(e){
      setFormMessage('mint failed');
      return
    }

    while (true){
      const ret = await connection.getSignatureStatus(txid!, {searchTransactionHistory:true})
      try {
        //@ts-ignore
        if (ret){
          if (ret.value && ret.value.err == null){
            setFormMessage('mint failed');
            break
          } else if (ret.value && ret.value.err != null){
            setFormMessage('successfully minted');
            decrementLiveCounter();
          }else{
            continue
          }
        }
      } catch(e){
        setFormMessage('mint failed');
        break
      }

    }
      
    } catch (e) {
      const msg = fromTxError(e)

      if (msg) {
        setFormMessage(msg.message);
      }
    }
  }

  const cost = candyMachine
    ? candyMachine.candyGuard?.guards.solPayment
      ? Number(candyMachine.candyGuard?.guards.solPayment?.amount.basisPoints) /
          1e9 +
        " SOL"
      : "Free mint"
    : "..."

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
          padding: "96px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "32px",
            alignItems: "flex-start",
          }}
        >
          <img
            style={{ maxWidth: "396px", borderRadius: "8px" }}
            src={collection?.json?.image}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#111",
              padding: "32px 24px",
              borderRadius: "16px",
              border: "1px solid #222",
              minWidth: "320px",
            }}
          >
            <h1>{collection?.name}</h1>
            <p style={{ color: "#807a82", marginBottom: "32px" }}>
              {collection?.json?.description}
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#261727",
                padding: "16px 12px",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Public</span>
                <b>{cost}</b>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "11px" }}>Live</span>
                <span style={{ fontSize: "11px" }}>{all_items-liveCounter}/{all_items}</span>
              </div>
              <button disabled={!publicKey} onClick={handleMintV2}>
                mint
              </button>
              <WalletMultiButton
                style={{
                  width: "100%",
                  height: "auto",
                  marginTop: "8px",
                  padding: "8px 0",
                  justifyContent: "center",
                  fontSize: "13px",
                  backgroundColor: "#111",
                  lineHeight: "1.45",
                }}
              />
              {formMessage}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
