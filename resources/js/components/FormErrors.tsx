export default function FormErrors({ errors }: { errors: Record<string, string> }) {
  return Object.keys(errors).length > 0 ? (
    <div className="form-errors" role="alert">
      {Object.entries(errors).map(([key, message]) => (
        <p key={key}>{message}</p>
      ))}
    </div>
  ) : null;
}
