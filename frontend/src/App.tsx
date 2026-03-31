import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Dashboard from "./routes/dashboard";
import Navbar from "./layout/nav";
import Header from "./layout/header";
import GridHighlighter from "./routes/container";
import GateEntryManagement from "./routes/gate_entry";
import PaymentTab from "./routes/payment";
import ShippingTab from "./routes/shippingTab";
import DriverTab from "./routes/driverTab";
import PlateNumberTab from "./routes/plateNumberTab";
import TransportCompanyTab from "./routes/transportCompanyTab";
import UserTab from "./routes/users";
import PaymentInTab from "./routes/paymentIn";
import { AuthProvider, useAuth } from "./lib/context/auth";
import ProtectedRoute from "./routes/protected-route";
import Login from "./routes/login";

/**
 * AppLayout - The main authenticated shell of the application.
 * Renders the persistent Navbar and Header alongside a scrollable
 * content area that hosts all protected page routes.
 */
const AppLayout = () => {
    const location = useLocation();

    /**
     * Derives a human-readable page title from the current URL pathname.
     * Used by the Header component to display the active section name.
     * Falls back to "Dashboard" for any unrecognised path.
     */
    const getLocation = () => {
        switch (location.pathname) {
            case "/":               return "Dashboard";
            case "/gate":           return "Gate Entry";
            case "/payment":        return "Payment";
            case "/shipping":       return "Shipping Line";
            case "/driver":         return "Drivers";
            case "/plate-no":       return "Plate Numbers";
            case "/transport-company": return "Transport Companies";
            case "/container":      return "Container Grid";
            case "/users":          return "Users";
            case "/paymentIn":      return "PaymentIn";
            default:                return "Dashboard";
        }
    };

    return (
        <div className="flex w-[100vw] h-[100vh] bg-gray-200">
            {/* Persistent side navigation */}
            <Navbar />

            <div className="flex flex-col flex-1">
                {/* Top header bar showing the current page name */}
                <Header headerName={getLocation()} />

                {/* Scrollable content area that fills the remaining vertical space */}
                <div className="flex-1 overflow-auto">
                    <Routes>
                        <Route path="/"                  element={<Dashboard />} />
                        <Route path="/gate"              element={<GateEntryManagement />} />
                        <Route path="/container"         element={<GridHighlighter />} />
                        <Route path="/payment"           element={<PaymentTab />} />
                        <Route path="/shipping"          element={<ShippingTab />} />
                        <Route path="/driver"            element={<DriverTab />} />
                        <Route path="/plate-no"          element={<PlateNumberTab />} />
                        <Route path="/transport-company" element={<TransportCompanyTab />} />
                        <Route path="/users"             element={<UserTab />} />
                        <Route path="/paymentIn"         element={<PaymentInTab />} />
                        {/* Catch-all: redirect any unknown path back to the dashboard */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

/**
 * AppRoutes - Top-level route definitions for the application.
 * Handles auth-aware routing:
 * - Authenticated users visiting /login are redirected to the dashboard.
 * - All other routes are wrapped in ProtectedRoute to enforce authentication.
 */
const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Redirect already-authenticated users away from the login page */}
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />

            {/* All remaining routes are protected — unauthenticated users are redirected to /login */}
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

/**
 * App - Root component of the application.
 * Wraps the entire route tree with AuthProvider so that
 * authentication state is accessible throughout the component tree.
 */
export default function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}