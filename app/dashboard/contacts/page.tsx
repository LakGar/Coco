"use client"

import * as React from "react"
import { useTeamStore } from "@/store/use-team-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Phone,
  Mail,
  MapPin,
  FileText,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Stethoscope,
  Users,
  Pill,
  CreditCard,
  PhoneCall,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"

interface Contact {
  id: string
  type: string
  name: string
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  isPrimary: boolean
  createdBy: {
    id: string
    name: string | null
  }
}

const contactTypes = [
  { value: "EMERGENCY_CONTACT", label: "Emergency Contact", icon: PhoneCall, color: "text-red-500" },
  { value: "EMERGENCY_SERVICES", label: "Emergency Services", icon: AlertCircle, color: "text-red-600" },
  { value: "SUPPORT_GROUP", label: "Support Group", icon: Users, color: "text-blue-500" },
  { value: "PHYSICIAN", label: "Physician", icon: Stethoscope, color: "text-green-500" },
  { value: "PHARMACY", label: "Pharmacy", icon: Pill, color: "text-purple-500" },
  { value: "INSURANCE", label: "Insurance", icon: CreditCard, color: "text-orange-500" },
  { value: "OTHER", label: "Other", icon: Phone, color: "text-muted-foreground" },
]

export default function ContactsPage() {
  const { activeTeam } = useTeamStore()
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [loading, setLoading] = React.useState(true)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingContact, setEditingContact] = React.useState<Contact | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [contactToDelete, setContactToDelete] = React.useState<Contact | null>(null)
  const [formData, setFormData] = React.useState({
    type: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    isPrimary: false,
  })

  // Fetch contacts
  const fetchContacts = React.useCallback(async () => {
    if (!activeTeam) return

    try {
      setLoading(true)
      const response = await fetch(`/api/teams/${activeTeam.id}/contacts`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      } else {
        throw new Error("Failed to fetch contacts")
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching contacts:", error)
      }
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }, [activeTeam])

  React.useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Reset form when editing or creating
  React.useEffect(() => {
    if (formOpen) {
      if (editingContact) {
        setFormData({
          type: editingContact.type,
          name: editingContact.name || "",
          phone: editingContact.phone || "",
          email: editingContact.email || "",
          address: editingContact.address || "",
          notes: editingContact.notes || "",
          isPrimary: editingContact.isPrimary || false,
        })
      } else {
        setFormData({
          type: "",
          name: "",
          phone: "",
          email: "",
          address: "",
          notes: "",
          isPrimary: false,
        })
      }
    }
  }, [formOpen, editingContact])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTeam) return

    try {
      const payload = {
        type: formData.type,
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        isPrimary: formData.isPrimary,
      }

      const url = editingContact
        ? `/api/teams/${activeTeam.id}/contacts/${editingContact.id}`
        : `/api/teams/${activeTeam.id}/contacts`

      const method = editingContact ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save contact")
      }

      toast.success(editingContact ? "Contact updated successfully" : "Contact created successfully")
      setFormOpen(false)
      setEditingContact(null)
      fetchContacts()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error saving contact:", error)
      }
      toast.error(error instanceof Error ? error.message : "Failed to save contact")
    }
  }

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!activeTeam || !contactToDelete) return

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/contacts/${contactToDelete.id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete contact")
      }

      toast.success("Contact deleted successfully")
      setDeleteDialogOpen(false)
      setContactToDelete(null)
      fetchContacts()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error deleting contact:", error)
      }
      toast.error("Failed to delete contact")
    }
  }

  const getContactTypeInfo = (type: string) => {
    return contactTypes.find((t) => t.value === type) || contactTypes[contactTypes.length - 1]
  }

  const groupedContacts = React.useMemo(() => {
    const grouped: Record<string, Contact[]> = {}
    contactTypes.forEach((type) => {
      grouped[type.value] = contacts.filter((c) => c.type === type.value)
    })
    return grouped
  }, [contacts])

  if (!activeTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-muted-foreground">No team selected</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Emergency Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage emergency contacts, physicians, and important phone numbers
          </p>
        </div>
        <Button onClick={() => {
          setEditingContact(null)
          setFormOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8 max-w-5xl mx-auto">
          {contactTypes.map((typeInfo) => {
            const typeContacts = groupedContacts[typeInfo.value]
            if (typeContacts.length === 0) return null

            const Icon = typeInfo.icon

            return (
              <div key={typeInfo.value} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                  <h2 className="text-lg font-semibold">{typeInfo.label}</h2>
                  <Badge variant="secondary">{typeContacts.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typeContacts.map((contact) => (
                    <Card key={contact.id} className="group hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">
                                {contact.name}
                              </h3>
                              {contact.isPrimary && (
                                <Badge variant="outline" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              {contact.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <a
                                    href={`tel:${contact.phone}`}
                                    className="hover:text-foreground"
                                  >
                                    {contact.phone}
                                  </a>
                                </div>
                              )}
                              {contact.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="hover:text-foreground truncate"
                                  >
                                    {contact.email}
                                  </a>
                                </div>
                              )}
                              {contact.address && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{contact.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingContact(contact)
                                setFormOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(contact)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {contact.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {contact.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}

          {contacts.length === 0 && (
            <Card className="p-12 text-center">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
              <p className="text-muted-foreground mb-4">
                Add emergency contacts and important phone numbers for quick access.
              </p>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Contact Form */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="sm:max-w-lg flex flex-col h-full p-0">
          <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <SheetTitle>
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </SheetTitle>
            <SheetDescription>
              {editingContact
                ? "Update the contact information below."
                : "Fill in the details to add a new contact."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    Contact Type <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact type" />
                      </SelectTrigger>
                      <SelectContent>
                        {contactTypes.map((typeInfo) => {
                          const Icon = typeInfo.icon
                          return (
                            <SelectItem key={typeInfo.value} value={typeInfo.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                                <span>{typeInfo.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>
                    Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Contact name"
                      required
                    />
                  </FieldContent>
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Phone</FieldLabel>
                    <FieldContent>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="Phone number"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <FieldContent>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="Email address"
                      />
                    </FieldContent>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Address</FieldLabel>
                  <FieldContent>
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Street address"
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Notes</FieldLabel>
                  <FieldContent>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Additional notes or information"
                      className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FieldContent>
                </Field>

                {(formData.type === "EMERGENCY_CONTACT" ||
                  formData.type === "PHYSICIAN") && (
                  <Field>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPrimary"
                        checked={formData.isPrimary}
                        onChange={(e) =>
                          setFormData({ ...formData, isPrimary: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="isPrimary" className="font-normal cursor-pointer">
                        Set as primary contact
                      </Label>
                    </div>
                  </Field>
                )}
              </FieldGroup>
            </div>

            <SheetFooter className="px-6 py-4 border-t shrink-0 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingContact ? "Update Contact" : "Create Contact"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{contactToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
