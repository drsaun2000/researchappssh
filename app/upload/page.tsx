import Uploader from "@/components/uploader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppShell } from "@/components/app-sidebar"

export default function Page() {
  return (
    <AppShell>
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{'Upload and Analyze Papers'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Uploader />
        </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
