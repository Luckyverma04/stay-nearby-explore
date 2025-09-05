import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { CreditCard, Receipt, RefreshCw, Download, DollarSign, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface PaymentLog {
  id: string
  booking_id: string
  amount: number
  currency: string
  status: string
  payment_provider: string
  transaction_id: string
  created_at: string
  bookings?: {
    booking_reference: string
    hotels: {
      name: string
    }
  }
}

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  currency: string
  status: string
  generated_at: string
  due_date: string
  paid_at?: string
  invoice_data: any
}

interface Refund {
  id: string
  booking_id: string
  refund_amount: number
  refund_reason: string
  status: string
  requested_at: string
  processed_at?: string
  refund_reference?: string
}

export default function PaymentDashboard() {
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPaymentData()
    }
  }, [user])

  const fetchPaymentData = async () => {
    setLoading(true)
    try {
      // Fetch payment logs (admin only)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user?.id)
        .single()

      if (profile?.is_admin) {
        const { data: logs } = await supabase
          .from('payment_logs')
          .select(`
            *,
            bookings(
              booking_reference,
              hotels(name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20)

        setPaymentLogs(logs || [])
      }

      // Fetch user's invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .order('generated_at', { ascending: false })

      setInvoices(invoicesData || [])

      // Fetch user's refunds
      const { data: refundsData } = await supabase
        .from('refunds')
        .select('*')
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false })

      setRefunds(refundsData || [])

    } catch (error) {
      console.error('Error fetching payment data:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payment data",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  const handleRefundRequest = async () => {
    if (!refundAmount || !refundReason || !selectedBookingId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('refund-processor', {
        body: {
          bookingId: selectedBookingId,
          refundAmount: parseFloat(refundAmount),
          reason: refundReason,
          action: 'request'
        }
      })

      if (error) throw error

      toast({
        title: "Success",
        description: data.message
      })

      setRefundDialogOpen(false)
      setRefundAmount('')
      setRefundReason('')
      setSelectedBookingId('')
      fetchPaymentData()
    } catch (error) {
      console.error('Error requesting refund:', error)
      toast({
        title: "Error",
        description: "Failed to submit refund request",
        variant: "destructive"
      })
    }
  }

  const generateInvoice = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('invoice-generator', {
        body: { bookingId }
      })

      if (error) throw error

      toast({
        title: "Success",
        description: data.message
      })

      fetchPaymentData()
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'success':
      case 'approved':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'failed':
      case 'rejected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment Dashboard</h1>
        <Button onClick={fetchPaymentData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="payments">Payment Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Your Invoices</h2>
          </div>

          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                    <CardDescription>
                      Generated: {format(new Date(invoice.generated_at), 'PPP')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-xl font-semibold">₹{invoice.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Due Date</p>
                      <p className="text-sm">{format(new Date(invoice.due_date), 'PPP')}</p>
                    </div>
                    {invoice.paid_at && (
                      <div>
                        <p className="text-sm text-gray-600">Paid Date</p>
                        <p className="text-sm">{format(new Date(invoice.paid_at), 'PPP')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {invoices.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No invoices found</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Refund Requests</h2>
            <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
              <DialogTrigger asChild>
                <Button>Request Refund</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Refund</DialogTitle>
                  <DialogDescription>
                    Submit a refund request for your booking.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bookingId">Booking ID</Label>
                    <Input
                      id="bookingId"
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                      placeholder="Enter booking ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="refundAmount">Refund Amount</Label>
                    <Input
                      id="refundAmount"
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="refundReason">Reason</Label>
                    <Textarea
                      id="refundReason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Explain the reason for refund"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleRefundRequest}>Submit Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {refunds.map((refund) => (
              <Card key={refund.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">Refund Request</CardTitle>
                    <CardDescription>
                      Requested: {format(new Date(refund.requested_at), 'PPP')}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(refund.status)}>
                    {refund.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-semibold">₹{refund.refund_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reason:</span>
                      <span className="text-sm">{refund.refund_reason}</span>
                    </div>
                    {refund.refund_reference && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Reference:</span>
                        <span className="text-sm font-mono">{refund.refund_reference}</span>
                      </div>
                    )}
                    {refund.processed_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Processed:</span>
                        <span className="text-sm">{format(new Date(refund.processed_at), 'PPP')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {refunds.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No refund requests found</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <h2 className="text-2xl font-semibold">Payment Logs</h2>
          
          <div className="grid gap-4">
            {paymentLogs.map((log) => (
              <Card key={log.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{log.transaction_id}</CardTitle>
                    <CardDescription>
                      {log.bookings?.hotels?.name} - {log.bookings?.booking_reference}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(log.status)}>
                    {log.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Amount</p>
                      <p className="text-xl font-semibold">{log.currency} {log.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Provider</p>
                      <p className="text-sm capitalize">{log.payment_provider}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="text-sm">{format(new Date(log.created_at), 'PPP')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {paymentLogs.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No payment logs found</p>
                    <p className="text-sm text-gray-500 mt-2">Admin access required to view payment logs</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}