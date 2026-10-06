'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="bn">
      <body>
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>ত্রুটি দেখা দিয়েছে (Something went wrong)</h2>
          <button
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              marginTop: "16px",
              backgroundColor: "#FF6A00",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </body>
    </html>
  );
}
