import React, { useCallback, useEffect, useMemo, useState } from "react"

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import {
  CandyGuard,
  CandyMachine,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine"
import { PublicKey, publicKey, some } from "@metaplex-foundation/umi"
import {
  fetchCandyMachine,
  fetchCandyGuard,
} from "@metaplex-foundation/mpl-candy-machine"
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters"

// Use the RPC endpoint of your choice.
const umi = createUmi(
  "https://lively-ultra-lambo.solana-devnet.quiknode.pro/72c8ec506f45d1f495fcfe29fe00c039a322a863/"
).use(mplCandyMachine())

import { mintV2 } from "@metaplex-foundation/mpl-candy-machine"
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox"
import { transactionBuilder, generateSigner } from "@metaplex-foundation/umi"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"

const candyMachineId = process.env.NEXT_PUBLIC_CANDY_MACHINE_ID
type Props = {}

export default function Umi(props: Props) {
  const [candyMachine, setCandyMachine] = useState<CandyMachine | null>(null)
  const [candyGuard, setCandyGuard] = useState<CandyGuard | null>(null)
  const wallet = useWallet()
  const fetchCandyMachineData = useCallback(async () => {
    console.log("fetching...")
    if (!candyMachineId)
      throw new Error(
        "Please, provide a NEXT_PUBLIC_CANDY_MACHINE_ID env variable"
      )
    const candyMachinePublicKey = publicKey(candyMachineId)
    const candyMachine = await fetchCandyMachine(umi, candyMachinePublicKey)
    const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority)

    setCandyMachine(candyMachine)
    setCandyGuard(candyGuard)
    console.log(candyMachine)
  }, [candyMachineId])

  useEffect(() => {
    fetchCandyMachineData()
  }, [fetchCandyMachineData])

  const cost = useMemo(
    () =>
      candyGuard
        ? candyGuard?.guards.solPayment
          ? Number(candyGuard?.guards.solPayment?.value.lamports.basisPoints) /
              1e9 +
            " SOL"
          : "Free mint"
        : "...",
    [candyGuard]
  )

  const mint = async () => {
    if (!candyMachine) throw new Error("No candy machine")
    const umi2 = umi.use(walletAdapterIdentity(wallet))
    const nftMint = generateSigner(umi2)

    console.log(candyGuard?.guards.solPayment)
    const destination: PublicKey =
      candyGuard?.guards.solPayment.value.destination
    const lamports = candyGuard?.guards.solPayment.value.lamports

    console.log(candyMachine.mintAuthority.toString())
    console.log(destination.toString())
    await transactionBuilder()
      .add(setComputeUnitLimit(umi2, { units: 800_000 }))
      .add(
        mintV2(umi2, {
          candyMachine: candyMachine.publicKey,
          nftMint,
          collectionMint: candyMachine.collectionMint,
          collectionUpdateAuthority: candyMachine.authority,
          tokenStandard: candyMachine.tokenStandard,
          candyGuard: candyGuard?.publicKey,
          mintArgs: {
            mintLimit: some({ id: 0 }),
            solPayment: some({ lamports, destination }),
          },
        })
      )
      .sendAndConfirm(umi2)
  }

  console.log(cost)

  return (
    <div>
      <h1>mint</h1>
      <style jsx>{`
        h1 {
          color: red;
        }
      `}</style>
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
      <button onClick={mint}>mint</button>
    </div>
  )
}
