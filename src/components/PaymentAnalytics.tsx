import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, DollarSign, CreditCard, RefreshCw, Calendar, Users } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"

interface PaymentAnalytics {
  date: string
  total_transactions: number
  total_revenue: number
  successful_payments: number
  failed_payments: number
  refunded_amount: number
  payment_methods: any
}

interface BookingSummary {
  total_bookings: number
  total_revenue: number
  pending_payments: number
  completed_payments: number
}

export default function PaymentAnalytics() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics[]>([])
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    }
  }, [user])

  const checkAdminStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user?.id)
        .single()

      if (profile?.is_admin) {
        setIsAdmin(true)
        fetchAnalyticsData()
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setLoading(false)
    }
  }

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch payment analytics for last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: analyticsData } = await supabase
        .from('payment_analytics')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      setAnalytics(analyticsData || [])

      // Fetch booking summary
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, payment_status')

      if (bookings) {
        const summary = bookings.reduce((acc, booking) => {
          acc.total_bookings += 1
          acc.total_revenue += Number(booking.total_amount)
          if (booking.payment_status === 'paid') {
            acc.completed_payments += 1
          } else {
            acc.pending_payments += 1
          }
          return acc
        }, {
          total_bookings: 0,
          total_revenue: 0,
          pending_payments: 0,
          completed_payments: 0
        })

        setBookingSummary(summary)
      }

    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  // Prepare data for charts
  const revenueData = analytics.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    revenue: item.total_revenue,
    transactions: item.total_transactions
  }))

  const paymentMethodsData = analytics.reduce((acc, item) => {
    const methods = item.payment_methods as Record<string, number> || {}
    Object.entries(methods).forEach(([method, count]) => {
      acc[method] = (acc[method] || 0) + (typeof count === 'number' ? count : 0)
    })
    return acc
  }, {} as Record<string, number>)

  const pieData = Object.entries(paymentMethodsData).map(([method, count]) => ({
    name: method,
    value: count
  }))

  const successRateData = analytics.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    successRate: item.total_transactions > 0 
      ? ((item.successful_payments / item.total_transactions) * 100).toFixed(1)
      : 0,
    successful: item.successful_payments,
    failed: item.failed_payments
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
              <p className="text-gray-600">You need administrator privileges to view payment analytics.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
        <h1 className="text-3xl font-bold">Payment Analytics</h1>
        <Button onClick={fetchAnalyticsData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {bookingSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{bookingSummary.total_revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From all bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingSummary.total_bookings}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingSummary.completed_payments}</div>
              <p className="text-xs text-muted-foreground">Successful transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingSummary.pending_payments}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="success">Success Rate</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Daily revenue and transaction volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#82ca9d" name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Distribution</CardTitle>
              <CardDescription>Breakdown of payment methods used</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="success" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Success Rate</CardTitle>
              <CardDescription>Daily payment success and failure rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={successRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="successful" stackId="a" fill="#4ade80" name="Successful" />
                  <Bar dataKey="failed" stackId="a" fill="#f87171" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}