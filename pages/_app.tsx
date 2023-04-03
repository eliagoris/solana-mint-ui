import "@/styles/globals.css"
import type { AppProps } from "next/app"
import dynamic from "next/dynamic"

const WalletProvider = dynamic(() => import("@/components/WalletProvider"), {
  ssr: false,
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  )
}
