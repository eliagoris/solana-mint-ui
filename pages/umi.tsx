import React, { useCallback, useEffect, useMemo, useState } from "react"

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import {
  CandyGuard,
  CandyMachine,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine"
import { publicKey } from "@metaplex-foundation/umi"
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

    await transactionBuilder()
      .add(setComputeUnitLimit(umi2, { units: 800_000 }))
      .add(
        mintV2(umi2, {
          candyMachine: candyMachine.publicKey,
          nftMint,
          collectionMint: candyMachine.collectionMint,
          collectionUpdateAuthority: candyMachine.mintAuthority,
          tokenStandard: candyMachine.tokenStandard,
          candyGuard: candyGuard?.publicKey,
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

      <button onClick={mint}>mint</button>
    </div>
  )
}
