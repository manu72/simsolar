import { ClientRoot } from '@/components/ClientRoot'
import { InfoModal } from '@/components/ui/InfoModal'

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <ClientRoot />
      <InfoModal />
    </main>
  )
}
