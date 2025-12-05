"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react"

const PAGE_SIZE = 50

interface Property {
  id: string
  title: string
  postcode: string
  price: number
  transaction_type: string
  property_type: string | null
  bedrooms: number
  bathrooms: number
  status: string
  apex27_id: string
  agent: {
    id: string
    subdomain: string
    apex27_branch_id: string | null
    profile: {
      first_name: string
      last_name: string
    } | null
  } | null
}

interface PropertiesTableProps {
  properties: Property[]
  totalCount: number
}

type SortField = "title" | "price" | "bedrooms" | "status" | "agent" | "updated_at"
type SortDirection = "asc" | "desc"

export function PropertiesTable({ properties, totalCount }: PropertiesTableProps) {
  // Filter states
  const [agentFilter, setAgentFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [transactionFilter, setTransactionFilter] = useState<string>("")
  const [bedroomsFilter, setBedroomsFilter] = useState<string>("")
  const [postcodeFilter, setPostcodeFilter] = useState<string>("")
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("")

  // Sort state
  const [sortField, setSortField] = useState<SortField>("updated_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Get unique values for filter dropdowns
  const agents = useMemo(() => {
    const agentMap = new Map<string, string>()
    properties.forEach((p) => {
      if (p.agent?.id && p.agent.profile) {
        const name = `${p.agent.profile.first_name} ${p.agent.profile.last_name}`
        agentMap.set(p.agent.id, name)
      }
    })
    return Array.from(agentMap.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [properties])

  const statuses = useMemo(() => {
    return [...new Set(properties.map((p) => p.status))].sort()
  }, [properties])

  const transactionTypes = useMemo(() => {
    return [...new Set(properties.map((p) => p.transaction_type))].sort()
  }, [properties])

  const bedroomOptions = useMemo(() => {
    return [...new Set(properties.map((p) => p.bedrooms).filter((b) => b > 0))].sort((a, b) => a - b)
  }, [properties])

  const propertyTypes = useMemo(() => {
    return [...new Set(properties.map((p) => p.property_type).filter(Boolean))].sort() as string[]
  }, [properties])

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    let result = properties.filter((property) => {
      if (agentFilter && property.agent?.id !== agentFilter) return false
      if (statusFilter && property.status !== statusFilter) return false
      if (transactionFilter && property.transaction_type !== transactionFilter) return false
      if (bedroomsFilter && property.bedrooms !== parseInt(bedroomsFilter)) return false
      if (postcodeFilter && !property.postcode?.toLowerCase().includes(postcodeFilter.toLowerCase())) return false
      if (propertyTypeFilter && property.property_type !== propertyTypeFilter) return false
      return true
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "price":
          comparison = a.price - b.price
          break
        case "bedrooms":
          comparison = a.bedrooms - b.bedrooms
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
        case "agent":
          const aName = a.agent?.profile ? `${a.agent.profile.first_name} ${a.agent.profile.last_name}` : ""
          const bName = b.agent?.profile ? `${b.agent.profile.first_name} ${b.agent.profile.last_name}` : ""
          comparison = aName.localeCompare(bName)
          break
        default:
          comparison = 0
      }
      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [properties, agentFilter, statusFilter, transactionFilter, bedroomsFilter, postcodeFilter, propertyTypeFilter, sortField, sortDirection])

  // Paginate filtered results
  const totalPages = Math.ceil(filteredProperties.length / PAGE_SIZE)
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredProperties.slice(start, start + PAGE_SIZE)
  }, [filteredProperties, currentPage])

  // Scroll to top when page changes
  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset to page 1 when filters change
  const handleFilterChange = <T extends string>(setter: (val: T) => void, value: T) => {
    setter(value)
    setCurrentPage(1)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-gray-400" />
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    )
  }

  const clearFilters = () => {
    setAgentFilter("")
    setStatusFilter("")
    setTransactionFilter("")
    setBedroomsFilter("")
    setPostcodeFilter("")
    setPropertyTypeFilter("")
    setCurrentPage(1)
  }

  const hasActiveFilters = agentFilter || statusFilter || transactionFilter || bedroomsFilter || postcodeFilter || propertyTypeFilter

  // Calculate displayed range
  const startItem = (currentPage - 1) * PAGE_SIZE + 1
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredProperties.length)

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Agent filter */}
          <select
            value={agentFilter}
            onChange={(e) => handleFilterChange(setAgentFilter, e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Agents</option>
            {agents.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* Transaction type filter */}
          <select
            value={transactionFilter}
            onChange={(e) => handleFilterChange(setTransactionFilter, e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Bedrooms filter */}
          <select
            value={bedroomsFilter}
            onChange={(e) => handleFilterChange(setBedroomsFilter, e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Bedrooms</option>
            {bedroomOptions.map((beds) => (
              <option key={beds} value={beds}>
                {beds} bed{beds !== 1 ? "s" : ""}
              </option>
            ))}
          </select>

          {/* Property type filter */}
          <select
            value={propertyTypeFilter}
            onChange={(e) => handleFilterChange(setPropertyTypeFilter, e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All Property Types</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* Postcode search */}
          <input
            type="text"
            value={postcodeFilter}
            onChange={(e) => handleFilterChange(setPostcodeFilter, e.target.value)}
            placeholder="Search postcode..."
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        <div className="ml-auto text-sm text-gray-600">
          {filteredProperties.length === totalCount
            ? `${totalCount} properties`
            : `${filteredProperties.length} of ${totalCount} properties`}
        </div>
      </div>

      {/* Table */}
      {filteredProperties.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">
            {properties.length === 0
              ? 'No properties synced yet. Click "Trigger Manual Sync" to import properties from Apex27.'
              : "No properties match your filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center">
                      Property
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("agent")}
                  >
                    <div className="flex items-center">
                      Agent
                      <SortIcon field="agent" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center">
                      Price
                      <SortIcon field="price" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("bedrooms")}
                  >
                    <div className="flex items-center">
                      Details
                      <SortIcon field="bedrooms" />
                    </div>
                  </th>
                  <th
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Apex27 ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedProperties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{property.title}</div>
                      <div className="text-sm text-gray-500">{property.postcode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {property.agent?.profile?.first_name} {property.agent?.profile?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Branch: {property.agent?.apex27_branch_id || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        £{property.price.toLocaleString()}
                      </div>
                      <div className="text-xs capitalize text-gray-500">{property.transaction_type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {property.bedrooms > 0 && `${property.bedrooms} bed`}
                      {property.bedrooms > 0 && property.bathrooms > 0 && ", "}
                      {property.bathrooms > 0 && `${property.bathrooms} bath`}
                      {(property.bedrooms > 0 || property.bathrooms > 0) && property.property_type && ", "}
                      {property.property_type && (
                        <span className="capitalize">{property.property_type.replace("_", " ")}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          property.status === "available"
                            ? "bg-green-100 text-green-800"
                            : property.status === "under_offer"
                              ? "bg-blue-100 text-blue-800"
                              : property.status === "sold"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {property.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{property.apex27_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="text-sm text-gray-600">
                Showing {startItem} to {endItem} of {filteredProperties.length} results
              </div>

              <div className="flex items-center gap-2">
                {/* First page */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="First page"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </button>

                {/* Previous page */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`min-w-[2rem] rounded-md px-2 py-1 text-sm ${
                          currentPage === pageNum
                            ? "bg-primary-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                {/* Next page */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Last page */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Last page"
                >
                  <ChevronsRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
