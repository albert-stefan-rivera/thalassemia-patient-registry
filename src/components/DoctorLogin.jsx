import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Stethoscope, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import axios from "axios";

const DoctorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [isLoginForm, setIsLoginForm] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      if (token && window.location.pathname !== "/doctor-dashboard") {
        navigate("/doctor-dashboard");
      }
    }
  }, [navigate]);

  const handleRegisterDoctor = async () => {
    const apiUrl = "/api/auth/signup";
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(apiUrl, {
        email,
        password,
      });

      if (res.status === 201 || res.status === 200) {
        setError("Doctor account registered! You can now log in.");
      } else {
        setError(
          "Registration failed: " + (res.data?.message || "Unexpected response")
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 409) {
        setError("Doctor account already exists. You can log in.");
      } else {
        setError("Registration failed: " + msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    const apiUrl = "/api/auth/login";
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(apiUrl, {
        email,
        password,
      });

      if (res.status === 200) {
        const { idToken } = res.data || {};
        if (idToken) {
          try {
            localStorage.setItem("authToken", idToken);
          } catch {
            // ignore localStorage errors
          }
        }
        navigate("/doctor-dashboard");
      } else {
        setError(
          res.data?.message ||
            "Login failed. Please check your credentials and try again."
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-primary-50 via-white to-medical-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Login Card */}
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Doctor {isLoginForm ? "Login" : "Registration"}
            </h2>
            <p className="text-gray-600 mt-2">Access your medical dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={isLoginForm ? handleLogin : handleRegisterDoctor}
            className="space-y-6"
          >
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="doctor@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLoginForm ? "Signing In..." : "Registering..."}
                </div>
              ) : isLoginForm ? (
                "Sign In"
              ) : (
                "Register"
              )}
            </button>

            {/* Change to Register/Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isLoginForm
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLoginForm(!isLoginForm)}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {isLoginForm ? "Register" : "Login"}
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Having trouble accessing your account?{" "}
            <a
              href="#"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Contact IT Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLogin;
