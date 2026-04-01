import { useEffect, useState } from "react";
import {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  buildProductFormData,
} from "../api/productApi";

export default function EmployeeProducts() {
  const emptyForm = {
    name: "",
    category: "",
    description: "",
    imageUrl: "",
    price: "",
    stockQty: "",
    priorityTag: "MEDIUM",
  };

  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAllProducts();
      setProducts(response.data.products || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const payload = buildProductFormData(
      {
        ...formData,
        price: Number(formData.price),
        stockQty: Number(formData.stockQty),
      },
      imageFile
    );

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage("Product updated successfully");
      } else {
        await addProduct(payload);
        setMessage("Product added successfully");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setImageFile(null);
    setFormData({
      name: product.name || "",
      category: product.category || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      price: product.price ?? "",
      stockQty: product.stockQty ?? "",
      priorityTag: product.priorityTag || "MEDIUM",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      setMessage("");
      setError("");
      await deleteProduct(id);
      setMessage("Product deleted successfully");
      fetchProducts();

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Employee Products Management</h1>

      <div style={styles.layout}>
        <div style={styles.formCard}>
          <h2 style={styles.cardTitle}>
            {editingId ? "Update Product" : "Add Product"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label>Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Upload Image</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImageFile(file || null);
                  if (file) {
                    setFormData((prev) => ({ ...prev, imageUrl: "" }));
                  }
                }}
                style={styles.input}
              />
              <small style={styles.hint}>
                Upload a JPG, PNG, GIF, or WebP image up to 5MB.
              </small>
              {(previewUrl || formData.imageUrl) && (
                <img
                  src={previewUrl || formData.imageUrl}
                  alt="Product preview"
                  style={styles.previewImage}
                />
              )}
            </div>

            <div style={styles.formGroup}>
              <label>Image URL (optional)</label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => {
                  setImageFile(null);
                  handleChange(e);
                }}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Needed Quantity</label>
              <input
                type="number"
                name="stockQty"
                value={formData.stockQty}
                onChange={handleChange}
                required
                min="0"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Priority Tag</label>
              <select
                name="priorityTag"
                value={formData.priorityTag}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div style={styles.buttonRow}>
              <button type="submit" disabled={saving} style={styles.primaryButton}>
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Adding..."
                  : editingId
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </div>

        <div style={styles.listCard}>
          <h2 style={styles.cardTitle}>All Products</h2>

          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>No products found</p>
          ) : (
            <div style={styles.productList}>
              {products.map((product) => (
                <div key={product._id} style={styles.productItem}>
                  <img
                    src={
                      product.imageUrl && product.imageUrl.trim() !== ""
                        ? product.imageUrl
                        : "https://via.placeholder.com/120x100?text=No+Image"
                    }
                    alt={product.name}
                    style={styles.productImage}
                  />

                  <div style={styles.productInfo}>
                    <h3 style={styles.productName}>{product.name}</h3>
                    <p><strong>Category:</strong> {product.category}</p>
                    <p><strong>Price:</strong> ${product.price}</p>
                    <p><strong>Stock:</strong> {product.stockQty}</p>
                    <p><strong>Priority:</strong> {product.priorityTag}</p>
                    <p style={styles.descText}>
                      <strong>Description:</strong> {product.description || "-"}
                    </p>
                  </div>

                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => handleEdit(product)}
                      style={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6fb",
    padding: "24px",
  },
  heading: {
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: "24px",
    alignItems: "start",
  },
  formCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  listCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  cardTitle: {
    marginBottom: "18px",
    fontSize: "22px",
    color: "#111827",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "14px",
  },
  input: {
    marginTop: "6px",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
  },
  textarea: {
    marginTop: "6px",
    padding: "10px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    minHeight: "90px",
    resize: "vertical",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    marginTop: "8px",
  },
  primaryButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "15px",
    cursor: "pointer",
  },
  secondaryButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#6b7280",
    color: "#fff",
    fontSize: "15px",
    cursor: "pointer",
  },
  success: {
    color: "green",
    marginTop: "14px",
  },
  error: {
    color: "red",
    marginTop: "14px",
  },
  productList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  productItem: {
    display: "grid",
    gridTemplateColumns: "120px 1fr auto",
    gap: "16px",
    alignItems: "start",
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  },
  productImage: {
    width: "120px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  productInfo: {
    color: "#374151",
    fontSize: "14px",
  },
  productName: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    color: "#111827",
  },
  descText: {
    marginTop: "6px",
  },
  actionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  editButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#f59e0b",
    color: "#fff",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
  },
};