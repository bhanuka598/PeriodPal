import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  MapPin,
  Boxes,
} from "lucide-react";
import inventoryService from "../services/inventoryService";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    productType: "",
    totalStock: 0,
    centerLocation: "",
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => setSearch(e.target.value);

  const handleAddItemChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newItem,
        totalStock: Number(newItem.totalStock),
      };

      const addedItem = await inventoryService.addItem(payload);
      setItems((prevItems) => [addedItem, ...prevItems]);
      setNewItem({
        productType: "",
        totalStock: 0,
        centerLocation: "",
      });
    } catch (error) {
      console.error("Error adding item:", error);
      alert(error.response?.data?.message || "Error adding item");
    }
  };

  const handleDeleteItem = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    try {
      await inventoryService.deleteItem(id);
      setItems((prevItems) => prevItems.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(error.response?.data?.message || "Error deleting item");
    }
  };

  const handleAdjustStock = async (id, change) => {
    try {
      await inventoryService.adjustStock(id, change);
      await fetchInventory();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert(error.response?.data?.message || "Error adjusting stock");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.productType?.toLowerCase().includes(search.toLowerCase()) ||
      item.centerLocation?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (stock) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= 20) return "Low Stock";
    return "In Stock";
  };

  const getStatusStyles = (stock) => {
    if (stock === 0) {
      return "bg-red-50 text-red-700";
    }
    if (stock <= 20) {
      return "bg-amber-50 text-amber-700";
    }
    return "bg-emerald-50 text-emerald-700";
  };

  const totalItems = filteredItems.length;
  const lowOrOutCount = filteredItems.filter((item) => item.totalStock <= 20).length;
  const totalStockUnits = filteredItems.reduce(
    (sum, item) => sum + Number(item.totalStock || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
          Inventory Management
        </h1>
        <p className="text-secondary-500 mt-1">
          Manage stock levels, track product locations, and monitor low stock alerts.
        </p>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
      >
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100">
              <Boxes className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center text-sm font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live
            </div>
          </div>
          <h3 className="text-secondary-500 text-sm font-medium">Total Items</h3>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{totalItems}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-100">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex items-center text-sm font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              Updated
            </div>
          </div>
          <h3 className="text-secondary-500 text-sm font-medium">Total Stock Units</h3>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{totalStockUnits}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex items-center text-sm font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700">
              <TrendingDown className="h-3 w-3 mr-1" />
              Watch
            </div>
          </div>
          <h3 className="text-secondary-500 text-sm font-medium">Low / Out of Stock</h3>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{lowOrOutCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-secondary-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary-100">
              <CheckCircle2 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex items-center text-sm font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active
            </div>
          </div>
          <h3 className="text-secondary-500 text-sm font-medium">Healthy Stock</h3>
          <p className="text-2xl font-bold text-secondary-900 mt-1">
            {filteredItems.filter((item) => item.totalStock > 20).length}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by product type or location"
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-11 pr-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-800 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-secondary-900">Inventory List</h2>
              <div className="text-sm text-secondary-500">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
              </div>
            </div>

            {loading ? (
              <div className="h-40 flex items-center justify-center text-secondary-500">
                Loading inventory...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-secondary-500">
                <Package className="h-10 w-10 text-secondary-300 mb-3" />
                <p className="font-medium">No inventory items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-secondary-100">
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-600">
                        Item Name
                      </th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-600">
                        Location
                      </th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-600">
                        Stock
                      </th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-3 text-sm font-semibold text-secondary-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-secondary-50 hover:bg-secondary-50/60 transition"
                      >
                        <td className="py-4 px-3 font-medium text-secondary-900">
                          {item.productType}
                        </td>
                        <td className="py-4 px-3 text-secondary-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-secondary-400" />
                            {item.centerLocation}
                          </div>
                        </td>
                        <td className="py-4 px-3 text-secondary-900 font-semibold">
                          {item.totalStock}
                        </td>
                        <td className="py-4 px-3">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                              item.totalStock
                            )}`}
                          >
                            {getStatus(item.totalStock)}
                          </span>
                        </td>
                        <td className="py-4 px-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleAdjustStock(item._id, 1)}
                              className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 transition"
                            >
                              <ArrowUpCircle className="h-4 w-4" />
                              + Stock
                            </button>

                            <button
                              onClick={() => handleAdjustStock(item._id, -1)}
                              className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-amber-100 transition"
                            >
                              <ArrowDownCircle className="h-4 w-4" />
                              - Stock
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="space-y-6">
          {/* Add Item Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 p-6">
            <h2 className="text-lg font-bold text-secondary-900 mb-4">Add Inventory Item</h2>

            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Product Type
                </label>
                <input
                  type="text"
                  name="productType"
                  placeholder="Enter product type"
                  value={newItem.productType}
                  onChange={handleAddItemChange}
                  required
                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-800 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Total Stock
                </label>
                <input
                  type="number"
                  name="totalStock"
                  placeholder="Enter stock quantity"
                  value={newItem.totalStock}
                  onChange={handleAddItemChange}
                  required
                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-800 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Center Location
                </label>
                <input
                  type="text"
                  name="centerLocation"
                  placeholder="Enter center location"
                  value={newItem.centerLocation}
                  onChange={handleAddItemChange}
                  required
                  className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl text-secondary-800 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-4 rounded-xl hover:bg-primary-700 transition"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </form>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-secondary-100 p-6">
            <h2 className="text-lg font-bold text-secondary-900 mb-4">Inventory Notes</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                <p className="text-emerald-800">
                  Stock above 20 is treated as healthy inventory.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <p className="text-amber-800">
                  Stock of 20 or below is considered low stock.
                </p>
              </div>

              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-red-800">
                  Zero stock means the item is out of stock.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;