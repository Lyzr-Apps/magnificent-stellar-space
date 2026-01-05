'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Menu,
  X,
  ChevronDown,
  Settings,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  Home,
  Library,
  Save,
  RefreshCw,
  MoreVertical,
  Paperclip,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Type definitions
interface Policy {
  id: string
  title: string
  type: string
  jurisdiction: string
  status: 'Draft' | 'Under Review' | 'Approved'
  createdDate: string
  lastModified: string
  content?: string
  complianceReport?: ComplianceReport
}

interface ComplianceReport {
  status: string
  result: {
    analysis: string
    findings: Array<{
      title: string
      description: string
      severity: 'low' | 'medium' | 'high'
    }>
    score: number
    recommendations: string[]
  }
  metadata: {
    agent_name: string
    timestamp: string
  }
}

interface ManagerResponse {
  status: string
  result: {
    final_output: {
      aggregated: string
      policy_draft?: string
      compliance_report?: ComplianceReport
    }
    sub_agent_results: Array<{
      agent_name: string
      status: string
      output: any
    }>
    summary: string
    workflow_completed: boolean
  }
  metadata: {
    agent_name: string
    timestamp: string
    sub_agents_used: string[]
  }
}

// Agent IDs
const POLICY_COORDINATOR_MANAGER_ID = '695c323cc2dad05ba69adc04'

// Sample policies for dashboard
const SAMPLE_POLICIES: Policy[] = [
  {
    id: '1',
    title: 'Annual Leave Policy 2025',
    type: 'Leave Policy',
    jurisdiction: 'Both',
    status: 'Approved',
    createdDate: '2025-01-01',
    lastModified: '2025-01-10',
  },
  {
    id: '2',
    title: 'Work From Home Guidelines',
    type: 'HR Policy',
    jurisdiction: 'Both',
    status: 'Under Review',
    createdDate: '2024-12-15',
    lastModified: '2025-01-05',
  },
  {
    id: '3',
    title: 'Anti-Discrimination Policy',
    type: 'Compliance Policy',
    jurisdiction: 'US',
    status: 'Draft',
    createdDate: '2025-01-03',
    lastModified: '2025-01-03',
  },
  {
    id: '4',
    title: 'Data Privacy and Protection',
    type: 'Data Policy',
    jurisdiction: 'India',
    status: 'Approved',
    createdDate: '2024-11-20',
    lastModified: '2025-01-08',
  },
]

// Main Page Component
export default function PolicyManagerApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'settings'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>(SAMPLE_POLICIES)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all')

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          activeTab={activeTab}
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              policies={policies}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              jurisdictionFilter={jurisdictionFilter}
              setJurisdictionFilter={setJurisdictionFilter}
              onCreateClick={() => setShowCreateModal(true)}
            />
          )}

          {activeTab === 'library' && (
            <LibraryView
              policies={policies}
              setPolicies={setPolicies}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* Create Policy Modal */}
      <CreatePolicyModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onPolicySaved={(newPolicy) => {
          setPolicies([...policies, newPolicy])
        }}
      />
    </div>
  )
}

// Sidebar Component
function Sidebar({
  open,
  setOpen,
  activeTab,
  setActiveTab,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
}) {
  return (
    <div
      className={cn(
        'border-r border-gray-200 bg-white transition-all duration-300 ease-in-out flex flex-col',
        open ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {open && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#1E3A5F]">Policy Pro</span>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        <SidebarItem
          icon={<Home size={20} />}
          label="Dashboard"
          active={activeTab === 'dashboard'}
          onClick={() => setActiveTab('dashboard')}
          expanded={open}
        />
        <SidebarItem
          icon={<Library size={20} />}
          label="Policy Library"
          active={activeTab === 'library'}
          onClick={() => setActiveTab('library')}
          expanded={open}
        />
        <SidebarItem
          icon={<Settings size={20} />}
          label="Settings"
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          expanded={open}
        />
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        {open && (
          <div className="text-xs text-gray-500">
            <p>Policy Manager Pro</p>
            <p className="text-[10px]">v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  expanded,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  expanded: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        active
          ? 'bg-[#1E3A5F] text-white'
          : 'text-gray-600 hover:bg-gray-100'
      )}
      title={!expanded ? label : ''}
    >
      {icon}
      {expanded && <span className="text-sm font-medium">{label}</span>}
    </button>
  )
}

// Header Component
function Header({
  activeTab,
  showCreateModal,
  setShowCreateModal,
  sidebarOpen,
  setSidebarOpen,
}: {
  activeTab: string
  showCreateModal: boolean
  setShowCreateModal: (open: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}) {
  return (
    <header className="border-b border-gray-200 bg-white h-16 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-2xl font-bold text-[#1E3A5F]">
          {activeTab === 'dashboard' && 'Dashboard'}
          {activeTab === 'library' && 'Policy Library'}
          {activeTab === 'settings' && 'Settings'}
        </h1>
      </div>
      {(activeTab === 'dashboard' || activeTab === 'library') && (
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#1E3A5F] hover:bg-[#152747] text-white gap-2"
        >
          <Plus size={18} />
          Create New Policy
        </Button>
      )}
    </header>
  )
}

// Dashboard View
function DashboardView({
  policies,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  jurisdictionFilter,
  setJurisdictionFilter,
  onCreateClick,
}: {
  policies: Policy[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  jurisdictionFilter: string
  setJurisdictionFilter: (filter: string) => void
  onCreateClick: () => void
}) {
  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = policy.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter
    const matchesJurisdiction =
      jurisdictionFilter === 'all' || policy.jurisdiction === jurisdictionFilter

    return matchesSearch && matchesStatus && matchesJurisdiction
  })

  return (
    <div className="p-8 space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Under Review">Under Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jurisdictions</SelectItem>
              <SelectItem value="US">US Only</SelectItem>
              <SelectItem value="India">India Only</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Policy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPolicies.length > 0 ? (
          filteredPolicies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">No policies found</p>
            <p className="text-sm">Try adjusting your filters or create a new policy</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Policy Card Component
function PolicyCard({ policy }: { policy: Policy }) {
  const statusColors = {
    Draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle },
    'Under Review': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
    Approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  }

  const statusConfig = statusColors[policy.status]
  const StatusIcon = statusConfig.icon

  return (
    <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base text-gray-900">{policy.title}</CardTitle>
            <CardDescription className="text-xs mt-1">{policy.type}</CardDescription>
          </div>
          <Badge className={cn('ml-2', statusConfig.bg, statusConfig.text)}>
            {policy.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {policy.jurisdiction}
          </Badge>
        </div>

        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>Modified: {formatDate(policy.lastModified)}</span>
          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1"
          >
            <Edit size={14} />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1"
          >
            <Download size={14} />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Library View
function LibraryView({
  policies,
  setPolicies,
  searchQuery,
  setSearchQuery,
}: {
  policies: Policy[]
  setPolicies: (policies: Policy[]) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}) {
  const filteredPolicies = policies.filter((policy) =>
    policy.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8 space-y-6">
      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Title</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Type</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Jurisdiction</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Created</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.map((policy, idx) => (
              <tr
                key={policy.id}
                className={cn(
                  'border-b border-gray-200 hover:bg-gray-50 transition-colors',
                  idx === filteredPolicies.length - 1 && 'border-b-0'
                )}
              >
                <td className="px-6 py-4 text-sm text-gray-900">{policy.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{policy.type}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="text-xs">
                    {policy.jurisdiction}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    className={cn(
                      'text-xs',
                      policy.status === 'Approved'
                        ? 'bg-green-100 text-green-700'
                        : policy.status === 'Under Review'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {policy.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(policy.createdDate)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                      View
                    </button>
                    <span className="text-gray-300">/</span>
                    <button className="text-gray-600 hover:text-red-600 text-xs font-medium">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPolicies.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No policies found</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Settings/Knowledge Base View
function SettingsView() {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(['companyguidelines.pdf'])
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="p-8 space-y-6">
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Knowledge Base Upload</CardTitle>
          <CardDescription>
            Upload company guidelines to train the policy generation AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#1E3A5F] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto mb-3 text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOCX, or TXT files (max 10MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={(e) => {
                const files = e.target.files
                if (files && files.length > 0) {
                  setUploadedFiles([...uploadedFiles, files[0].name])
                }
              }}
            />
          </div>

          {/* Uploaded Files */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Uploaded Files</h3>
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{file}</span>
                    </div>
                    <button className="text-red-600 hover:text-red-700 text-xs font-medium">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No files uploaded yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Create Policy Modal
function CreatePolicyModal({
  open,
  onOpenChange,
  onPolicySaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPolicySaved: (policy: Policy) => void
}) {
  const [step, setStep] = useState<'form' | 'output'>('form')
  const [formData, setFormData] = useState({
    policyType: 'leave',
    title: '',
    requirements: '',
    jurisdiction: 'both',
  })
  const [loading, setLoading] = useState(false)
  const [generatedPolicy, setGeneratedPolicy] = useState<{
    draft: string
    compliance: ComplianceReport | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGeneratePolicy = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a comprehensive ${formData.policyType} policy with the following details:

Title: ${formData.title}
Requirements: ${formData.requirements}
Jurisdiction: ${formData.jurisdiction}

Please provide:
1. A complete policy document with sections for objective, scope, eligibility, entitlements, and procedures
2. A compliance analysis against relevant ${formData.jurisdiction === 'us' ? 'US' : formData.jurisdiction === 'india' ? 'India' : 'US and India'} labour laws`,
          agent_id: POLICY_COORDINATOR_MANAGER_ID,
        }),
      })

      const data = await response.json()

      if (data.success && data.response) {
        const managerResponse = data.response as ManagerResponse

        // Extract policy draft and compliance report from the response
        let draftContent = 'Policy draft generated'
        let complianceData = null

        if (managerResponse.result?.sub_agent_results) {
          const draftResult = managerResponse.result.sub_agent_results.find(
            (r) => r.agent_name?.includes('Drafter') || r.agent_name?.includes('draft')
          )
          const complianceResult = managerResponse.result.sub_agent_results.find(
            (r) => r.agent_name?.includes('Compliance') || r.agent_name?.includes('compliance')
          )

          if (draftResult?.output) {
            draftContent = draftResult.output.policy_draft ||
                          draftResult.output.draft ||
                          draftResult.output.content ||
                          JSON.stringify(draftResult.output)
          }

          if (complianceResult?.output) {
            complianceData = complianceResult.output
          }
        }

        // Fallback: try to extract from raw response
        if (!draftContent || draftContent === 'Policy draft generated') {
          draftContent = data.raw_response || 'Policy draft has been generated'
        }

        setGeneratedPolicy({
          draft: draftContent,
          compliance: complianceData,
        })
        setStep('output')
      } else {
        setError('Failed to generate policy. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = () => {
    const newPolicy: Policy = {
      id: Date.now().toString(),
      title: formData.title,
      type: formData.policyType,
      jurisdiction: formData.jurisdiction === 'us' ? 'US' : formData.jurisdiction === 'india' ? 'India' : 'Both',
      status: 'Draft',
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      content: generatedPolicy?.draft,
      complianceReport: generatedPolicy?.compliance || undefined,
    }

    onPolicySaved(newPolicy)
    setStep('form')
    setFormData({
      policyType: 'leave',
      title: '',
      requirements: '',
      jurisdiction: 'both',
    })
    setGeneratedPolicy(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Policy</DialogTitle>
              <DialogDescription>
                Fill in the policy details to generate a draft
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Policy Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Policy Type</label>
                <Select
                  value={formData.policyType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, policyType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leave">Leave Policy</SelectItem>
                    <SelectItem value="hr">HR Policy</SelectItem>
                    <SelectItem value="compliance">Compliance Policy</SelectItem>
                    <SelectItem value="data">Data Privacy Policy</SelectItem>
                    <SelectItem value="conduct">Code of Conduct</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Policy Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Policy Title</label>
                <Input
                  placeholder="e.g., Annual Leave Policy 2025"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Requirements & Details
                </label>
                <Textarea
                  placeholder="Describe the specific requirements, constraints, or details for this policy..."
                  value={formData.requirements}
                  onChange={(e) =>
                    setFormData({ ...formData, requirements: e.target.value })
                  }
                  rows={4}
                />
              </div>

              {/* Jurisdiction */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Jurisdiction</label>
                <div className="flex gap-3">
                  {['us', 'india', 'both'].map((j) => (
                    <button
                      key={j}
                      onClick={() =>
                        setFormData({ ...formData, jurisdiction: j })
                      }
                      className={cn(
                        'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors',
                        formData.jurisdiction === j
                          ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      )}
                    >
                      {j === 'us' ? 'US Only' : j === 'india' ? 'India Only' : 'Both'}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setStep('form')
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGeneratePolicy}
                  disabled={loading || !formData.title || !formData.requirements}
                  className="bg-[#1E3A5F] hover:bg-[#152747] text-white gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Generate Policy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Review Generated Policy</DialogTitle>
              <DialogDescription>
                Review the policy draft and compliance analysis before saving
              </DialogDescription>
            </DialogHeader>

            {generatedPolicy && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-hidden">
                  {/* Policy Draft */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-200 p-3">
                      <h3 className="text-sm font-semibold text-gray-900">Policy Draft</h3>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {generatedPolicy.draft}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Compliance Report */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-200 p-3">
                      <h3 className="text-sm font-semibold text-gray-900">Compliance Analysis</h3>
                    </div>
                    <ScrollArea className="flex-1 p-4 space-y-3">
                      {generatedPolicy.compliance?.result?.findings ? (
                        <div className="space-y-3">
                          {generatedPolicy.compliance.result.findings.map((finding, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border"
                              style={{
                                borderColor:
                                  finding.severity === 'high'
                                    ? '#EF4444'
                                    : finding.severity === 'medium'
                                    ? '#F59E0B'
                                    : '#10B981',
                                backgroundColor:
                                  finding.severity === 'high'
                                    ? '#FEE2E2'
                                    : finding.severity === 'medium'
                                    ? '#FEF3C7'
                                    : '#ECFDF5',
                              }}
                            >
                              <div className="flex items-start gap-2">
                                {finding.severity === 'high' ? (
                                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                                ) : finding.severity === 'medium' ? (
                                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Info size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900">
                                    {finding.title}
                                  </p>
                                  <p className="text-xs text-gray-700 mt-1">
                                    {finding.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No compliance findings available</p>
                      )}
                    </ScrollArea>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('form')
                      setGeneratedPolicy(null)
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      const content = `${generatedPolicy.draft}`
                      const blob = new Blob([content], { type: 'text/plain' })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${formData.title.replace(/\s+/g, '_')}.txt`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      window.URL.revokeObjectURL(url)
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download size={16} />
                    Export PDF
                  </Button>
                  <Button
                    onClick={handleSaveDraft}
                    className="bg-[#1E3A5F] hover:bg-[#152747] text-white gap-2"
                  >
                    <Save size={16} />
                    Save Draft
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Utility function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
