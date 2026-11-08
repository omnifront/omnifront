import { UnicoreProvider } from "@unicore/next/client"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<UnicoreProvider>
			<Component {...pageProps} />
		</UnicoreProvider>
	)
}
