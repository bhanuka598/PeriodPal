import API from "../api/axios";

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

const formatRecord = (record) => ({
  id: record._id,
  lastPeriodDate: formatDate(record.lastPeriodDate),
  cycleLength: record.cycleLength,
  flowIntensity: record.flowIntensity || "Medium",
  symptoms: record.symptoms || [],
  notes: record.notes || "",
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const formatRecords = (data) => {
  if (Array.isArray(data)) {
    return data.map(formatRecord);
  }
  if (Array.isArray(data?.records)) {
    return data.records.map(formatRecord);
  }
  return [];
};

export const recordService = {
  getAllRecords: async () => {
    const res = await API.get("/records");
    return formatRecords(res.data);
  },

  getRecordById: async (id) => {
    const res = await API.get(`/records/${id}`);
    return formatRecord(res.data);
  },

  createRecord: async (recordData) => {
    const res = await API.post("/records", recordData);
    return formatRecord(res.data);
  },

  updateRecord: async (id, recordData) => {
    const res = await API.put(`/records/${id}`, recordData);
    return formatRecord(res.data);
  },

  deleteRecord: async (id) => {
    const res = await API.delete(`/records/${id}`);
    return res.data;
  },

  // Admin only - get all records with beneficiary info
  getAllRecordsAdmin: async (beneficiaryId = null) => {
    const params = beneficiaryId ? { beneficiaryId } : {};
    const res = await API.get("/records/admin/all", { params });
    return {
      records: formatRecords(res.data.records),
      analytics: res.data.analytics,
      pagination: res.data.pagination
    };
  },
};