import React from "react";
import { Edit2, Trash2 } from "lucide-react";

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFlowClasses(flow) {
  if (flow === "Heavy") return "bg-red-100 text-red-700";
  if (flow === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function MenstrualRecordTable({
  records,
  currentPage,
  totalPages,
  onEdit,
  onDelete,
  onPrevPage,
  onNextPage,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 border-b border-secondary-100 text-secondary-500 text-sm">
                <th className="px-6 py-4 font-medium">Last Period Date</th>
                <th className="px-6 py-4 font-medium">Duration (Days)</th>
                <th className="px-6 py-4 font-medium">Flow Intensity</th>
                <th className="px-6 py-4 font-medium">Symptoms</th>
                <th className="px-6 py-4 font-medium">Notes</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>

          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-secondary-500"
                >
                  No menstrual records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-secondary-800">
                    {formatDate(record.lastPeriodDate)}
                  </td>

                  <td className="px-6 py-4 text-sm text-secondary-800">
                    {record.cycleLength || "-"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getFlowClasses(
                        record.flowIntensity
                      )}`}
                    >
                      {record.flowIntensity}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {record.symptoms?.length ? (
                        record.symptoms.map((symptom, idx) => (
                          <span
                            key={`${record.id}-${symptom}-${idx}`}
                            className="inline-flex px-2.5 py-1 rounded-full bg-secondary-100 text-secondary-600 text-xs font-medium"
                          >
                            {symptom}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-secondary-400">-</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-secondary-600 max-w-[240px]">
                    <div className="truncate">{record.notes || "-"}</div>
                  </td>


                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(record)}
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                        
                      </button>

                      <button
                        onClick={() => onDelete(record)}
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-t border-secondary-100 bg-white">
        <p className="text-sm text-secondary-500">
          Page {currentPage} of {totalPages || 1}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-secondary-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
          >
            ←
          </button>

          <button
            onClick={onNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-4 py-2 rounded-xl border border-secondary-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-50"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}