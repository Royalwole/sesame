export default function InlineValidation({ field, errors, touched }) {
  // Remove unused formData parameter
  if (!touched[field] || !errors[field]) return null;

  return (
    <div className="text-xs text-red-500 mt-1 flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 mr-1"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
      {errors[field]}
    </div>
  );
}
