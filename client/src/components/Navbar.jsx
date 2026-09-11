import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";

function Navbar() {

    const { user, logout } = useContext(AuthContext);
    const { lang, setLang, t } = useLanguage();

    const navigate = useNavigate();

    const handleLogout = () => {

        logout();
        navigate("/login");

    };

    return (

        <nav className="navbar navbar-expand-lg navbar-glass">

            <div className="container-fluid px-4">

                {/* BRAND */}

                <Link
                    to="/daily-sales"
                    className="navbar-brand fw-bold"
                >
                    ⛽ {t("Petrol Pump")}
                </Link>


                {/* MOBILE TOGGLE */}

                <button
                    className="navbar-toggler border-0"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mainNavbar"
                    aria-controls="mainNavbar"
                    aria-expanded="false"
                    aria-label={t("Toggle navigation")}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>


                <div
                    className="collapse navbar-collapse"
                    id="mainNavbar"
                >

                    <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">

                        {user ? (

                            <>

                                {/* DAILY SALES */}

                                <li className="nav-item">

                                    <NavLink
                                        to="/daily-sales"
                                        className={({ isActive }) =>
                                            `nav-link${isActive ? " active" : ""}`
                                        }
                                    >
                                        {t("Daily Sales")}
                                    </NavLink>

                                </li>


                                {/* DAILY SETTLEMENT */}

                                <li className="nav-item">

                                    <NavLink
                                        to="/daily-settlement"
                                        className={({ isActive }) =>
                                            `nav-link${isActive ? " active" : ""}`
                                        }
                                    >
                                        {t("Settlement")}
                                    </NavLink>

                                </li>


                                {/* UDHARI */}

                                <li className="nav-item">

                                    <NavLink
                                        to="/udhari"
                                        className={({ isActive }) =>
                                            `nav-link${isActive ? " active" : ""}`
                                        }
                                    >
                                        {t("Udhari")}
                                    </NavLink>

                                </li>


                                {/* LEDGER */}

                                <li className="nav-item">

                                    <NavLink
                                        to="/ledger"
                                        className={({ isActive }) =>
                                            `nav-link${isActive ? " active" : ""}`
                                        }
                                    >
                                        {t("Ledger")}
                                    </NavLink>

                                </li>


                                {/* VIEW DROPDOWN */}

                                <li className="nav-item dropdown">

                                    <button
                                        className="nav-link dropdown-toggle btn btn-link"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        data-bs-auto-close="true"
                                        aria-expanded="false"
                                    >
                                        {t("View")}
                                    </button>

                                    <ul className="dropdown-menu mt-1">

                                        <li>

                                            <Link
                                                to="/view/daily-sales"
                                                className="dropdown-item"
                                            >
                                                {t("Daily Sales Records")}
                                            </Link>

                                        </li>


                                        <li>

                                            <Link
                                                to="/view/daily-settlement"
                                                className="dropdown-item"
                                            >
                                                {t("Settlement Records")}
                                            </Link>

                                        </li>

{/* 
                                        <li>

                                            <Link
                                                to="/view/udhari"
                                                className="dropdown-item"
                                            >
                                                {t("Udhari Records")}
                                            </Link>

                                        </li> */}


                                        <li>

                                            <hr className="dropdown-divider" />

                                        </li>


                                        <li>

                                            <Link
                                                to="/view/database"
                                                className="dropdown-item"
                                            >
                                                {t("Database Records")}
                                            </Link>

                                        </li>

                                    </ul>

                                </li>

                                {/* ADMIN */}

                                {user.username ===
                                    "kapil6013" && (

                                    <li className="nav-item">

                                        <NavLink
                                            to="/admin/requests"
                                            className={({ isActive }) =>
                                                `nav-link${isActive ? " active" : ""}`
                                            }
                                        >
                                            <i className="bi bi-gear me-1" />
                                            {t("Admin")}
                                        </NavLink>

                                    </li>

                                )}

                            </>

                        ) : null}

                    </ul>


                    {/* RIGHT SIDE: LANGUAGE + AUTH */}

                    <ul className="navbar-nav mb-2 mb-lg-0">

                        {/* LANGUAGE TOGGLE */}

                        <li className="nav-item d-flex align-items-center me-2">
                            <div
                                className="btn-group btn-group-sm"
                                role="group"
                                aria-label={t("Language")}
                            >
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    style={lang === "en"
                                        ? {
                                              backgroundColor: "var(--accent-blue)",
                                              borderColor: "var(--accent-blue)",
                                              color: "#fff",
                                              fontWeight: 700
                                          }
                                        : {
                                              backgroundColor: "transparent",
                                              borderColor: "var(--accent-blue)",
                                              color: "var(--accent-blue)"
                                          }}
                                    onClick={() => setLang("en")}
                                >
                                    EN
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    style={lang === "hi"
                                        ? {
                                              backgroundColor: "var(--accent-blue)",
                                              borderColor: "var(--accent-blue)",
                                              color: "#fff",
                                              fontWeight: 700
                                          }
                                        : {
                                              backgroundColor: "transparent",
                                              borderColor: "var(--accent-blue)",
                                              color: "var(--accent-blue)"
                                          }}
                                    onClick={() => setLang("hi")}
                                >
                                    हिं
                                </button>
                            </div>
                        </li>

                        {user ? (

                            <>

                                <li className="nav-item dropdown">

                                    <button
                                        className="nav-link dropdown-toggle btn btn-link"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <span className="me-1">
                                            {user.username}
                                        </span>
                                    </button>

                                    <ul className="dropdown-menu dropdown-menu-end mt-1">

                                        <li>

                                            <Link
                                                to={`/change-password/${user.username}`}
                                                className="dropdown-item"
                                            >
                                                {t("Change Password")}
                                            </Link>

                                        </li>


                                        {user.username ===
                                            "kapil6013" && (

                                            <li>

                                                <Link
                                                    to="/admin/requests"
                                                    className="dropdown-item"
                                                >
                                                    <i className="bi bi-gear me-1" />
                                                    {t("Admin Panel")}
                                                </Link>

                                            </li>

                                        )}


                                        <li>

                                            <hr className="dropdown-divider" />

                                        </li>


                                        <li>

                                            <button
                                                className="dropdown-item text-danger"
                                                onClick={handleLogout}
                                            >
                                                {t("Logout")}
                                            </button>

                                        </li>

                                    </ul>

                                </li>

                            </>

                        ) : (


                            <>

                                <li className="nav-item">

                                    <NavLink
                                        to="/login"
                                        className={({ isActive }) =>
                                            `nav-link${isActive ? " active" : ""}`
                                        }
                                    >
                                        {t("Login")}
                                    </NavLink>

                                </li>


                                <li className="nav-item">

                                    <NavLink
                                        to="/signup"
                                        className={({ isActive }) =>
                                            `nav-link${isActive ? " active" : ""}`
                                        }
                                    >
                                        {t("Sign Up")}
                                    </NavLink>

                                </li>


                                <li className="nav-item">

                                    <NavLink
                                        to="/admin/login"
                                        className={({ isActive }) =>
                                            `nav-link${isActive ? " active" : ""}`
                                        }
                                    >
                                        <i className="bi bi-gear me-1" />
                                        {t("Admin Login")}
                                    </NavLink>

                                </li>

                            </>

                        )}

                    </ul>

                </div>

            </div>

        </nav>

    );

}

export default Navbar;