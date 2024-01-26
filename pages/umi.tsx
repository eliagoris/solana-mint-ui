import React, { useCallback, useEffect, useMemo, useState } from "react"

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import {
  CandyGuard,
  CandyMachine,
  DefaultGuardSetMintArgs,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine"
import { publicKey, some, unwrapOption } from "@metaplex-foundation/umi"
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

  const solPaymentGuard = useMemo(() => {
    return candyGuard ? unwrapOption(candyGuard.guards.solPayment) : null
  }, [candyGuard])

  const cost = useMemo(
    () =>
      candyGuard
        ? solPaymentGuard
          ? Number(solPaymentGuard.lamports.basisPoints) / 1e9 + " SOL"
          : "Free mint"
        : "...",
    [candyGuard]
  )

  const mint = async () => {
    if (!candyMachine) throw new Error("No candy machine")
    if (!candyGuard)
      throw new Error(
        "No candy guard found. Set up a guard for your candy machine."
      )
    const { guards } = candyGuard

    const enabledGuardsKeys =
      guards && Object.keys(guards).filter((guardKey) => guards[guardKey])

    let mintArgs: Partial<DefaultGuardSetMintArgs> = {}

    // If there are enabled guards, set the mintArgs
    if (enabledGuardsKeys.length) {
      /** Map all Guards and grab their remaining accounts */
      enabledGuardsKeys.forEach((guardKey) => {
        const guardObject = unwrapOption(candyGuard.guards[guardKey])
        if (!guardObject) return null

        // Set mintArgs automatically based on the fields defined in each guard
        mintArgs = { ...mintArgs, [guardKey]: some(guardObject) }
      })
    }

    const umiWalletAdapter = umi.use(walletAdapterIdentity(wallet))
    const nftMint = generateSigner(umiWalletAdapter)

    try {
      const res = await transactionBuilder()
        .add(setComputeUnitLimit(umiWalletAdapter, { units: 800_000 }))
        .add(
          mintV2(umiWalletAdapter, {
            candyMachine: candyMachine.publicKey,
            nftMint,
            collectionMint: candyMachine.collectionMint,
            collectionUpdateAuthority: candyMachine.authority,
            tokenStandard: candyMachine.tokenStandard,
            candyGuard: candyGuard?.publicKey,
            mintArgs,
          })
        )
        .sendAndConfirm(umiWalletAdapter)

      console.log(res.result)
    } catch (e) {
      alert(e)
    }
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
