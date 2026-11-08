import { OmnifrontProvider } from "@omnifront/next/client"
import type { AppProps } from "next/app"

export default function App({ Component, pageProps }: AppProps) {
	return (
		<OmnifrontProvider>
			<Component {...pageProps} />
		</OmnifrontProvider>
	)
}
