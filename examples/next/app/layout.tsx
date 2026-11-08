import { UnicoreProvider } from "@unicore/next/client"
import type { ReactNode } from "react"

export const metadata = { title: "unicore + Next" }

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
				<UnicoreProvider>{children}</UnicoreProvider>
			</body>
		</html>
	)
}
