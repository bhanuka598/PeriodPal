import { useEffect, useState } from "react";
import { getAllProducts } from "../api/productApi";

export default function AllProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      console.error("Fetch products error:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    alert(`Add to cart: ${product.name}`);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>All Products</h1>

      {loading && <p style={styles.message}>Loading products...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p style={styles.message}>No products found</p>
      )}

      <div style={styles.grid}>
        {products.map((product) => (
          <div key={product._id} style={styles.card}>
            <img
              src={
                product.imageUrl && product.imageUrl.trim() !== ""
                  ? product.imageUrl
                  : "https://via.placeholder.com/300x200?text=No+Image"
              }
              alt={product.name}
              style={styles.image}
            />

            <h2 style={styles.productName}>{product.name}</h2>
            <p style={styles.category}>{product.category}</p>
            <p style={styles.description}>{product.description}</p>

            <p style={styles.price}>Price: ${product.price}</p>
            <p style={styles.stock}>Stock: {product.stockQty}</p>
            <p style={styles.priority}>Priority: {product.priorityTag}</p>

            <button
              style={{
                ...styles.button,
                ...(product.stockQty <= 0 ? styles.disabledButton : {}),
              }}
              onClick={() => handleAddToCart(product)}
              disabled={product.stockQty <= 0}
            >
              {product.stockQty > 0 ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "30px",
    backgroundColor: "#f5f7fb",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#222",
  },
  message: {
    textAlign: "center",
    fontSize: "18px",
    color: "#555",
  },
  error: {
    textAlign: "center",
    fontSize: "18px",
    color: "red",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  image: {
    width: "100%",
    height: "200px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  productName: {
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#222",
  },
  category: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#666",
    marginBottom: "8px",
  },
  description: {
    fontSize: "14px",
    color: "#444",
    marginBottom: "10px",
    minHeight: "50px",
  },
  price: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "6px",
    color: "#111",
  },
  stock: {
    fontSize: "14px",
    marginBottom: "6px",
    color: "#333",
  },
  priority: {
    fontSize: "14px",
    marginBottom: "12px",
    color: "#333",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
  },
};