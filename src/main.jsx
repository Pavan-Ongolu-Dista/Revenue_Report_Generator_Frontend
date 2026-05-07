import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { 
  AppProvider, 
  Page, 
  Card, 
  Text, 
  Box, 
  DatePicker, 
  Select, 
  Button, 
  InlineStack, 
  DataTable, 
  RadioButton, 
  Banner,
  Spinner,
  ProgressBar,
  Badge,
  Divider,
  Layout,
  LegacyCard,
  Tabs
} from '@shopify/polaris'
import '@shopify/polaris/build/esm/styles.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
const shouldIncludeCredentials = (typeof window !== 'undefined') && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  API_BASE.includes('localhost') ||
  API_BASE.includes('127.0.0.1')
)

const customerInfo = {
  '8688425369879': { name: 'Auxia Team', email: 'auxia@veeryoffices.com' },
  '8736318325015': { name: 'Baidu C200 Team', email: 'baiduc200@veeryoffices.com' },
  '8718672560407': { name: 'Baidu Team', email: 'baidu@veeryoffices.com' },
  '8721200316695': { name: 'Chai-Research Team', email: 'chai@veeryoffices.com' },
  '8940864995607': { name: 'Comulate Team', email: 'comulate@veeryoffices.com' },
  '8721199399191': { name: 'Hattrick Capital Team', email: 'hattrick@veeryoffices.com' },
  '8704188973335': { name: 'Marwood Team', email: 'marwood@veeryoffices.com' },
  '8688428843287': { name: 'Peloton Team', email: 'peloton@veeryoffices.com' },
  '8786145509655': { name: 'Starting Gate Team', email: 'startinggate@veeryoffices.com' },
  '8685830766871': { name: 'Sully AI Team', email: 'sully@veeryoffices.com' },
  '8721200939287': { name: 'Uphonest Team', email: 'uphonest@veeryoffices.com' },
  '8688802627863': { name: 'Veery Team', email: 'v@veeryoffices.com' },
  '8703720751383': { name: 'Workstream Team', email: 'workstream@veeryoffices.com' },
  '8726904209687': { name: 'Workstream MP Team', email: 'workstreammp@veeryoffices.com' },
  '8898937094423': { name: 'Workstream UTAH Team', email: 'workstreamutah@veeryoffices.com' },
  '9138324275479': { name: '@3120 Team'},
  '9161889743127': { name: 'Llamaindex Team', email: 'llamaindex@veeryoffices.com'},
  '9253797691671': { name: 'AYR Energy Team', email: 'ayrenergy@veeryoffices.com'},
  '9253770690839': { name: 'Lemon slice Team', email: 'lemonslice@veeryoffices.com'},
  '9354786537751': { name: 'Plain Team', email: 'plain@veeryoffices.com'}
};

function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    let aborted = false
    async function run() {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/api/customers`, {
          headers: { 'Accept': 'application/json' },
          credentials: shouldIncludeCredentials ? 'include' : 'omit'
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        

        const options = (json.customers || []).map(c => {
          const customerId = String(c.id);
          const info = customerInfo[customerId];
          
          if (info) {
            return {
              label: info.name,
              value: customerId
            };
          } else {
            return {
              label: customerId,
              value: customerId
            };
          }
        })
        if (!aborted) setCustomers(options)
      } catch (e) {
        if (!aborted) setError(String(e))
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    run()
    return () => { aborted = true }
  }, [])
  return { customers, loading, error }
}

function App() {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [start, setStart] = useState(startOfMonth)
  const [end, setEnd] = useState(today)
  const [metric, setMetric] = useState('billing') // 'billing' | 'actual'
  const { customers, loading: customersLoading, error: customersError } = useCustomers()
  const [customerId, setCustomerId] = useState('')
  const [summary, setSummary] = useState([])
  const [detail, setDetail] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [orderDetails, setOrderDetails] = useState([])
  const [orderDetailsSummary, setOrderDetailsSummary] = useState(null)

  async function runReport() {
    try {
      setBusy(true); setErr(''); setProgress(0)
      
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const body = {
        start: start.toISOString(),
        end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).toISOString(),
        metric,
        customerId: customerId ? Number(customerId) : undefined
      }
      
      const res = await fetch(`${API_BASE}/api/report`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: shouldIncludeCredentials ? 'include' : 'omit',
        body: JSON.stringify(body) 
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const json = await res.json()
      setSummary(json.summary || [])
      setDetail(json.detail || [])
      setAnalytics(json.analytics || null)
      setActiveTab(0)
      
      setTimeout(() => setProgress(0), 1000)
    } catch (e) {
      setErr(String(e))
      setProgress(0)
    } finally {
      setBusy(false)
    }
  }

  async function fetchOrderDetails() {
    try {
      if (!customerId) {
        setErr('Please select a customer first')
        return
      }
      
      setBusy(true); setErr(''); setProgress(0)
      
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const body = {
        start: start.toISOString(),
        end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).toISOString(),
        customerId: Number(customerId)
      }
      
      console.log('Fetching order details with:', body)
      console.log('API Base:', API_BASE)
      
      const res = await fetch(`${API_BASE}/api/order-details`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: shouldIncludeCredentials ? 'include' : 'omit',
        body: JSON.stringify(body) 
      })
      
      clearInterval(progressInterval)
      setProgress(100)
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Error from server:', errorData)
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }
      
      const json = await res.json()
      console.log('Received data:', json)
      setOrderDetails(json.order_line_items || [])
      setOrderDetailsSummary(json.summary || null)
      setActiveTab(1)
      
      setTimeout(() => setProgress(0), 1000)
    } catch (e) {
      console.error('Fetch error:', e)
      setErr(String(e))
      setProgress(0)
    } finally {
      setBusy(false)
    }
  }

  const handleTabChange = (newTabIndex) => {
    setActiveTab(newTabIndex)
  }

  const summaryRows = useMemo(() => (summary || []).map(r => [
    r.customer,
    r.month,
    String(r.orders),
    Number(r.amount).toFixed(2),
    r.order_numbers || ''
  ]), [summary])

  const tabs = [
    {
      id: 'revenue-report',
      content: 'Revenue Report',
      isActive: activeTab === 0,
      onAction: () => handleTabChange(0)
    },
    {
      id: 'order-details',
      content: 'Order Details',
      isActive: activeTab === 1,
      onAction: () => handleTabChange(1)
    }
  ]

  return (
    <AppProvider>
      <Box padding="400">
        <Page title="Monthly Revenue Calculator">
          {customersError || err ? (
            <Banner tone="critical" title="Error">
              <p>{customersError || err}</p>
            </Banner>
          ) : null}
          
          <Card>
            <Box padding="400">
              <InlineStack gap="400" align="start">
                <Box>
                  <Text as="h3" variant="headingSm">Date range</Text>
                  <InlineStack gap="200">
                    <input type="date" value={start.toISOString().slice(0,10)} onChange={e=>setStart(new Date(e.target.value))} />
                    <input type="date" value={end.toISOString().slice(0,10)} onChange={e=>setEnd(new Date(e.target.value))} />
                  </InlineStack>
                </Box>
                <Box>
                  <Text as="h3" variant="headingSm">Metric</Text>
                  <InlineStack gap="200">
                    <RadioButton label="Billing amount" checked={metric==='billing'} id="metric-billing" name="metric" onChange={()=>setMetric('billing')} />
                  </InlineStack>
                </Box>
                <Box minWidth="300px">
                  <Text as="h3" variant="headingSm">Customer</Text>
                  <Select options={[{label:'All customers', value:''}, ...customers]} value={customerId} onChange={setCustomerId} disabled={customersLoading} />
                </Box>
              </InlineStack>
              <InlineStack marginTop="400" gap="200">
                <Box>
                  <Button primary loading={busy} onClick={runReport}>Order Level Report</Button>
                </Box>
                <Box>
                  <Button loading={busy} onClick={fetchOrderDetails}>Item Level Report</Button>
                </Box>
              </InlineStack>
              
              {busy && (
                <Box marginTop="500" paddingTop="500" paddingBottom="300">
                  <Text as="p" variant="bodySm" color="subdued" paddingTop="200" marginTop="500">Processing...</Text>
                  <ProgressBar progress={progress} marginTop="2000" />
                  
                </Box>
              )}
            </Box>
          </Card>

          {/* Tabs for switching between views */}
          {(detail.length > 0 || orderDetails.length > 0) && (
            <Box paddingY="400">
              <Tabs tabs={tabs} selected={activeTab} onSelect={setActiveTab} />
            </Box>
          )}

          {/* Revenue Report Tab */}
          {activeTab === 0 && analytics && (
            <Box paddingY="400">
              <Layout>
                <Layout.Section>
                  <LegacyCard title="Analytics Summary" sectioned>
                    <InlineStack gap="400" align="space-between">
                      <Box>
                        <Text as="h4" variant="headingMd">Total Revenue</Text>
                        <Text as="p" variant="headingLg">${analytics.totalRevenue.toLocaleString()}</Text>
                      </Box>
                      <Box>
                        <Text as="h4" variant="headingMd">Total Orders</Text>
                        <Text as="p" variant="headingLg">{analytics.totalOrders.toLocaleString()}</Text>
                      </Box>
                      <Box>
                        <Text as="h4" variant="headingMd">Unique Customers</Text>
                        <Text as="p" variant="headingLg">{analytics.uniqueCustomers}</Text>
                      </Box>
                      <Box>
                        <Text as="h4" variant="headingMd">Avg Profit Margin</Text>
                        <Text as="p" variant="headingLg">{analytics.avgProfitMargin}%</Text>
                      </Box>
                    </InlineStack>
                  </LegacyCard>
                </Layout.Section>
              </Layout>
            </Box>
          )}

          {activeTab === 0 && detail.length > 0 && (
            <Box paddingY="400">
              <Card>
                <Box padding="400">
                  <InlineStack gap="200" align="space-between">
                    <Text as="h3" variant="headingSm">Order Details</Text>
                    <Badge status="success">{detail.length} orders</Badge>
                  </InlineStack>
                  
                  <Box paddingY="300">
                    <DataTable
                      columnContentTypes={[ 'text','text','text','text','numeric','numeric','numeric','numeric','numeric' ]}
                      headings={[ 'Order #','Date','Customer','Email','Line Items','Additional Taxes','Billing','Actual','Profit %' ]}
                      rows={detail.map(d => [
                        d.order_number || `#${d.order_id}`,
                        new Date(d.order_date).toLocaleDateString(),
                        d.customer_name || d.customer_id || 'Unknown',
                        d.customer_email || '-',
                        `$${d.line_sum.toFixed(2)}`,
                        `$${d.additional_charges.toFixed(2)}`,
                        `$${d.billing_amount.toFixed(2)}`,
                        `$${d.actual_spend.toFixed(2)}`,
                        `${d.profit_margin.toFixed(1)}%`
                      ])}
                    />
                  </Box>
                  
                  <Divider />
                  
                  <Box paddingY="400">
                    <Text as="h3" variant="headingSm" paddingBottom="300">Total Summary</Text>
                    <Layout>
                      <Layout.Section>
                        <LegacyCard sectioned>
                          <InlineStack gap="400" align="space-between">
                            <Box>
                              <Text as="h4" variant="headingMd">Total Orders</Text>
                              <Text as="p" variant="headingLg">{detail.length}</Text>
                            </Box>
                            <Box>
                              <Text as="h4" variant="headingMd">Total Line Items</Text>
                              <Text as="p" variant="headingLg">${detail.reduce((sum, d) => sum + d.line_sum, 0).toFixed(2)}</Text>
                            </Box>
                            <Box>
                              <Text as="h4" variant="headingMd">Total Additional Taxes</Text>
                              <Text as="p" variant="headingLg">${detail.reduce((sum, d) => sum + d.additional_charges, 0).toFixed(2)}</Text>
                            </Box>
                            <Box>
                              <Text as="h4" variant="headingMd">Total Billing Amount</Text>
                              <Text as="p" variant="headingLg">${detail.reduce((sum, d) => sum + d.billing_amount, 0).toFixed(2)}</Text>
                            </Box>
                            <Box>
                              <Text as="h4" variant="headingMd">Total Actual Spend</Text>
                              <Text as="p" variant="headingLg">${detail.reduce((sum, d) => sum + d.actual_spend, 0).toFixed(2)}</Text>
                            </Box>
                            <Box>
                              <Text as="h4" variant="headingMd">Average Profit Margin</Text>
                              <Text as="p" variant="headingLg">{detail.length > 0 ? (detail.reduce((sum, d) => sum + d.profit_margin, 0) / detail.length).toFixed(1) : 0}%</Text>
                            </Box>
                          </InlineStack>
                        </LegacyCard>
                      </Layout.Section>
                    </Layout>
                  </Box>
                  
                  <Divider />
                  
                  <Box paddingY="500" paddingTop="1600" marginTop="1600">
                    <InlineStack gap="200">
                      <Button onClick={()=>{
                        const csv = [
                          'customer,month,orders,amount,order_numbers',
                          ...summary.map(r=>{
                            const displayName = customerInfo[r.customer]?.name || r.customer;
                            return `${JSON.stringify(displayName)},${r.month},${r.orders},${r.amount},${JSON.stringify(r.order_numbers||'')}`;
                          })
                        ].join('\n')
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href=url; a.download=`revenue_${metric}_${start.toISOString().slice(0,10)}_${end.toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
                      }}>Export Summary CSV</Button>
                      <Button onClick={()=>{
                        const cols = ['order_id','order_number','order_date','customer_name','customer_email','line_sum','additional_taxes','billing_amount','actual_spend','profit_margin']
                        const csv = [cols.join(','), ...detail.map(d=>cols.map(c=>c==='additional_taxes' ? JSON.stringify(d.additional_charges ?? '') : JSON.stringify(d[c] ?? '')).join(','))].join('\n')
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href=url; a.download=`orders_${metric}_${start.toISOString().slice(0,10)}_${end.toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
                      }}>Export Per-Order CSV</Button>
                    </InlineStack>
                  </Box>
                </Box>
              </Card>
            </Box>
          )}

          {/* Order Details Tab */}
          {activeTab === 1 && orderDetails.length > 0 && (
            (() => {
              // Group items by order number (or order_id when missing)
              const groups = {}
              for (const it of orderDetails) {
                const key = it.order_number || String(it.order_id)
                if (!groups[key]) groups[key] = []
                groups[key].push(it)
              }

              const grouped = Object.keys(groups).map(orderNum => ({ orderNum, items: groups[orderNum] }))

              // Totals
              const totalLineAmount = orderDetails.reduce((s, it) => s + (Number(it.price) || 0), 0)
              const totalAdditionalCharges = grouped.reduce((s, g) => {
                // find first non-zero additional charge for the order
                const first = g.items.find(i => i.additional_charges && Number(i.additional_charges) !== 0)
                return s + (first ? Number(first.additional_charges) : 0)
              }, 0)
              const totalWithCharges = totalLineAmount + totalAdditionalCharges

              return (
                <>
                  <Box paddingY="400">
                    <Card>
                      <Box padding="400">
                        <Text as="h3" variant="headingSm" paddingBottom="300">Order Line Items</Text>
                        <Text as="p" variant="bodySm" color="subdued" paddingBottom="300">
                          Showing {orderDetails.length} line items for {orderDetailsSummary?.date_range?.start ? new Date(orderDetailsSummary.date_range.start).toLocaleDateString() : ''} to {orderDetailsSummary?.date_range?.end ? new Date(orderDetailsSummary.date_range.end).toLocaleDateString() : ''}
                        </Text>

                        <Box paddingY="300" style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                            <thead>
                              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                <th style={{ padding: '8px' }}>Order Num</th>
                                <th style={{ padding: '8px' }}>CreatedDate</th>
                                <th style={{ padding: '8px' }}>FulfilledDate</th>
                                <th style={{ padding: '8px' }}>Product</th>
                                <th style={{ padding: '8px' }}>UnitPrice</th>
                                <th style={{ padding: '8px' }}>Qty</th>
                                <th style={{ padding: '8px' }}>Price</th>
                                <th style={{ padding: '8px' }}>Additional Taxes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grouped.map(g => {
                                const rowspan = g.items.length
                                // find first additional charge for order
                                const add = g.items.find(i => i.additional_charges && Number(i.additional_charges) !== 0)
                                return g.items.map((item, idx) => (
                                  <tr key={`${g.orderNum}-${idx}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '8px', verticalAlign: 'top' }}>{g.orderNum}</td>
                                    <td style={{ padding: '8px', verticalAlign: 'top' }}>{new Date(item.created_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px', verticalAlign: 'top' }}>{item.fulfilled_date ? new Date(item.fulfilled_date).toLocaleDateString() : new Date(item.created_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '8px', verticalAlign: 'top', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_title || 'N/A'}</td>
                                    <td style={{ padding: '8px', verticalAlign: 'top' }}>${Number(item.unit_price).toFixed(2)}</td>
                                    <td style={{ padding: '8px', verticalAlign: 'top' }}>{String(item.quantity)}</td>
                                    <td style={{ padding: '8px', verticalAlign: 'top' }}>${Number(item.price).toFixed(2)}</td>
                                    {idx === 0 ? (
                                      <td style={{ padding: '8px', verticalAlign: 'top' }} rowSpan={rowspan}>{add ? `$${Number(add.additional_charges).toFixed(2)}` : ''}</td>
                                    ) : null}
                                  </tr>
                                ))
                              })}
                            </tbody>
                            <tfoot>
                              <tr style={{ borderTop: '2px solid #ddd' }}>
                                <td style={{ padding: '8px' }} colSpan={6}><strong>Totals</strong></td>
                                <td style={{ padding: '8px' }}><strong>${totalLineAmount.toFixed(2)}</strong></td>
                                <td style={{ padding: '8px' }}><strong>${totalAdditionalCharges.toFixed(2)}</strong></td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px' }} colSpan={7}><strong>Grand Total (line items + additional taxes)</strong></td>
                                <td style={{ padding: '8px' }}><strong>${totalWithCharges.toFixed(2)}</strong></td>
                              </tr>
                            </tfoot>
                          </table>
                        </Box>
                      </Box>
                    </Card>
                  </Box>

                  {/* Summary Card (keeps the server-provided summary but shows computed totals too) */}
                  <Box paddingY="400">
                    <Card>
                      <Box padding="400">
                        <Text as="h3" variant="headingSm" paddingBottom="300">Summary</Text>
                        <Layout>
                          <Layout.Section>
                            <LegacyCard sectioned>
                              <InlineStack gap="400" align="space-between">
                                <Box>
                                  <Text as="h4" variant="headingMd">Total Line Items</Text>
                                  <Text as="p" variant="headingLg">{orderDetails.length}</Text>
                                </Box>
                                <Box>
                                  <Text as="h4" variant="headingMd">Total Amount</Text>
                                  <Text as="p" variant="headingLg">${totalLineAmount.toFixed(2)}</Text>
                                </Box>
                                <Box>
                                  <Text as="h4" variant="headingMd">Additional Taxes</Text>
                                  <Text as="p" variant="headingLg">${totalAdditionalCharges.toFixed(2)}</Text>
                                </Box>
                                <Box>
                                  <Text as="h4" variant="headingMd">Total with Charges</Text>
                                  <Text as="p" variant="headingLg">${totalWithCharges.toFixed(2)}</Text>
                                </Box>
                              </InlineStack>
                            </LegacyCard>
                          </Layout.Section>
                        </Layout>
                      </Box>
                    </Card>
                  </Box>

                  {/* Export Button */}
                  <Box paddingY="400">
                    <Button onClick={()=>{
                      const headers = ['OrderID', 'CreatedDate', 'FulfilledDate', 'Product', 'UnitPrice', 'Qty', 'Price', 'Additional Taxes']
                      const csvLines = [headers.join(',')]
                      
                      grouped.forEach(g => {
                        // write each row; additional taxes only on first row
                        const add = g.items.find(i => i.additional_charges && Number(i.additional_charges) !== 0)
                        g.items.forEach((item, idx) => {
                          const additionalValue = add ? Number(add.additional_charges).toFixed(2) : ''
                          const row = [
                            g.orderNum,
                            item.created_date,
                            item.fulfilled_date || item.created_date,
                            JSON.stringify(item.product_title),
                            Number(item.unit_price).toFixed(2),
                            item.quantity,
                            Number(item.price).toFixed(2),
                            idx === 0 ? (add ? additionalValue : '') : ''
                          ].join(',')
                          csvLines.push(row)
                        })
                      })

                      // append totals row
                      csvLines.push(['', '', '', '', '', '', `Totals: ${totalLineAmount.toFixed(2)}`, totalAdditionalCharges.toFixed(2)].join(','))

                      const csv = csvLines.join('\n')
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `order_details_${start.toISOString().slice(0,10)}_${end.toISOString().slice(0,10)}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}>Export to CSV</Button>
                  </Box>
                </>
              )
            })()
          )}
        </Page>
      </Box>
    </AppProvider>
  )
}

createRoot(document.getElementById('root')).render(<App />)


