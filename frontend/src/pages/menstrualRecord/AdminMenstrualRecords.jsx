import React, { useEffect, useState } from "react";
import { Users, Activity, AlertTriangle, Download, Filter, Search, ChevronDown, FileSpreadsheet } from "lucide-react";
import { recordService } from "../../services/recordService";

function formatShortDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCycleStatus(cycleLength) {
  if (!cycleLength) return { label: "Unknown", color: "text-gray-500", bg: "bg-gray-100" };
  if (cycleLength < 21) return { label: "Short Cycle", color: "text-red-600", bg: "bg-red-50" };
  if (cycleLength > 35) return { label: "Long Cycle", color: "text-orange-600", bg: "bg-orange-50" };
  return { label: "Normal", color: "text-green-600", bg: "bg-green-50" };
}

export function AdminMenstrualRecords() {
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalBeneficiaries: 0,
    totalRecords: 0,
    averageCycleLength: 0,
    irregularCycles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("all");
  const [beneficiaries, setBeneficiaries] = useState([]);

  useEffect(() => {
    fetchAdminRecords();
  }, []);

  const fetchAdminRecords = async () => {
    try {
      setLoading(true);
      const data = await recordService.getAllRecordsAdmin();
      setRecords(data.records);
      setAnalytics(data.analytics);
      
      // Extract unique beneficiaries from records
      const uniqueBeneficiaries = [...new Set(data.records.map(r => r.userId).filter(Boolean))];
      setBeneficiaries(uniqueBeneficiaries);
    } catch (error) {
      console.error("Error fetching admin records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Beneficiary", "Email", "Last Period", "Cycle Length", "Flow", "Symptoms", "Status"];
    const rows = filteredRecords.map(r => [
      r.userId?.username || "Unknown",
      r.userId?.email || "-",
      r.lastPeriodDate,
      r.cycleLength,
      r.flowIntensity,
      r.symptoms?.join("; ") || "-",
      getCycleStatus(r.cycleLength).label
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menstrual-records-admin.csv";
    a.click();
  };

  // Filter records
  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.symptoms?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === "all" || getCycleStatus(record.cycleLength).label.toLowerCase().includes(filterStatus);

    const matchesBeneficiary =
      selectedBeneficiary === "all" || record.userId?._id === selectedBeneficiary;

    return matchesSearch && matchesStatus && matchesBeneficiary;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Menstrual Health Records</h1>
          <p className="mt-2 text-gray-600">Admin dashboard - view and analyze all beneficiary records</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Beneficiaries</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalBeneficiaries}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalRecords}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Cycle Length</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageCycleLength} days</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Irregular Cycles</p>
                <p className="text-2xl font-bold text-red-600">{analytics.irregularCycles}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Export */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search beneficiary or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              {/* Beneficiary Filter */}
              <div className="relative">
                <select
                  value={selectedBeneficiary}
                  onChange={(e) => setSelectedBeneficiary(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent w-full sm:w-48 bg-white"
                >
                  <option value="all">All Beneficiaries</option>
                  {beneficiaries.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.username}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent w-full sm:w-40 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="normal">Normal</option>
                  <option value="short">Short Cycle</option>
                  <option value="long">Long Cycle</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beneficiary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cycle Length
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flow Intensity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symptoms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No records found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const status = getCycleStatus(record.cycleLength);
                    return (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-rose-100 rounded-full flex items-center justify-center">
                              <span className="text-rose-600 font-medium">
                                {(record.userId?.username || "U").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {record.userId?.username || "Unknown User"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.userId?.email || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatShortDate(record.lastPeriodDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.cycleLength} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.flowIntensity === "Heavy"
                                ? "bg-red-100 text-red-800"
                                : record.flowIntensity === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {record.flowIntensity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {record.symptoms?.join(", ") || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.bg} ${status.color}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredRecords.length} of {records.length} records
        </div>
      </div>
    </div>
  );
}
