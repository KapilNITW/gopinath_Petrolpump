import { Link, NavLink } from "react-router-dom";

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-glass">

            <div className="container-fluid px-4">

                {/* BRAND */}
                <Link
                    to="/daily-sales"
                    className="navbar-brand fw-bold"
                >
                    ⛽ Petrol Pump
                </Link>


                {/* MOBILE TOGGLE */}
                <button
                    className="navbar-toggler border-0"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mainNavbar"
                    aria-controls="mainNavbar"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>


                <div
                    className="collapse navbar-collapse"
                    id="mainNavbar"
                >

                    <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1">

                        {/* DAILY SALES */}
                        <li className="nav-item">
                            <NavLink
                                to="/daily-sales"
                                className={({ isActive }) =>
                                    `nav-link${isActive ? " active" : ""}`
                                }
                            >
                                Daily Sales
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
                                Settlement
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
                                Udhari
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
                                Ledger
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
                                View
                            </button>

                            <ul className="dropdown-menu mt-1">
                                <li>
                                    <Link to="/view/daily-sales" className="dropdown-item">
                                        Daily Sales Records
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/view/daily-settlement" className="dropdown-item">
                                        Settlement Records
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/view/udhari" className="dropdown-item">
                                        Udhari Records
                                    </Link>
                                </li>
                                <li>
                                    <hr className="dropdown-divider" />
                                </li>
                                <li>
                                    <Link to="/view/database" className="dropdown-item">
                                        Database Records
                                    </Link>
                                </li>
                            </ul>
                        </li>

                    </ul>

                </div>

            </div>

        </nav>
    );
}

export default Navbar;
