import { useEffect, useState } from "react";
import { addProduct, buildProductFormData } from "../api/productApi";

export default function AddProduct() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    imageUrl: "",
    price: "",
    stockQty: "",
    priorityTag: "HIGH",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      const response = await addProduct(payload);
      console.log("Product added:", response.data);

      setMessage("Product added successfully!");
      window.dispatchEvent(new Event("periodpal:notifications-refresh"));

      setFormData({
        name: "",
        category: "",
        description: "",
        imageUrl: "",
        price: "",
        stockQty: "",
        priorityTag: "HIGH",
      });
      setImageFile(null);
    } catch (err) {
      console.error("Add product error:", err);
      setError(err?.response?.data?.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Add Product</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
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
              placeholder="Enter category"
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
              placeholder="Enter description"
              required
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
              placeholder="Enter image URL"
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
              placeholder="Enter price"
              step="0.01"
              required
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
              placeholder="Enter Needed quantity"
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

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Adding..." : "Add Product"}
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
  hint: {
    marginTop: "6px",
    color: "#64748b",
    fontSize: "12px",
  },
  previewImage: {
    marginTop: "10px",
    width: "100%",
    maxHeight: "220px",
    objectFit: "cover",
    borderRadius: "10px",
    border: "1px solid #ddd",
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
};