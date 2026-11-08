import { createServerQueryClient, dehydrate, type DehydratedState } from "@omnifront/next"
import { HydrationBoundary } from "@omnifront/next/client"
import type { GetServerSideProps } from "next"
import Link from "next/link"
import { Todos } from "../components/todos"
import { listTodos } from "../lib/db"
import { todosQuery } from "../lib/queries"

interface Props {
	dehydratedState: DehydratedState
}

// Pages Router: prefetch in getServerSideProps and pass the dehydrated cache as a prop.
export const getServerSideProps: GetServerSideProps<Props> = async () => {
	const client = createServerQueryClient()
	await client.fetchQuery(todosQuery.queryKey, listTodos)
	return { props: { dehydratedState: dehydrate(client) } }
}

export default function Legacy({ dehydratedState }: Props) {
	return (
		<HydrationBoundary state={dehydratedState}>
			<Todos where="Pages Router" />
			<p style={{ textAlign: "center" }}>
				<Link href="/">App Router version</Link>
			</p>
		</HydrationBoundary>
	)
}
