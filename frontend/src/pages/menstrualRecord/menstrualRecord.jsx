import React, { useEffect , useMemo, useState } from "react";
import { Plus, Calendar, Clock, Activity, Download, X } from "lucide-react";
import MenstrualFilters from "./menstrualFilters";
import MenstrualRecordTable from "./menstrualRecordTable";
import {recordService} from "../../services/recordService";


const PREDEFINED_SYMPTOMS = [
  "Cramps", "Headache", "Bloating", "Fatigue", 
  "Back Pain", "Nausea", "Mood Swings", "Acne"
];


function formatShortDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function calculatePeriodLength(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function calculateStats(records) {
  if (!records || !records.length) {
    return {
      averageCycleLength: 0,
      averagePeriodLength: 0,
      nextPredictedDate: null,
    };
  }

  // records already have cycleLength from backend
  const averageCycleLength = Math.round(
    records.reduce((sum, r) => sum + (r.cycleLength || 0), 0) / records.length
  );

  // We don't explicitly store period length (duration) in backend, 
  // so we'll default to a standard for now or ignore if not available.
  const averagePeriodLength = 5; 

  const sortedByDate = [...records].sort(
    (a, b) => new Date(b.lastPeriodDate) - new Date(a.lastPeriodDate)
  );

  let nextPredictedDate = null;
  if (sortedByDate.length > 0) {
    const lastRecord = sortedByDate[0]; // Most recent
    const next = new Date(lastRecord.lastPeriodDate);
    const cycle = lastRecord.cycleLength || 28;
    next.setDate(next.getDate() + cycle);
    nextPredictedDate = next.toISOString();
  }

  return {
    averageCycleLength,
    averagePeriodLength,
    nextPredictedDate,
  };
}

export default function MenstrualRecord() {
  
  const [records, setRecords] = useState([]);
  const [flowFilter, setFlowFilter] = useState("all");
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
  try {
    const data = await recordService.getAllRecords();
    setRecords(data);
  } catch (error) {
    console.error("Error fetching records:", error);
  }
};

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    flowIntensity: "Medium",
    symptoms: [],
    notes: "",
  });

  const pageSize = 5;
  const stats = useMemo(() => calculateStats(records), [records]);

  const processedRecords = useMemo(() => {
    let updatedRecords = [...records];

    if (flowFilter !== "all") {
      updatedRecords = updatedRecords.filter(
        (record) => record.flowIntensity === flowFilter
      );
    }

    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();

      updatedRecords = updatedRecords.filter((record) => {
        const symptomsText = record.symptoms?.join(" ").toLowerCase() || "";
        const notesText = record.notes?.toLowerCase() || "";
        const flowText = record.flowIntensity?.toLowerCase() || "";
        const dateText = record.lastPeriodDate?.toLowerCase() || "";

        return (
          symptomsText.includes(keyword) ||
          notesText.includes(keyword) ||
          flowText.includes(keyword) ||
          dateText.includes(keyword)
        );
      });
    }

    updatedRecords.sort((a, b) => {
      let firstValue = a[sortBy === "startDate" ? "lastPeriodDate" : sortBy];
      let secondValue = b[sortBy === "startDate" ? "lastPeriodDate" : sortBy];

      if (
        sortBy === "startDate" ||
        sortBy === "lastPeriodDate" ||
        sortBy === "createdAt"
      ) {
        firstValue = new Date(firstValue || 0).getTime();
        secondValue = new Date(secondValue || 0).getTime();
      }

      if (sortOrder === "asc") {
        return firstValue > secondValue ? 1 : -1;
      }

      return firstValue < secondValue ? 1 : -1;
    });

    return updatedRecords;
  }, [records, flowFilter, sortBy, sortOrder, searchTerm]);

  const totalPages = Math.ceil(processedRecords.length / pageSize);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedRecords.slice(startIndex, startIndex + pageSize);
  }, [processedRecords, currentPage]);

  const handleFlowChange = (value) => {
    setFlowFilter(value);
    setCurrentPage(1);
  };

  const handleSortByChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (value) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    
    // We treat lastPeriodDate as startDate for the UI.
    // For endDate, we can estimate it based on cycleLength if we want,
    // but for now let's just use the same date or leave it to user.
    const start = new Date(record.lastPeriodDate);
    const end = new Date(start);
    if (record.cycleLength) {
      end.setDate(start.getDate() + record.cycleLength - 1);
    }

    setFormData({
      startDate: record.lastPeriodDate || "",
      endDate: end.toISOString().split("T")[0],
      flowIntensity: record.flowIntensity || "Medium",
      symptoms: record.symptoms || [],
      notes: record.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the record from ${record.lastPeriodDate}?`
    );

    if (!confirmed) return;

    try {
      await recordService.deleteRecord(record.id);
      fetchRecords(); // Refresh list
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record.");
    }
  };

  const handleOpenCreateModal = () => {
    setSelectedRecord(null);
    setFormData({
      startDate: "",
      endDate: "",
      flowIntensity: "Medium",
      symptoms: [],
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
    setFormData({
      startDate: "",
      endDate: "",
      flowIntensity: "Medium",
      notes: "",
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggleSymptom = (symptom) => {
    setFormData((prev) => {
      const current = prev.symptoms || [];
      const updated = current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom];
      return { ...prev, symptoms: updated };
    });
  };

  const handleDownloadCSV = () => {
    if (!records || records.length === 0) return;

    const headers = ["Last Period Date", "Duration (Days)", "Flow Intensity", "Symptoms", "Notes"];
    const rows = records.map((r) => [
      r.lastPeriodDate,
      r.cycleLength,
      r.flowIntensity,
      (r.symptoms || []).join("; "),
      r.notes.replace(/,/g, " "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `menstrual_records_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert("Please fill start date and end date.");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (end < start) {
      alert("End date cannot be earlier than start date.");
      return;
    }

    // Calculate cycle length for backend (though backend model calls it cycleLength, 
    // it usually means days between periods, but here we'll use it as period duration 
    // or just calculate days between the two dates provided).
    const cycleLength = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const recordData = {
      lastPeriodDate: formData.startDate,
      cycleLength: cycleLength,
      flowIntensity: formData.flowIntensity,
      symptoms: formData.symptoms,
      notes: formData.notes,
    };

    try {
      if (selectedRecord) {
        await recordService.updateRecord(selectedRecord.id, recordData);
      } else {
        await recordService.createRecord(recordData);
      }
      fetchRecords();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving record:", error);
      alert("Failed to save record.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
            Menstrual Records
          </h1>
          <p className="text-secondary-500 mt-1">
            Track your cycle and monitor your health patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-2 bg-white hover:bg-secondary-50 text-secondary-700 py-2.5 px-5 rounded-xl font-medium transition-colors border border-secondary-200 shadow-sm"
          >
            <Download className="h-5 w-5" />
            Download
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-5 rounded-xl font-medium transition-colors shadow-sm shadow-primary-500/20"
          >
            <Plus className="h-5 w-5" />
            Log Period
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Average Cycle Length
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {stats.averageCycleLength || 0} Days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Average Period Length
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {stats.averagePeriodLength || 0} Days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-500">
                Next Predicted
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {stats.nextPredictedDate
                  ? formatShortDate(stats.nextPredictedDate)
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <MenstrualFilters
        flowFilter={flowFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchTerm={searchTerm}
        onFlowChange={handleFlowChange}
        onSortByChange={handleSortByChange}
        onSortOrderChange={handleSortOrderChange}
        onSearchChange={handleSearchChange}
      />

      <MenstrualRecordTable
        records={paginatedRecords}
        currentPage={currentPage}
        totalPages={totalPages}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-secondary-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-secondary-900">
                {selectedRecord ? "Edit Record" : "Log Period"}
              </h3>

              <button
                onClick={handleCloseModal}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="w-full rounded-xl border border-secondary-200 px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full rounded-xl border border-secondary-200 px-3 py-2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Flow Intensity
                </label>
                <select
                  value={formData.flowIntensity}
                  onChange={(e) => handleInputChange("flowIntensity", e.target.value)}
                 
                >
                  <option value="Light">Light</option>
                  <option value="Medium">Medium</option>
                  <option value="Heavy">Heavy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Symptoms
                </label>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_SYMPTOMS.map((symptom) => {
                    const isSelected = formData.symptoms?.includes(symptom);
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => handleToggleSymptom(symptom)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-primary-50 border-primary-200 text-primary-700 shadow-sm"
                            : "bg-white border-secondary-200 text-secondary-500 hover:border-secondary-300"
                        }`}
                      >
                        {symptom}
                        {isSelected && <X className="inline-block ml-1 h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full rounded-xl border border-secondary-200 px-3 py-2.5"
                  placeholder="Add notes..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-secondary-200 text-secondary-700 hover:bg-secondary-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}