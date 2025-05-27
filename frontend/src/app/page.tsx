"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { countryCodes } from "./const";
import { z } from "zod";

export default function Home() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
  });

  const schema = z.object({
    email: z.string().email("Invalid Email Address"),
    phone: z.string().regex(selectedCountry.pattern, {
      message: `Invalid ${selectedCountry.name} Phone Format`,
    }),
  });

  const validateForm = () => {
    try {
      const result = schema.safeParse({
        email,
        phone,
      });

      if (!result.success) {
        const formattedErrors = result.error.format();
        setErrors({
          email: formattedErrors.email?._errors[0] || "",
          phone: formattedErrors.phone?._errors[0] || "",
        });
        return false;
      }

      if (!selectedCountry.pattern.test(phone)) {
        setErrors({
          ...errors,
          phone: `Please input valid phone format: ${selectedCountry.name}`,
        });
        return false;
      }

      setErrors({ email: "", phone: "" });
      return true;
    } catch (error) {
      console.error("Invalid Error:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm) {
      return;
    }
    try {
      const fullPhoneNumber = phone;
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiUrl}/api/form/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, phone: fullPhoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage(data.message);
      } else {
        setSubmitMessage(data.message);
      }
    } catch (error) {
      alert(`Submit Failed: ${error}`);
    }
    setIsSubmitting(false);
  };
  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please input valid email format",
      }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  }, [email]);
  return (
    <>
      <Head>
        <title>Contact US</title>
        <meta name="description" content="Please Fill the Form" />
      </Head>

      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Contact US</h1>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-2 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="example@domain.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <div className="flex">
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const selected = countryCodes.find(
                      (cc) => cc.code === e.target.value
                    );
                    if (selected) {
                      setSelectedCountry(selected);
                      setErrors({ ...errors, phone: "" });
                    }
                  }}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {countryCodes.map((country) => (
                    <option key={country.flag} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) {
                      setErrors({ ...errors, phone: "" });
                    }
                  }}
                  required
                  className={`flex-1 px-4 py-2 border-t border-b border-r ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  } rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder={
                    selectedCountry.code === "+86"
                      ? "13800138000"
                      : "1234567890"
                  }
                />
              </div>
              <div className="flex justify-between">
                <p className="mt-1 text-xs text-gray-500">
                  Selected Country: {selectedCountry.name}
                </p>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
              >
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </button>
            </div>

            {submitMessage && (
              <p
                className={`text-center ${
                  submitMessage.includes("Success")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {submitMessage}
              </p>
            )}
          </form>
        </div>
      </main>
    </>
  );
}
