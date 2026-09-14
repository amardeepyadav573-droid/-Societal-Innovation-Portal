import "./Loader.css";
export default function Loader({
  fullPage = false
}) {
  return (
    <div
      className={
        fullPage
          ? "loader-full"
          : "loader-container"
      }
    >
      <div className="spinner" />
    </div>
  );
}
