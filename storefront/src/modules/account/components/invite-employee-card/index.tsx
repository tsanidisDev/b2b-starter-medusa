"use client"

import Button from "@/modules/common/components/button"
import Input from "@/modules/common/components/input"
import { QueryCompany } from "@/types"
import { Container, Text, toast } from "@medusajs/ui"

const InviteEmployeeCard = ({ company }: { company: QueryCompany }) => {
  return (
    <Container className="p-0 overflow-hidden">
      <div className="grid small:grid-cols-4 grid-cols-2 gap-4 p-4 border-b border-border">
        <div className="flex flex-col gap-y-2">
          <Text className="font-medium text-foreground">Name</Text>
          <Input name="first_name" label="First name" />
        </div>
        <div className="flex flex-col gap-y-2 justify-end">
          <Input name="last_name" label="Last name" />
        </div>
        <div className="flex flex-col col-span-2 gap-y-2">
          <Text className="font-medium text-foreground">Email</Text>
          <Input name="email" label="Enter an email" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 bg-muted/30 p-4">
        <Button variant="primary" onClick={() => toast.info("Not implemented")}>
          Send Invite
        </Button>
      </div>
    </Container>
  )
}

export default InviteEmployeeCard
