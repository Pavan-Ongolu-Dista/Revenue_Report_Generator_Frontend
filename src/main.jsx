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
  LegacyCard
} from '@shopify/polaris'
import '@shopify/polaris/build/esm/styles.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

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
  '8898937094423': { name: 'Workstream UTAH Team', email: 'workstreamutah@veeryoffices.com' }
  '9138324275479': { name: '@3120 Team'},
  '9161889743127': { name: 'Llamaindex Team', email: 'llamaindex@veeryoffices.com'
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
        const res = await fetch(`${API_BASE}/api/customers`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        // Customer information mapping
        

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

  async function runReport() {
    try {
      setBusy(true); setErr(''); setProgress(0)
      
      // Simulate progress updates
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
        headers: { 'Content-Type': 'application/json' }, 
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
      
      setTimeout(() => setProgress(0), 1000) // Reset progress after completion
    } catch (e) {
      setErr(String(e))
      setProgress(0)
    } finally {
      setBusy(false)
    }
  }

  const summaryRows = useMemo(() => (summary || []).map(r => [
    r.customer,
    r.month,
    String(r.orders),
    Number(r.amount).toFixed(2),
    r.order_numbers || ''
  ]), [summary])

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
                    <RadioButton label="Actual spend" checked={metric==='actual'} id="metric-actual" name="metric" onChange={()=>setMetric('actual')} />
                  </InlineStack>
                </Box>
                <Box minWidth="300px">
                  <Text as="h3" variant="headingSm">Customer</Text>
                  <Select options={[{label:'All customers', value:''}, ...customers]} value={customerId} onChange={setCustomerId} disabled={customersLoading} />
                </Box>
                <Box>
                  <Button primary loading={busy} onClick={runReport}>Generate Report</Button>
                </Box>
              </InlineStack>
              
              {busy && (
                <Box paddingTop="300">
                  <ProgressBar progress={progress} />
                  <Text as="p" variant="bodySm" color="subdued">Generating report...</Text>
                </Box>
              )}
            </Box>
          </Card>

          {analytics && (
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

          {detail.length > 0 && (
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
                      headings={[ 'Order #','Date','Customer','Email','Line Items','Additional','Billing','Actual','Profit %' ]}
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
                  
                  {/* Total Summary Section */}
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
                              <Text as="h4" variant="headingMd">Total Additional Charges</Text>
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
                        const cols = ['order_id','order_number','order_date','customer_name','customer_email','line_sum','additional_charges','billing_amount','actual_spend','profit_margin']
                        const csv = [cols.join(','), ...detail.map(d=>cols.map(c=>JSON.stringify(d[c] ?? '')).join(','))].join('\n')
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
        </Page>
      </Box>
    </AppProvider>
  )
}

createRoot(document.getElementById('root')).render(<App />)


