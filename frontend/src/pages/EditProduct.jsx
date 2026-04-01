import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById, updateProduct } from "../api/productApi";

export default function EditProduct() {
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    imageUrl: "",
    price: "",
    stockQty: "",
    priorityTag: "MEDIUM",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProductById();
  }, [id]);

  const fetchProductById = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await getProductById(id);
      const product = response.data.product;

      setFormData({
        name: product.name || "",
        category: product.category || "",
        description: product.description || "",
        imageUrl: product.imageUrl || "",
        price: product.price ?? "",
        stockQty: product.stockQty ?? "",
        priorityTag: product.priorityTag || "MEDIUM",
      });
    } catch (err) {
      console.error("Get product error:", err);
      setError(err?.response?.data?.message || "Failed to load product");
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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stockQty: Number(formData.stockQty),
      };

      const response = await updateProduct(id, payload);
      console.log("Updated product:", response.data);

      setMessage("Product updated successfully!");
    } catch (err) {
      console.error("Update product error:", err);
      setError(err?.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={styles.loading}>Loading product...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Edit Product</h2>

        <form onSubmit={handleUpdate}>
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
            <label>Image URL</label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
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
              step="0.01"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label>Stock Quantity</label>
            <input
              type="number"
              name="stockQty"
              value={formData.stockQty}
              onChange={handleChange}
              required
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

          <button type="submit" disabled={saving} style={styles.button}>
            {saving ? "Updating..." : "Update Product"}
          </button>
        </form>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  formGroup: {
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    marginTop: "6px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  textarea: {
    marginTop: "6px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    minHeight: "100px",
    resize: "vertical",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  success: {
    marginTop: "16px",
    color: "green",
    textAlign: "center",
  },
  error: {
    marginTop: "16px",
    color: "red",
    textAlign: "center",
  },
  loading: {
    textAlign: "center",
    marginTop: "60px",
    fontSize: "18px",
  },
};