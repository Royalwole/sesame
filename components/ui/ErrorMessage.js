import React from "react";
import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi";

export default function ErrorMessage({
  title = "An error occurred",
  message = "Something went wrong. Please try again later.",
  actionText = "Go back",
  actionHref = "/",
  icon = <FiAlertTriangle className="h-12 w-12 text-red-400" />,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <Link
        href={actionHref}
        className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-wine hover:bg-wine/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine"
      >
        {actionText}
      </Link>
    </div>
  );
}
