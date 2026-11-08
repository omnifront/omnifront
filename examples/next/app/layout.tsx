import { OmnifrontProvider } from "@omnifront/next/client"
import type { ReactNode } from "react"

export const metadata = { title: "omnifront + Next" }

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
				<OmnifrontProvider>{children}</OmnifrontProvider>
			</body>
		</html>
	)
}
